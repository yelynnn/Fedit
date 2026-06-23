// 마스킹된 보호 영역 위에 "🔒 보호 중" 안내 칩을 띄우는 일만 담당한다.
//
// 마스크 필터는 자식·가상요소까지 픽셀화하므로 라벨을 영역 안에 두면 함께 뭉개진다.
// 그래서 영역의 화면 위치에 맞춘 고정(position:fixed) 오버레이를 body 레벨에 띄워
// 라벨만 또렷하게 보이게 한다.
//
// 자연스러움을 위해 칩은 '지연 표시'한다 — 모자이크는 즉시 뜨지만(보안), 안내 칩은
// scheduleShow(delay) 후에야 나타난다. 잠깐 자리를 비웠다 바로 돌아오면(그 전에 hide)
// 칩은 아예 뜨지 않아 깜빡임이 없다.

// 워터마크(2147483646)보다 한 단계 아래 — 추적용 워터마크는 마스크 위에서도 보여야 한다.
const OVERLAY_Z = 2147483640
// 칩 페이드 시간. 라벨은 누출과 무관하므로 부드럽게 등장·퇴장한다.
const FADE_MS = 180
const SUBLABEL = '창으로 돌아오면 자동 해제됩니다'

export class MaskOverlay {
  private readonly selector: string
  private readonly label: string
  private overlays: HTMLElement[] = []
  private showTimer: number | null = null

  constructor(selector: string, label: string) {
    this.selector = selector
    this.label = label
  }

  // delayMs 뒤 안내 칩을 띄운다. 이미 예약/표시 중이면 중복 표시하지 않는다.
  scheduleShow(delayMs: number): void {
    if (this.showTimer !== null || this.overlays.length > 0) return
    if (delayMs <= 0) {
      this.show()
      return
    }
    this.showTimer = window.setTimeout(() => {
      this.showTimer = null
      this.show()
    }, delayMs)
  }

  // 예약을 취소하고 떠 있는 칩을 부드럽게 거둔다.
  hide(): void {
    this.clearShowTimer()
    const overlays = this.overlays
    this.overlays = []
    for (const overlay of overlays) {
      overlay.style.opacity = '0'
      window.setTimeout(() => overlay.remove(), FADE_MS)
    }
  }

  private show(): void {
    document
      .querySelectorAll<HTMLElement>(this.selector)
      .forEach((el) => this.addOverlay(el))
  }

  // 보호 영역의 현재 화면 위치에 맞춰 또렷한 안내 칩을 띄운다.
  // 마스킹은 '잠깐 자리를 비운' 순간에만 켜지므로 레이아웃은 사실상 고정 —
  // 적용 시점의 좌표 한 번으로 충분하다(스크롤 추적은 생략).
  private addOverlay(el: HTMLElement): void {
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const overlay = document.createElement('div')
    Object.assign(overlay.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      display: 'grid',
      placeItems: 'center',
      pointerEvents: 'none',
      zIndex: String(OVERLAY_Z),
      opacity: '0',
      transition: `opacity ${FADE_MS}ms ease`,
      background:
        'radial-gradient(ellipse at center, rgba(10,9,15,0.10), rgba(10,9,15,0.22))',
    } satisfies Partial<CSSStyleDeclaration>)

    const chip = document.createElement('div')
    Object.assign(chip.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      maxWidth: '80%',
      padding: '12px 20px',
      borderRadius: '14px',
      background: 'rgba(22,20,30,0.86)',
      border: '1px solid rgba(170,59,255,0.55)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
      textAlign: 'center',
      font: '600 14px system-ui, "Segoe UI", Roboto, sans-serif',
      color: '#f3f0fa',
      letterSpacing: '0.02em',
    } satisfies Partial<CSSStyleDeclaration>)

    const title = document.createElement('div')
    title.textContent = `🔒 ${this.label}`
    const sub = document.createElement('div')
    sub.textContent = SUBLABEL
    Object.assign(sub.style, {
      font: '400 11.5px system-ui, "Segoe UI", Roboto, sans-serif',
      color: 'rgba(243,240,250,0.72)',
    } satisfies Partial<CSSStyleDeclaration>)

    chip.append(title, sub)
    overlay.appendChild(chip)
    document.body.appendChild(overlay)
    this.overlays.push(overlay)
    // 다음 프레임에 opacity를 올려 페이드인(즉시 1로 두면 전환이 생략됨).
    // 그 사이 이미 hide됐다면 다시 띄우지 않는다.
    requestAnimationFrame(() => {
      if (this.overlays.includes(overlay)) overlay.style.opacity = '1'
    })
  }

  private clearShowTimer(): void {
    if (this.showTimer === null) return
    clearTimeout(this.showTimer)
    this.showTimer = null
  }
}
