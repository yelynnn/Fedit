// Capture Guard — 설정/이벤트 타입.
//
// 핵심 전제: 브라우저는 OS 스크린샷을 막을 수 없다. 이 모듈의 목표는 "차단"이 아니라
// "유출 추적(워터마킹) + 억제(이탈 마스킹/속도방지턱)"이다.

export interface WatermarkOptions {
  /** 0~1, 타일 텍스트 투명도 (낮을수록 옅음) */
  opacity?: number
  /** 텍스트 회전 각도 (deg) */
  angleDeg?: number
  /** 타일 간격(px). 타일 SVG의 한 변 크기이기도 함 */
  gapPx?: number
  fontSizePx?: number
  /** CSS 색상. 밝은/어두운 배경 모두 보이도록 보통 중간톤 사용 */
  color?: string
  /** identity()를 다시 그리는 주기(ms). 시각 갱신 + 무결성 복구 겸용 */
  refreshMs?: number
}

export interface FocusMaskOptions {
  /** 마스킹 효과 종류. 'mosaic'=블록형 픽셀화(기본), 'blur'=가우시안 블러 */
  mode?: 'blur' | 'mosaic'
  /** 이탈 시 보호 영역에 적용할 blur 강도(px). mode가 'blur'일 때 사용 */
  blurPx?: number
  /** 모자이크 블록 크기(px). mode가 'mosaic'일 때 사용 */
  pixelSize?: number
  label?: string
  /**
   * 캡처 단축키 keydown 즉시 선제 마스킹. 기본 true.
   * blur를 기다리지 않고 키를 누르는 순간 가려, 캡처 전에 모자이크가 그려지게 한다.
   * macOS Cmd+Shift+3/4/5 + Windows PrintScreen·Win+Shift+S를 모두 본다.
   * 단, PrintScreen 같은 '즉시 캡처'는 키를 누르는 순간 이미 찍힐 수 있어 best-effort다.
   */
  proactiveKeyMask?: boolean
  /**
   * 커서가 뷰포트 밖으로 나가면 마스킹(OS 캡처 UI·다른 앱으로 이동하는 전조). 기본 false(보수적).
   * 즉시 누출 위험이 아닌 '주변 신호'라 오탐이 잦다 — 다른 모니터/탭바로 마우스만 옮겨도 가려진다.
   * 커버리지를 더 원할 때만 opt-in. 켜면 pointerLeaveDelayMs만큼 늦춰 가장자리 스침 오탐을 줄인다.
   */
  /** 브라우저 창 포커스를 잃을 때 마스킹. 기본 false. */
  maskOnWindowBlur?: boolean
  maskOnPointerLeave?: boolean
  /** 포인터 이탈 후 마스킹까지의 지연(ms). 기본 120. maskOnPointerLeave가 켜졌을 때만 의미. */
  pointerLeaveDelayMs?: number
  /**
   * 무활동 N ms 후 마스킹(0=비활성). 기본 0(보수적). 켜면 거슬림이 커질 수 있어 넉넉한 값 권장.
   * 마우스 이동·키 입력·스크롤 등 활동이 있으면 타이머가 리셋되고 마스킹도 해제된다.
   */
  idleMs?: number
  /**
   * 포커스/가시성 복귀 후 마스킹 해제까지의 디바운스(ms). 기본 120.
   * 빠른 alt-tab 왕복 시 깜빡임(strobe)을 없앤다. 그 사이 다시 가려야 할 이벤트가 오면 해제 취소.
   * 해제는 이 지연 뒤 document.hasFocus()가 참일 때만 확정 — 캡처 진행 중 우발적 해제를 막는다.
   */
  restoreDelayMs?: number
}

/** PrintScreen/캡처 단축키 감지 시 동작 */
export type PrintScreenStrategy = 'off' | 'overwrite-clipboard'

export interface SpeedBumpOptions {
  disableContextMenu?: boolean
  disableSelection?: boolean
  printScreen?: PrintScreenStrategy
}

export type CaptureAttemptType =
  | 'printscreen'
  | 'os-shortcut'
  | 'contextmenu'
  | 'copy'

export interface CaptureAttemptInfo {
  type: CaptureAttemptType
  /** 감지된 키 조합(있을 경우) */
  key?: string
  /** ISO 8601 타임스탬프 */
  at: string
}

export interface CaptureGuardOptions {
  /** 워터마크에 박을 식별 문자열을 반환. 함수형이라 호출 시점마다 갱신(예: 시각) */
  identity: () => string
  watermark?: WatermarkOptions
  focusMask?: FocusMaskOptions
  speedBumps?: SpeedBumpOptions
  /** 캡처 시도 감지 시 호출. 차후 서버 audit 로깅을 붙일 훅 자리 */
  onCaptureAttempt?: (info: CaptureAttemptInfo) => void
  /** 보호 영역 선택자. 기본 '[data-capture-protect]' */
  protectSelector?: string
}
