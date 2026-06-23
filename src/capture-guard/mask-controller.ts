import type { MaskPainter } from './mask-painter'
import type { MaskOverlay } from './mask-overlay'
import type { FocusIntent, RevealCause } from './focus-signals'

// 이탈 마스킹의 '정책+상태' 책임 — FocusSignals가 보낸 인텐트를 받아 가릴지/풀지를
// 정하고 확정한다. 마스크 상태와 모든 타이머는 여기 한 곳에 모인다.
//
// 핵심 규칙:
//  · 적용은 즉시·동기. blur / 탭 hidden / 캡처 단축키는 그 자리에서 painter.apply().
//    (rAF·지연으로 미루지 않는다 — 미루면 창이 가려진 동안 페인트가 보류돼 캡처가
//    끝난 뒤에야 마스크가 보인다. macOS 영역 캡처에서 어색함의 근원이었다.)
//  · 포인터 이탈만 '주변 신호'라 pointerLeaveDelayMs만큼 늦춘다(옵트인).
//  · 일반 해제는 restoreDelayMs 디바운스 후 document.hasFocus()가 참일 때만 확정.
//
// 캡처 단축키 마스킹의 'sticky(armed)' 처리 — macOS Cmd+Shift+4 영역 캡처 대응:
//  크로스헤어가 떠 있어도 브라우저 창은 포커스를 잃지 않아 hasFocus()가 계속 참이고,
//  사용자가 키를 떼면(드래그 전에 흔히 뗀다) 일반 규칙으론 곧장 풀려 캡처에 원본이
//  찍힌다. 그래서 캡처 단축키로 가리면 'armed' 상태가 되어:
//   - 키를 떼는 신호(shortcut-release)로는 풀지 않는다(캡처가 아직 진행 중일 수 있음).
//   - 캡처 오버레이가 떠 있는 동안 페이지는 어떤 입력도 받지 못하므로, 페이지에서
//     실제 활동(마우스 이동 등)이 다시 감지되거나 포커스가 복귀하면 그때 푼다 —
//     '캡처가 끝나고 사용자가 돌아왔다'는 신뢰 가능한 신호다.
//   - 단축키 직후 짧은 유예(grace) 동안의 활동은 무시한다(키 입력과 거의 동시에
//     스치는 마우스 이동으로 조기 해제되는 것을 막는다).
//   - 어떤 신호도 오지 않으면 안전장치(safety)로 길게 잡았다가 자동 해제한다.

// armed 상태에서 어떤 복귀 신호도 없을 때의 backstop. 느린 영역 선택을 끊지 않도록
// 넉넉히 잡는다(이 동안 진짜 활동이 감지되면 그쪽이 먼저 해제한다).
const SAFETY_TIMEOUT_MS = 6000
// 캡처 단축키 직후, 스치는 활동을 무시하는 유예. 이후의 활동만 '복귀'로 본다.
const ARM_GRACE_MS = 220
// 마스킹 후 안내 칩을 띄우기까지의 지연. 그 전에 복귀하면 칩은 뜨지 않는다.
const OVERLAY_SHOW_DELAY_MS = 150

export interface MaskControllerOptions {
  restoreDelayMs: number
  pointerLeaveDelayMs: number
}

export class MaskController {
  private readonly painter: MaskPainter
  private readonly overlay: MaskOverlay
  private readonly restoreDelayMs: number
  private readonly pointerLeaveDelayMs: number

  private applyTimer: number | null = null
  private removeTimer: number | null = null
  private safetyTimer: number | null = null
  private graceTimer: number | null = null

  // 캡처 단축키로 가린 sticky 상태인지, 그리고 직후 유예 중인지.
  private armed = false
  private graceActive = false

  constructor(
    painter: MaskPainter,
    overlay: MaskOverlay,
    options: MaskControllerOptions,
  ) {
    this.painter = painter
    this.overlay = overlay
    this.restoreDelayMs = options.restoreDelayMs
    this.pointerLeaveDelayMs = options.pointerLeaveDelayMs
  }

  onIntent(intent: FocusIntent): void {
    if (intent.kind === 'conceal') this.onConceal(intent)
    else this.onReveal(intent.cause)
  }

  stop(): void {
    this.clearApplyTimer()
    this.clearRemoveTimer()
    this.clearSafetyTimer()
    this.clearGraceTimer()
    this.armed = false
    this.graceActive = false
    this.painter.remove()
    this.overlay.hide()
  }

