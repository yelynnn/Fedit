// FEDIT 웹 페이지 안에서 실행된다. 웹의 로그인 토큰(localStorage)과 확장의 토큰(chrome.storage)을 맞춘다.
// 서버는 회원당 refresh token 하나를 로테이션하므로(직전 토큰 60초 유예) 양쪽이 같은 토큰을 써야 한다.
// 규칙: refresh token 발급 시각(iat)이 더 최근인 쪽이 이긴다. 페이지를 보는 중 토큰이 사라지면 로그아웃으로 본다.
// lib/tokens.js 와 같은 키·규칙(콘텐츠 스크립트는 모듈을 못 써서 복사해 둔다).
(() => {
  const KEY = "feditAuth";
  const ACCESS = "accessToken";
  const REFRESH = "refreshToken";
  let hadTokens = false;

  const iat = (jwt) => {
    try {
      const p = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return Number(JSON.parse(atob(p.padEnd(p.length + ((4 - (p.length % 4)) % 4), "="))).iat) || 0;
    } catch {
      return 0;
    }
  };
  const readWeb = () => ({ accessToken: localStorage.getItem(ACCESS), refreshToken: localStorage.getItem(REFRESH) });
  const writeWeb = (t) => {
    localStorage.setItem(ACCESS, t.accessToken);
    localStorage.setItem(REFRESH, t.refreshToken);
  };

  // 확장을 새로고침·업데이트하면 이미 열려 있던 페이지의 이 스크립트는 확장과 연결이 끊긴다
  // (chrome.storage 호출 시 "Extension context invalidated"). 그때는 조용히 멈추고,
  // 페이지를 새로 열면 새 스크립트가 다시 동기화한다.
  let timer = null;
  const alive = () => {
    try { return Boolean(chrome.runtime && chrome.runtime.id); } catch { return false; }
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    window.removeEventListener("focus", run);
    document.removeEventListener("visibilitychange", onVisible);
  };
  function run() {
    if (!alive()) return stop();
    sync().catch((e) => {
      if (!alive() || /context invalidated/i.test(String(e && e.message))) stop();
    });
  }
  function onVisible() { if (!document.hidden) run(); }

  async function sync() {
    let web;
    try { web = readWeb(); } catch { return; }
    const { [KEY]: ext } = await chrome.storage.local.get(KEY);

    if (!web.accessToken || !web.refreshToken) {
      // 이 페이지에서 로그인돼 있다가 토큰이 사라졌으면 로그아웃
      if (hadTokens) {
        hadTokens = false;
        await chrome.storage.local.remove(KEY);
      }
      return;
    }
    hadTokens = true;
    if (!ext || !ext.refreshToken) {
      await chrome.storage.local.set({ [KEY]: web });
      return;
    }
    const w = iat(web.refreshToken);
    const e = iat(ext.refreshToken);
    if (e > w) {
      writeWeb(ext);                                   // 확장이 더 최근에 갱신함
    } else if (w > e || web.accessToken !== ext.accessToken) {
      await chrome.storage.local.set({ [KEY]: web });  // 웹이 더 최근(또는 access token 만 바뀜)
    }
  }

  // 확장(사이드패널)이 토큰을 갱신하면 바로 웹에도 반영
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[KEY]) run();
  });

  run();
  timer = setInterval(run, 3000);
  window.addEventListener("focus", run);
  document.addEventListener("visibilitychange", onVisible);
})();
