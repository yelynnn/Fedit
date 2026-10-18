// 서비스 워커: 툴바 아이콘을 누르면 사이드패널을 연다.
// (로그인 토큰 동기화는 content/fedit-auth-sync.js 가 chrome.storage 로 직접 한다.)
const enablePanel = () => chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
chrome.runtime.onInstalled.addListener(enablePanel);
chrome.runtime.onStartup.addListener(enablePanel);
