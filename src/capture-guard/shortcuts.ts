// 캡처 단축키 판별 유틸 — focus-mask와 speed-bumps가 공유한다.
// macOS와 Windows의 화면 캡처 단축키를 모두 감지한다(한 곳만 고치면 양쪽에 반영).
//
// macOS: Cmd+Shift+3(전체)/4(영역)/5(메뉴). Shift가 눌리면 e.key가 '#'·'$'·'%'로
//   바뀌므로 물리 키 코드(e.code)로 본다.
// Windows: PrintScreen(전체→클립보드), Win+PrintScreen, Win+Shift+S(Snip & Sketch).
//   Win+Shift+S는 macOS의 Cmd+Shift+S(앱 단축키)와 물리적으로 같아 오탐 우려가 있어
//   macOS에선 제외한다.
//
// 감지되면 표시용 라벨('Cmd+Shift+4', 'PrintScreen', 'Win+Shift+S')을, 아니면 null.

const isMac = /Mac|iPhone|iPad/.test(
  (typeof navigator !== 'undefined' && navigator.platform) || '',
)

export function captureShortcut(e: KeyboardEvent): string | null {
  // Windows PrintScreen 계열. Win+PrintScreen은 Meta(Win)를 동반한다.
  if (e.key === 'PrintScreen') {
    return e.metaKey ? 'Win+PrintScreen' : 'PrintScreen'
  }
  // macOS 전체/영역/메뉴 캡처: Cmd+Shift+3/4/5
  if (
    e.metaKey &&
    e.shiftKey &&
    ['Digit3', 'Digit4', 'Digit5'].includes(e.code)
  ) {
    return `Cmd+Shift+${e.code.slice(-1)}`
  }
  // Windows 영역 캡처: Win+Shift+S (macOS Cmd+Shift+S 오탐 방지로 mac 제외)
  if (!isMac && e.metaKey && e.shiftKey && e.code === 'KeyS') {
    return 'Win+Shift+S'
  }
  return null
}
