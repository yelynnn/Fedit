# 크롬 웹스토어 제출 문구

개발자 대시보드(https://chrome.google.com/webstore/devconsole) 각 칸에 그대로 붙여 넣는 용도.

---

## 1. 스토어 등록정보 (Store listing)

**이름** — manifest 의 `name` 이 그대로 쓰임
FEDIT – 패션 상품 저장·분석

**요약 (manifest `description`, 132자 이내)**
보고 있는 쇼핑몰 상품을 AI로 분석하고, 비슷한 상품을 찾고, FEDIT 내 보드에 저장합니다.

**상세 설명**
```
FEDIT은 패션 MD·디자이너를 위한 트렌드 분석 서비스입니다.
FEDIT 크롬 확장을 쓰면 쇼핑몰에서 보고 있는 상품을 페이지를 떠나지 않고 바로 분석하고 저장할 수 있습니다.

■ 이렇게 써요
1. 쇼핑몰 상품 페이지에서 툴바의 FEDIT 아이콘을 누르면 옆에 패널이 열립니다.
2. 패널에 상품 이미지·이름·브랜드·가격이 자동으로 표시됩니다.
3. "AI로 분석하기"를 누르면 유형·소재·색상·기장·핏·넥라인·패턴·무드·계절감을 AI가 정리해 줍니다.
4. 분석 결과 아래에서 FEDIT 데이터베이스 속 비슷한 상품을 함께 볼 수 있습니다.
5. 마음에 들면 "내 보드에 저장" — FEDIT 웹사이트의 내 보드에서 다시 모아 볼 수 있습니다.

■ 이런 분께 좋아요
· 경쟁사·플랫폼 상품을 엑셀에 복사해 붙여 넣으며 시장조사를 하던 분
· 레퍼런스 상품을 무드보드로 모아 기획에 쓰는 분
· 비슷한 스타일의 상품이 어디에 얼마에 나와 있는지 빠르게 보고 싶은 분

■ 지원 쇼핑몰
무신사, 29CM, W컨셉, 자라, COS, H&M, 유니클로, SSF샵, LF몰, 더한섬닷컴, KREAM, 에이블리, 지그재그, 머스트잇.
그 밖의 쇼핑몰은 패널의 "이 사이트에서 FEDIT 사용하기"를 눌러 사이트별로 허용하면 쓸 수 있습니다.

■ 이용 안내
· FEDIT 계정이 필요합니다(https://fedit.mify.im 에서 가입·로그인하면 확장에도 자동으로 로그인됩니다).
· 무료 요금제는 매달 AI 분석 30회까지 쓸 수 있습니다(Basic 100회 · Pro 300회). 더 많이 쓰려면 FEDIT 웹사이트에서 유료 요금제를 이용해 주세요.
· 확장은 패널이 열려 있을 때 보고 있는 상품 페이지의 공개된 상품 정보만 읽으며, 방문 기록을 모으지 않습니다.

문의: team.mify@gmail.com
```

**카테고리** — 생산성 (Productivity)
(쇼핑 카테고리도 가능하지만, 구매 도구가 아니라 업무용 분석·저장 도구라 생산성이 더 맞음)

**언어** — 한국어

**웹사이트** — https://fedit.mify.im
**지원 이메일** — team.mify@gmail.com

---

## 2. 개인정보 보호 관행 (Privacy practices)

### 단일 목적 (Single purpose)
```
사용자가 보고 있는 쇼핑몰 상품 페이지의 상품 정보를 읽어 FEDIT으로 AI 분석하고, 비슷한 상품을 보여주고, 사용자의 FEDIT 보드에 저장하는 것.
```

### 권한 사용 사유 (Permission justification)

**sidePanel**
```
확장의 모든 기능(상품 정보 표시, AI 분석 결과, 비슷한 상품, 보드 저장)을 쇼핑몰 페이지 옆 사이드패널에서 제공하기 위해 사용합니다. 사용자가 툴바 아이콘을 누르면 패널이 열립니다.
```

**activeTab**
```
사용자가 툴바 아이콘을 눌러 패널을 연 탭에 한해, 그 페이지의 상품 정보를 읽기 위해 사용합니다. 기본 지원 목록에 없는 쇼핑몰에서도 사용자가 직접 연 탭은 읽을 수 있게 합니다.
```

**scripting**
```
현재 탭의 상품 페이지에서 상품명·브랜드·가격·대표 이미지 등 공개된 상품 정보(JSON-LD 구조화 데이터, og 메타 태그)를 한 번 읽어 오는 함수를 실행하기 위해 사용합니다. 페이지 내용을 바꾸거나 계속 실행되는 스크립트를 넣지 않습니다.
```

**storage**
```
FEDIT 로그인 토큰과 사용자가 마지막으로 고른 보드를 브라우저에 저장해, 패널을 열 때마다 다시 로그인하거나 보드를 고르지 않아도 되게 하기 위해 사용합니다.
```

**호스트 권한 (host_permissions)**
```
· https://mify.kro.kr/* — FEDIT API 서버. AI 분석 요청, 분석 결과·비슷한 상품 조회, 보드 저장에 사용합니다.
· 무신사, 29CM, W컨셉, 자라, COS, H&M, 유니클로, SSF샵, LF몰, 더한섬닷컴, KREAM, 에이블리, 지그재그, 머스트잇 — FEDIT 사용자(패션 MD·디자이너)가 가장 많이 보는 쇼핑몰입니다. 패널을 연 상태로 상품을 넘겨 볼 때(탭 전환·페이지 이동) 매번 아이콘을 다시 누르지 않아도 상품 정보를 읽을 수 있게 하기 위해 필요합니다. 이 사이트들에서도 패널이 열려 있을 때만, 보고 있는 상품 페이지의 공개된 상품 정보만 읽습니다.
· 콘텐츠 스크립트(fedit.mify.im) — FEDIT 웹사이트에 로그인한 상태를 확장과 맞추기 위해, FEDIT 자체 도메인에서만 로그인 토큰을 동기화합니다.
```

**선택 호스트 권한 (optional_host_permissions: https://*/*)**
```
기본 목록에 없는 쇼핑몰은 설치 시 권한을 요청하지 않습니다. 사용자가 패널에서 "이 사이트에서 FEDIT 사용하기"를 직접 눌렀을 때만, 그 사이트에 대해 크롬 권한 창으로 허용을 요청합니다.
```

**원격 코드 (Remote code)** — "아니요, 원격 코드를 사용하지 않습니다" 선택.
(모든 JS 가 확장 패키지 안에 있고, 서버에서는 JSON 데이터만 받음)

### 데이터 사용 (Data usage) 체크
수집 항목 — 체크할 것:
- [x] 인증 정보 (Authentication information) — 로그인 토큰
- [x] 웹사이트 콘텐츠 (Website content) — 상품명·이미지·가격 등 상품 페이지 정보
- [x] 웹 기록 (Web history) — 분석을 요청한 상품 페이지의 URL. 보수적으로 체크(미체크 후 반려되는 경우가 더 흔함)

체크하지 않는 항목: 개인 식별 정보, 건강, 금융·결제, 개인 커뮤니케이션, 위치, 사용자 활동(클릭·키 입력 추적 없음)

인증 3개 모두 체크:
- [x] 승인된 사용 사례 외의 목적으로 제3자에게 판매하거나 전송하지 않음
- [x] 단일 목적과 관련 없는 목적으로 사용하거나 전송하지 않음
- [x] 신용도 판단·대출 목적으로 사용하거나 전송하지 않음

**개인정보처리방침 URL** — https://fedit.mify.im/extension-privacy.html
(Front-end 배포 후 열리는지 확인)

---

## 3. 배포 (Distribution)
- 공개 범위: 처음엔 **비공개(Unlisted)** 로 올려 링크 받은 사람만 설치 → 베타 사용자 피드백 후 공개 전환 추천
- 지역: 대한민국(필요하면 전체)

---

## 4. 제출 전 체크
- [ ] 128px 아이콘 원본으로 교체 (`extension/icons/icon128.png`, 실제 그림은 96×96 + 사방 16px 여백 권장)
- [ ] 스크린샷 1~5장 (1280×800 또는 640×400, PNG/JPEG) — `extension/store/screenshots/`
- [ ] 작은 프로모션 타일 440×280 (선택이지만 있으면 검색 노출에 유리)
- [ ] manifest 에서 개발용 `http://localhost:5173/*`, `https://fedit.vercel.app/*` 콘텐츠 스크립트 제거한 뒤 압축
      (심사에서 쓰지 않는 도메인 접근은 사유를 묻는 경우가 있음)
- [ ] `PRICING_URL` 실제 요금제 페이지로 교체 (`extension/lib/config.js`)
- [ ] 서버 3개 배포 + 실제 분석·저장 한 번 성공 확인 (심사자가 실제로 눌러봄)
- [ ] 심사용 테스트 계정 준비 → 대시보드 "테스트 안내(Test instructions)"에 아이디/비밀번호와 사용법 적기
      (로그인이 필요한 확장은 계정을 안 주면 기능 확인 불가로 반려되기 쉬움)
- [ ] 압축: `extension` 폴더에서 `bash scripts/build-zip.sh` → `dist/fedit-extension-<버전>.zip` (개발용 주소 자동 제거, store/·README 제외)

---

## 5. 테스트 안내 (Test instructions) — 심사자용, 영어로

대시보드 "테스트 안내" 칸에 그대로 붙여 넣고, `<ID>` `<PASSWORD>` 만 심사용 계정으로 바꾼다.
(심사자가 한국어를 못 읽을 수 있으니 영어로)

```
FEDIT is a fashion trend analysis service for fashion merchandisers and designers. The extension requires a FEDIT account.

Test account
- ID: <ID>
- Password: <PASSWORD>

How to test
1. Sign in at https://fedit.mify.im/login with the account above. The extension picks up the login automatically (no separate login inside the extension).
2. Open any product detail page on a supported shopping site, e.g. any product on https://www.musinsa.com or https://www.29cm.co.kr
3. Click the FEDIT icon in the toolbar. The side panel opens and shows the product (image, brand, name, price) read from the page.
4. Click "AI로 분석하기" (Analyze with AI). The analysis (category, material, fit, color, mood, etc.) appears in about 30–60 seconds, followed by "유사상품" (similar products from the FEDIT database).
5. Choose a board under "내 무드보드" and click "무드보드에 저장" (Save to moodboard). The item then appears under 내 보드 (My boards) on https://fedit.mify.im.

Notes
- The free plan allows 30 analyses per month; the test account has enough remaining.
- The extension reads only the public product information (structured data / meta tags) of the page the user is viewing while the side panel is open. It does not collect browsing history.
- For shopping sites not in the default list, the panel shows a button that asks the user for permission for that site.
```

> 심사용 계정은 한도에 걸리지 않게 여유 있는 상태로 두기(관리자 계정은 피하고, 일반 무료 계정 권장)