  private onConceal(intent: FocusIntent & { kind: 'conceal' }): void {
    // 포인터 이탈만 주변 신호라 늦추고, 나머지(blur·hidden·단축키)는 즉시 가린다.
    const delay = intent.cause === 'pointer-leave' ? this.pointerLeaveDelayMs : 0
    this.scheduleApply(delay)

    if (intent.cause === 'capture-shortcut') {
      // sticky 상태로 진입 — 키를 떼도 풀리지 않고, 복귀 신호에만 풀린다.
      this.armed = true
      this.startGrace()
      this.armSafety()
    }
  }

  private onReveal(cause: RevealCause): void {
    if (this.armed) {
      // 키를 뗀 것만으로는 풀지 않는다 — 캡처가 아직 진행 중일 수 있다.
      if (cause === 'shortcut-release') return
      // 단축키 직후 유예 중의 스치는 활동은 무시한다.
      if (cause === 'activity' && this.graceActive) return
      // 포커스 복귀 / 유예 이후의 페이지 활동 = 캡처 끝, 사용자 복귀.
      this.disarm()
      this.scheduleRemove(this.restoreDelayMs)
      return
    }
    // armed가 아니면, 가려진(또는 가리기 예약된) 상태일 때만 해제를 건다.
    if (!this.painter.isMasked() && this.applyTimer === null) return
    this.scheduleRemove(this.restoreDelayMs)
  }

  // ── 적용/해제 스케줄러 — 서로의 보류 타이머를 취소해 경쟁하지 않는다 ──────────

  private scheduleApply(delayMs: number): void {
    this.clearRemoveTimer()
    // masked=true 상태에서 재호출되면 apply()가 noop이 된다.
    // removeTimer 유무와 무관하게 먼저 강제 해제해 상태를 초기화한다.
    if (this.painter.isMasked()) {
      this.painter.remove()
      this.overlay.hide()
    }
    if (delayMs <= 0) {
      this.apply()
      return
    }
    this.clearApplyTimer()
    this.applyTimer = window.setTimeout(() => {
      this.applyTimer = null
      this.apply()
    }, delayMs)
  }

  private apply(): void {
    this.painter.apply()
    this.overlay.scheduleShow(OVERLAY_SHOW_DELAY_MS)
  }

  // 해제는 '포커스가 실제로 돌아왔을 때만' 확정 — 캡처 진행 중(blur) 우발 해제 방지.
  // delay로 빠른 복귀 깜빡임도 흡수한다.
  private scheduleRemove(delayMs: number): void {
    this.clearApplyTimer()
    const commit = (): void => {
      this.removeTimer = null
      this.painter.remove()
      this.overlay.hide()
    }
    if (delayMs <= 0) {
      commit()
      return
    }
    this.clearRemoveTimer()
    this.removeTimer = window.setTimeout(commit, delayMs)
  }

  // ── armed 상태 관리 ────────────────────────────────────────────────────

  private disarm(): void {
    this.armed = false
    this.graceActive = false
    this.clearGraceTimer()
    this.clearSafetyTimer()
  }

  private startGrace(): void {
    this.graceActive = true
    this.clearGraceTimer()
    this.graceTimer = window.setTimeout(() => {
      this.graceTimer = null
      this.graceActive = false
    }, ARM_GRACE_MS)
  }

  private armSafety(): void {
    this.clearSafetyTimer()
    this.safetyTimer = window.setTimeout(() => {
      this.safetyTimer = null
      this.disarm()
      this.scheduleRemove(0)
    }, SAFETY_TIMEOUT_MS)
  }

  // ── 타이머 정리 헬퍼 ───────────────────────────────────────────────────

  private clearApplyTimer(): void {
    if (this.applyTimer === null) return
    clearTimeout(this.applyTimer)
    this.applyTimer = null
  }

  private clearRemoveTimer(): void {
    if (this.removeTimer === null) return
    clearTimeout(this.removeTimer)
    this.removeTimer = null
  }

  private clearSafetyTimer(): void {
    if (this.safetyTimer === null) return
    clearTimeout(this.safetyTimer)
    this.safetyTimer = null
  }

  private clearGraceTimer(): void {
    if (this.graceTimer === null) return
    clearTimeout(this.graceTimer)
    this.graceTimer = null
  }
}
