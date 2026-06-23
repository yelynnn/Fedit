// 보호 영역(selector)에 CSS filter 마스크를 입히고 거두는 일만 담당한다.
//
// "어떤 효과(모자이크/블러)인지"는 생성 시 받은 filterValue로 고정되고,
// "언제 가릴지"는 호출자(MaskController)가 apply()/remove()로 정한다.
// 마스킹 전의 인라인 filter를 보관했다가 그대로 복원하며, 중복 호출에는 멱등하게 동작한다.
//
// 안내 라벨/오버레이는 이 클래스의 책임이 아니다 — MaskOverlay가 따로 그린다.
// (filter는 자식·가상요소까지 픽셀화하므로 라벨을 영역 안에 두면 함께 뭉개지기 때문.)

// 마스킹 직전의 인라인 filter 값을 잠시 보관하는 dataset 키.
const PREVIOUS_FILTER_KEY = 'cgPrevFilter'
// 마스킹 중임을 나타내는 표식(테스트·외부 스타일 훅용).
const MASKED_ATTRIBUTE = 'data-cg-masked'
const TRANSITION_IN = 'filter 80ms ease-in'
const TRANSITION_OUT = 'filter 280ms ease-out'

export class MaskPainter {
  private readonly selector: string
  private readonly filterValue: string
  private masked = false

  constructor(selector: string, filterValue: string) {
    this.selector = selector
    this.filterValue = filterValue
  }

  // 현재 가려진 상태인지. 코디네이터가 멱등 판단·해제 조건에 쓴다.
  isMasked(): boolean {
    return this.masked
  }

  // 보호 영역을 가린다. 이미 가려져 있으면 무시한다
  // (재호출 시 보관 중인 원래 filter가 마스크 값으로 덮어써지는 것을 막는다).
  // 캡처 누출을 막기 위해 filter는 페이드 없이 '즉시' 입힌다 — 전환 중인 프레임이
  // 덜 가려진 채 찍히는 것을 방지한다.
  apply(): void {
    if (this.masked) return
    this.masked = true
    this.eachTarget((el) => {
      el.dataset[PREVIOUS_FILTER_KEY] = el.style.filter
      el.style.transition = TRANSITION_IN
      el.style.filter = this.filterValue
      el.setAttribute(MASKED_ATTRIBUTE, '')
    })
  }

  // 마스킹을 거두고 원래 filter로 되돌린다. 가려져 있지 않으면 무시한다.
  // 해제는 부드럽게 페이드아웃해도 누출 위험이 없으므로 전환을 준다.
  remove(): void {
    if (!this.masked) return
    this.masked = false
    this.eachTarget((el) => {
      el.style.transition = TRANSITION_OUT
      el.style.filter = el.dataset[PREVIOUS_FILTER_KEY] ?? ''
      delete el.dataset[PREVIOUS_FILTER_KEY]
      el.removeAttribute(MASKED_ATTRIBUTE)
    })
  }

  private eachTarget(visit: (el: HTMLElement) => void): void {
    document.querySelectorAll<HTMLElement>(this.selector).forEach(visit)
  }
}
