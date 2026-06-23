import { FocusMask } from './focus-mask'
import { SpeedBumps } from './speed-bumps'
import { Watermark } from './watermark'
import type { CaptureGuardOptions } from './types'

// CaptureGuard — 세 레이어(워터마킹 / 이탈 마스킹 / 속도방지턱)를 조립하고
// 생명주기를 관리하는 프레임워크 무관 진입점.
//
// 사용 예:
//   const guard = new CaptureGuard({ identity: () => `${email} · ${new Date().toISOString()}` })
//   guard.start()
//   ...
//   guard.stop()

const DEFAULT_SELECTOR = '[data-capture-protect]'

export class CaptureGuard {
  private watermark: Watermark
  private focusMask: FocusMask
  private speedBumps: SpeedBumps

  constructor(options: CaptureGuardOptions) {
    const selector = options.protectSelector ?? DEFAULT_SELECTOR
    const onAttempt = options.onCaptureAttempt ?? (() => {})

    // 마스킹(이탈 마스킹)과 키 감지(속도방지턱)는 독립적이다. 캡처 키는 기록·클립보드
    // 무력화의 신호일 뿐, 마스킹은 포커스/가시성 변화로만 구동한다(실무 표준).
    this.watermark = new Watermark(options.identity, options.watermark)
    this.focusMask = new FocusMask(selector, options.focusMask)
    this.speedBumps = new SpeedBumps(
      selector,
      options.speedBumps ?? {},
      onAttempt,
    )
  }

  start(): void {
    this.watermark.start()
    this.focusMask.start()
    this.speedBumps.start()
  }

  stop(): void {
    this.watermark.stop()
    this.focusMask.stop()
    this.speedBumps.stop()
  }

  // 개별 레이어 토글 (데모/런타임 제어용)
  setWatermark(on: boolean): void {
    if (on) this.watermark.start()
    else this.watermark.stop()
  }
  setFocusMask(on: boolean): void {
    if (on) this.focusMask.start()
    else this.focusMask.stop()
  }
  setSpeedBumps(on: boolean): void {
    if (on) this.speedBumps.start()
    else this.speedBumps.stop()
  }
}

export { Watermark } from './watermark'
export { FocusMask } from './focus-mask'
export { SpeedBumps } from './speed-bumps'
export type {
  CaptureGuardOptions,
  CaptureAttemptInfo,
  CaptureAttemptType,
  WatermarkOptions,
  FocusMaskOptions,
  SpeedBumpOptions,
  PrintScreenStrategy,
} from './types'
