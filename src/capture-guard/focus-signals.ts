import { captureShortcut } from './shortcuts'

// 이탈 마스킹의 '감지' 책임 — DOM/OS 이벤트를 의미 있는 인텐트로 정규화하기만 한다.
// "언제 가릴지"의 정책·타이머는 갖지 않는다(그건 MaskController의 몫). 여기서는
// 무슨 일이 일어났는지만 즉시 알린다:
//
//  · conceal — 보호 영역이 캡처 위험에 노출됐을 수 있는 신호(창 blur, 탭 숨김,
//    캡처 단축키, 선택적으로 포인터 이탈/유휴).
//  · reveal — 사용자가 돌아왔을 수 있는 신호(창 focus, 탭 표시, 포인터 복귀, 활동).
//
// 보수적 기본값: blur / 탭 hidden / 캡처 단축키만 본다. 포인터 이탈·유휴는 오탐이
// 잦아 기본 비활성이며, opts로만 켠다.

export type ConcealCause =
  | 'blur'
  | 'tab-hidden'
  | 'capture-shortcut'
  | 'pointer-leave'
  | 'idle'

export type RevealCause =
  | 'focus'
  | 'tab-visible'
  | 'pointer-enter'
  | 'activity'
  | 'shortcut-release'

export type FocusIntent =
  | { kind: 'conceal'; cause: ConcealCause; key?: string }
  | { kind: 'reveal'; cause: RevealCause }

export interface FocusSignalsOptions {
  /** 캡처 단축키 keydown을 conceal 신호로 감지. 기본 true. */
  proactiveKeyMask?: boolean
  /** 브라우저 창 포커스를 잃을 때 conceal 신호. 기본 false. */
  maskOnWindowBlur?: boolean
  /** 포인터가 뷰포트를 벗어나면 conceal 신호. 기본 false(보수적). */
  maskOnPointerLeave?: boolean
  /** 무활동 N ms 후 conceal 신호(0=비활성). 기본 0. */
  idleMs?: number
}

// 페이지에서 사용자가 '실제로 활동 중'임을 나타내는 이벤트. 캡처 오버레이(macOS
// 크로스헤어 등)가 떠 있는 동안에는 페이지가 이 이벤트를 전혀 받지 못하므로,
// 캡처가 끝나고 사용자가 돌아왔다는 신뢰 가능한 신호로 쓴다. keydown은 캡처 단축키와
// 겹쳐 오인될 수 있어 제외한다(마우스 복귀로 충분).
const ACTIVITY_EVENTS = [
  'mousemove',
  'wheel',
  'scroll',
  'pointerdown',
  'touchstart',
] as const

export class FocusSignals {
  private readonly emit: (intent: FocusIntent) => void
  private readonly proactiveKeyMask: boolean
  private readonly maskOnPointerLeave: boolean
  private readonly idleMs: number

  private readonly maskOnWindowBlur: boolean
  private running = false
  private idleTimer: number | null = null
  // Cmd+Shift(또는 Win+Shift) 선제 마스킹이 켜져 있는지 — 조합이 깨지면 해제한다.
  private prefixActive = false

  constructor(
    onIntent: (intent: FocusIntent) => void,
    options: FocusSignalsOptions = {},
  ) {
    this.emit = onIntent
    this.proactiveKeyMask = options.proactiveKeyMask ?? true
    this.maskOnWindowBlur = options.maskOnWindowBlur ?? false
    this.maskOnPointerLeave = options.maskOnPointerLeave ?? false
    this.idleMs = options.idleMs ?? 0
  }

  start(): void {
    if (this.running) return
    this.running = true

    document.addEventListener('visibilitychange', this.onVisibilityChange)
    // focus는 blur 해제 재시도 신호이므로 maskOnWindowBlur와 무관하게 항상 등록
    window.addEventListener('focus', this.onWindowFocus)
    if (this.maskOnWindowBlur) {
      window.addEventListener('blur', this.onWindowBlur)
    }

    if (this.proactiveKeyMask) {
      // capture 페이즈로 등록해 다른 핸들러가 가로채기 전 가장 이른 시점에 본다.
      window.addEventListener('keydown', this.onKeyDown, true)
      window.addEventListener('keyup', this.onKeyUp, true)
    }
    if (this.maskOnPointerLeave) {
      const root = document.documentElement
      root.addEventListener('mouseleave', this.onPointerLeave)
      root.addEventListener('mouseenter', this.onPointerEnter)
    }
    // 활동 감지는 유휴 마스킹뿐 아니라 선제 마스킹의 '복귀' 신호로도 쓰이므로,
    // proactiveKeyMask가 켜져 있으면 함께 등록한다.
    if (this.idleMs > 0 || this.proactiveKeyMask) {
      for (const type of ACTIVITY_EVENTS) {
        window.addEventListener(type, this.onActivity, { passive: true })
      }
      if (this.idleMs > 0) this.resetIdleTimer()
    }
  }

