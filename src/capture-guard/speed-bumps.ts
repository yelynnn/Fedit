import { captureShortcut } from './shortcuts'
import type {
  CaptureAttemptInfo,
  SpeedBumpOptions,
} from './types'

// 속도방지턱(speed bumps).
//
// 우클릭/드래그선택/복사를 보호 영역에서 막고, PrintScreen·macOS 캡처 단축키를
// 감지하면 클립보드를 더미 텍스트로 덮어쓴다.
//
// 분명히 해둘 것: 이건 "보안"이 아니라 마찰이다. 작정한 사용자는 전부 우회한다.
// 워터마킹(추적)과 함께 깔릴 때만 의미가 있는 보조 레이어다.

const DEFAULTS: Required<SpeedBumpOptions> = {
  disableContextMenu: true,
  disableSelection: true,
  printScreen: 'overwrite-clipboard',
}

const DUMMY_CLIPBOARD =
  '⚠ 이 콘텐츠는 보호되어 있으며 무단 캡처·복제는 추적·기록됩니다.'

const STYLE_ID = 'capture-guard-noselect'

export class SpeedBumps {
  private selector: string
  private opts: Required<SpeedBumpOptions>
  private onAttempt: (info: CaptureAttemptInfo) => void
  private running = false
  private styleEl: HTMLStyleElement | null = null

  constructor(
    selector: string,
    opts: SpeedBumpOptions,
    onAttempt: (info: CaptureAttemptInfo) => void,
  ) {
    this.selector = selector
    this.opts = { ...DEFAULTS, ...opts }
    this.onAttempt = onAttempt
  }

  start(): void {
    if (this.running) return
    this.running = true

    if (this.opts.disableContextMenu) {
      document.addEventListener('contextmenu', this.onContextMenu)
    }
    if (this.opts.disableSelection) {
      document.addEventListener('selectstart', this.onSelectStart)
      document.addEventListener('copy', this.onCopy)
      this.injectNoSelectStyle()
    }
    if (this.opts.printScreen !== 'off') {
      window.addEventListener('keyup', this.onKeyUp)
      window.addEventListener('keydown', this.onKeyDown)
    }
  }

  stop(): void {
    this.running = false
    document.removeEventListener('contextmenu', this.onContextMenu)
    document.removeEventListener('selectstart', this.onSelectStart)
    document.removeEventListener('copy', this.onCopy)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('keydown', this.onKeyDown)
    this.styleEl?.remove()
    this.styleEl = null
  }

  private inProtected(target: EventTarget | null): boolean {
    return (
      target instanceof Element && target.closest(this.selector) !== null
    )
  }

  private now(): string {
    return new Date().toISOString()
  }

  private onContextMenu = (e: MouseEvent): void => {
    if (!this.inProtected(e.target)) return
    e.preventDefault()
    this.onAttempt({ type: 'contextmenu', at: this.now() })
  }

  private onSelectStart = (e: Event): void => {
    if (this.inProtected(e.target)) e.preventDefault()
  }

  private onCopy = (e: ClipboardEvent): void => {
    if (!this.inProtected(e.target)) return
    e.preventDefault()
    e.clipboardData?.setData('text/plain', DUMMY_CLIPBOARD)
    this.onAttempt({ type: 'copy', at: this.now() })
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    // PrintScreen은 keydown이 누락되는 경우가 많아 keyup에서 감지
    if (e.key === 'PrintScreen') {
      this.handleScreenshotKey('printscreen', 'PrintScreen')
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // 캡처 단축키: macOS Cmd+Shift+3/4/5, Windows Win+Shift+S (OS가 가로채 항상 잡히진 않음).
    // PrintScreen 계열은 keydown이 누락되는 경우가 많아 아래 onKeyUp에서 단독으로 잡는다.
    const key = captureShortcut(e)
    if (key && !key.includes('PrintScreen')) {
      this.handleScreenshotKey('os-shortcut', key)
    }
  }

  private handleScreenshotKey(
    type: CaptureAttemptInfo['type'],
    key: string,
  ): void {
    if (this.opts.printScreen === 'overwrite-clipboard') {
      // 방금 찍힌 화면을 붙여넣으려 할 때 클립보드를 무력화
      navigator.clipboard?.writeText(DUMMY_CLIPBOARD).catch(() => {
        /* 권한/포커스 문제 시 무시 — 베스트에포트 */
      })
    }
    this.onAttempt({ type, key, at: this.now() })
  }

  private injectNoSelectStyle(): void {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent =
      `${this.selector}, ${this.selector} * {` +
      'user-select:none !important;-webkit-user-select:none !important;' +
      '-webkit-touch-callout:none !important;}'
    document.head.appendChild(style)
    this.styleEl = style
  }
}
