import { MaskPainter } from './mask-painter'
import { MaskOverlay } from './mask-overlay'
import { MaskController } from './mask-controller'
import { MosaicFilter } from './mosaic-filter'
import { FocusSignals } from './focus-signals'
import type { FocusMaskOptions } from './types'

// 이탈 마스킹 레이어 — 책임별로 분리된 부품을 조립하는 얇은 파사드.
//
//   FocusSignals   감지   "무슨 일이 일어났나" (blur/포커스/가시성/캡처 단축키 → 인텐트)
//   MaskController 정책   "가릴까/풀까를 정하고 확정" (즉시 적용·디바운스 해제·안전장치)
//   MaskPainter    DOM    "어떻게 가리나" (보호 영역에 CSS filter on/off)
//   MaskOverlay    UI     "안내를 어떻게 보여주나" ("🔒 보호 중" 칩, 지연 표시)
//   MosaicFilter   리소스 "모자이크 필터" (SVG feTile 정의)
//
// 동작 전제(정직하게): 브라우저는 OS 스크린샷을 막을 수 없다. 포커스/가시성 변화로
// 보호 영역을 가려 '잠깐 자리를 비운' 사이의 캡처를 억제할 뿐이다. PrintScreen처럼
// 포커스를 빼앗지 않는 즉시 캡처나, macOS가 단축키 keydown을 가로채 blur가 늦게 오는
// 환경에서는 선제 마스킹이 best-effort다. 그래도 추적(워터마크)·기록(속도방지턱)은 남는다.

const DEFAULTS: Required<FocusMaskOptions> = {
  mode: 'mosaic',
  blurPx: 14,
  pixelSize: 10,
  label: '보안 보호 중',
  proactiveKeyMask: true,
  maskOnWindowBlur: false,
  maskOnPointerLeave: false,
  pointerLeaveDelayMs: 120,
  idleMs: 0,
  restoreDelayMs: 120,
}

export class FocusMask {
  private readonly mosaic: MosaicFilter | null
  private readonly signals: FocusSignals
  private readonly controller: MaskController
  private running = false

  constructor(selector: string, options: FocusMaskOptions = {}) {
    const opts = { ...DEFAULTS, ...options }

    let filterValue: string
    if (opts.mode === 'mosaic') {
      this.mosaic = new MosaicFilter(opts.pixelSize)
      filterValue = this.mosaic.cssValue
    } else {
      this.mosaic = null
      filterValue = `blur(${opts.blurPx}px)`
    }

    const painter = new MaskPainter(selector, filterValue)
    const overlay = new MaskOverlay(selector, opts.label)
    this.controller = new MaskController(painter, overlay, {
      restoreDelayMs: opts.restoreDelayMs,
      pointerLeaveDelayMs: opts.pointerLeaveDelayMs,
    })
    this.signals = new FocusSignals(
      (intent) => this.controller.onIntent(intent),
      {
        proactiveKeyMask: opts.proactiveKeyMask,
        maskOnWindowBlur: opts.maskOnWindowBlur,
        maskOnPointerLeave: opts.maskOnPointerLeave,
        idleMs: opts.idleMs,
      },
    )
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.mosaic?.install()
    this.signals.start()
  }

  stop(): void {
    if (!this.running) return
    this.running = false
    this.signals.stop()
    this.controller.stop()
    this.mosaic?.remove()
  }
}