  stop(): void {
    this.running = false
    this.prefixActive = false

    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    window.removeEventListener('blur', this.onWindowBlur)
    window.removeEventListener('focus', this.onWindowFocus)
    window.removeEventListener('keydown', this.onKeyDown, true)
    window.removeEventListener('keyup', this.onKeyUp, true)
    const root = document.documentElement
    root.removeEventListener('mouseleave', this.onPointerLeave)
    root.removeEventListener('mouseenter', this.onPointerEnter)
    for (const type of ACTIVITY_EVENTS) {
      window.removeEventListener(type, this.onActivity)
    }
    this.clearIdleTimer()
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.emit({ kind: 'conceal', cause: 'tab-hidden' })
    } else {
      this.emit({ kind: 'reveal', cause: 'tab-visible' })
    }
  }

  private onWindowBlur = (): void => {
    this.emit({ kind: 'conceal', cause: 'blur' })
  }

  private onWindowFocus = (): void => {
    this.emit({ kind: 'reveal', cause: 'focus' })
  }

  // 캡처 단축키를 누르는 즉시 conceal 신호로 본다 — blur를 기다리지 않는다.
  //
  // 두 단계로 잡는다:
  //  1) 완성된 단축키(Cmd+Shift+3 전체, Windows PrintScreen·Win+Shift+S)는 그대로 감지.
  //  2) 선제 마스킹 — Cmd+Shift(또는 Win+Shift)를 '누르고 있는' 순간 미리 가린다.
  //     macOS는 완성된 Cmd+Shift+4(영역 캡처)의 keydown을 OS가 가로채 페이지에 주지
  //     않으므로, 모디파이어 단계에서 잡아야 캡처 결과물에 마스크가 찍힌다. 이때는 아직
  //     창이 포커스 상태라 정상 페인트되어, 곧이은 영역 드래그 캡처에 모자이크가 들어간다.
  //     조합이 깨지면(onKeyUp) 즉시 해제하므로 다른 Cmd+Shift 단축키에는 짧게만 가려진다.
  private onKeyDown = (e: KeyboardEvent): void => {
    const key = captureShortcut(e)
    if (key) {
      this.prefixActive = true
      this.emit({ kind: 'conceal', cause: 'capture-shortcut', key })
      return
    }
    if (e.metaKey && e.shiftKey && !this.prefixActive) {
      this.prefixActive = true
      this.emit({ kind: 'conceal', cause: 'capture-shortcut' })
    }
  }

  // Cmd/Shift 중 하나라도 떼어 조합이 깨지면 선제 마스킹 해제 신호를 보낸다.
  // 실제 캡처였다면 그 사이 blur로 포커스가 빠져, MaskController의 hasFocus() 가드가
  // 해제를 보류한다 — 즉 진짜 캡처 중에는 풀리지 않고 복귀 시에만 풀린다.
  private onKeyUp = (e: KeyboardEvent): void => {
    if (this.prefixActive && !(e.metaKey && e.shiftKey)) {
      this.prefixActive = false
      this.emit({ kind: 'reveal', cause: 'shortcut-release' })
    }
  }

  private onPointerLeave = (): void => {
    this.emit({ kind: 'conceal', cause: 'pointer-leave' })
  }

  private onPointerEnter = (): void => {
    this.emit({ kind: 'reveal', cause: 'pointer-enter' })
  }

  private onActivity = (): void => {
    this.resetIdleTimer()
    this.emit({ kind: 'reveal', cause: 'activity' })
  }

  private resetIdleTimer(): void {
    if (this.idleMs <= 0) return
    this.clearIdleTimer()
    this.idleTimer = window.setTimeout(() => {
      this.idleTimer = null
      if (this.running) this.emit({ kind: 'conceal', cause: 'idle' })
    }, this.idleMs)
  }

  private clearIdleTimer(): void {
    if (this.idleTimer === null) return
    clearTimeout(this.idleTimer)
    this.idleTimer = null
  }
}
