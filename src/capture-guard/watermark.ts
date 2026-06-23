import type { WatermarkOptions } from './types'

// 동적 워터마킹 오버레이.
//
// 캡처 자체를 막지는 못한다. 대신 화면 전체에 사용자 식별정보를 반복 타일로 새겨,
// 유출본이 돌아다닐 때 "누가 흘렸는지"를 추적 가능하게 만든다. 이것이 일반 사용자
// 대상 억제력의 핵심이다.
//
// devtools로 오버레이를 지우거나 숨기려는 시도는 MutationObserver + 주기적
// 무결성 체크로 즉시 되살린다.

const CONTAINER_ID = 'capture-guard-watermark'
const Z_INDEX = 2147483646 // 토스트(2147483647) 바로 아래

const DEFAULTS: Required<WatermarkOptions> = {
  opacity: 0.14,
  angleDeg: -30,
  gapPx: 230,
  fontSizePx: 15,
  color: '#808080',
  refreshMs: 1000,
}

export class Watermark {
  private identity: () => string
  private opts: Required<WatermarkOptions>
  private container: HTMLDivElement | null = null
  private observer: MutationObserver | null = null
  private timer: number | null = null
  private running = false

  constructor(identity: () => string, opts: WatermarkOptions = {}) {
    this.identity = identity
    this.opts = { ...DEFAULTS, ...opts }
  }

  start(): void {
    if (this.running) return
    this.running = true

    this.revive()

    // 주기적 재그리기: 식별 텍스트(시각)를 갱신하고, 통째로 사라졌다면 복구
    this.timer = window.setInterval(() => this.revive(), this.opts.refreshMs)

    // 즉각 복구: 오버레이 제거/숨김 시도를 감지
    this.observer = new MutationObserver(() => {
      if (!this.running) return
      if (!this.container || !document.body.contains(this.container)) {
        this.container = null
        this.revive()
      } else if (this.isHidden(this.container)) {
        this.applyContainerStyle(this.container)
      }
    })
    this.observer.observe(document.body, { childList: true })
  }

  stop(): void {
    this.running = false
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.container = null
  }

  /** 오버레이 존재 보장 + 최신 식별 텍스트로 다시 그림 */
  private revive(): void {
    if (!this.container || !document.body.contains(this.container)) {
      const el = document.createElement('div')
      el.id = CONTAINER_ID
      el.setAttribute('aria-hidden', 'true')
      this.applyContainerStyle(el)
      document.body.appendChild(el)
      this.container = el
      // 새 컨테이너의 속성 변조(style/class)도 관찰
      this.observer?.observe(el, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      })
    }
    this.draw()
  }

  private draw(): void {
    if (!this.container) return
    const svg = this.buildSvg(this.identity())
    const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
    this.container.style.backgroundImage = url
  }

  private applyContainerStyle(el: HTMLElement): void {
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      `z-index:${Z_INDEX}`,
      'display:block',
      'opacity:1',
      'visibility:visible',
      'background-repeat:repeat',
    ].join(';')
  }

  private isHidden(el: HTMLElement): boolean {
    const s = el.style
    return (
      s.display === 'none' ||
      s.visibility === 'hidden' ||
      s.opacity === '0'
    )
  }

  private buildSvg(text: string): string {
    const { gapPx, fontSizePx, color, opacity, angleDeg } = this.opts
    const c = gapPx / 2
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${gapPx}" height="${gapPx}">` +
      `<text x="${c}" y="${c}" fill="${color}" fill-opacity="${opacity}" ` +
      `font-family="sans-serif" font-size="${fontSizePx}" text-anchor="middle" ` +
      `transform="rotate(${angleDeg} ${c} ${c})">${escapeXml(text)}</text>` +
      `</svg>`
    )
  }
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (ch) => {
    switch (ch) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      default:
        return '&quot;'
    }
  })
}
