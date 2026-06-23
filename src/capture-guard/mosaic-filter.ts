// 블록형 모자이크용 SVG 픽셀화 필터의 생애주기만 담당한다.
//
// 캔버스나 외부 라이브러리 없이, CSS `filter: url(#...)`로 임의의 DOM 요소를
// 픽셀화하는 잘 알려진 feTile 해킹을 문서에 주입/제거한다. "언제 가릴지"나
// "어디에 입힐지"는 알지 못한다 — 오직 필터 정의라는 리소스만 관리한다.

const FILTER_ID = 'cg-mosaic'
const CONTAINER_ID = 'cg-mosaic-svg'
const SVG_NS = 'http://www.w3.org/2000/svg'
const MIN_BLOCK_PX = 2

export class MosaicFilter {
  private readonly blockSizePx: number
  private readonly softnessPx: number
  private container: SVGSVGElement | null = null

  // softnessPx: 블록 경계를 흐리는 정도. 미지정 시 블록 크기에 비례해 은은하게.
  constructor(blockSizePx: number, softnessPx?: number) {
    this.blockSizePx = blockSizePx
    this.softnessPx = softnessPx ?? blockSizePx * 0.35
  }

  // 보호 영역에 적용할 CSS filter 값. install() 이후 실제로 동작한다.
  get cssValue(): string {
    return `url(#${FILTER_ID})`
  }

  // 필터 정의를 문서에 한 번만 주입한다.
  install(): void {
    if (document.getElementById(CONTAINER_ID)) return

    const block = Math.max(MIN_BLOCK_PX, Math.round(this.blockSizePx))
    const halfBlock = block / 2
    // 블록 경계를 살짝 흐려 '딱딱한 격자' 대신 은은하고 부드러운 모자이크로 만든다.
    const soften = Math.max(0, this.softnessPx)

    const container = document.createElementNS(SVG_NS, 'svg')
    container.id = CONTAINER_ID
    container.setAttribute('aria-hidden', 'true')
    container.setAttribute(
      'style',
      'position:absolute;width:0;height:0;overflow:hidden',
    )
    // block 크기의 한 픽셀을 타일링해 모자이크 블록을 만든다.
    container.innerHTML =
      `<filter id="${FILTER_ID}" x="0" y="0">` +
      `<feFlood x="${halfBlock}" y="${halfBlock}" width="2" height="2"/>` +
      `<feComposite width="${block}" height="${block}"/>` +
      `<feTile result="tile"/>` +
      `<feComposite in="SourceGraphic" in2="tile" operator="in"/>` +
      `<feMorphology operator="dilate" radius="${halfBlock}"/>` +
      `<feGaussianBlur stdDeviation="${soften}"/>` +
      `</filter>`

    document.body.appendChild(container)
    this.container = container
  }

  // 주입한 필터 정의를 제거한다.
  remove(): void {
    this.container?.remove()
    this.container = null
  }
}
