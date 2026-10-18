# FEDIT 크롬 확장 (MVP)

쇼핑몰 상품 상세 페이지에서 툴바의 FEDIT 아이콘을 누르면 사이드패널이 열리고,
**AI(VLM)로 분석 → 결과를 패널에서 바로 확인 → 마음에 들면 내 보드에 저장**한다. 빌드 과정 없는 순수 JS(Manifest V3).

## 로컬에서 써 보기
1. `chrome://extensions` → 오른쪽 위 **개발자 모드** 켜기
2. **압축해제된 확장 프로그램을 로드합니다** → 이 `extension/` 폴더 선택
3. FEDIT 웹(fedit.mify.im)에서 로그인 → 확장에 자동 연결
4. 무신사·29CM·W컨셉·자라·COS 상품 페이지에서 툴바의 FEDIT 아이콘 클릭

## 구조
| 파일 | 역할 |
|---|---|
| `manifest.json` | 권한: sidePanel·activeTab·scripting·storage, 호스트: 백엔드 + 주요 패션몰 14곳(무신사·29CM·W컨셉·자라·COS 등). 그 밖의 사이트는 패널의 "이 사이트에서 FEDIT 사용하기"로 선택 권한 요청 |
| `background.js` | 아이콘 클릭 → 사이드패널 |
| `content/fedit-auth-sync.js` | FEDIT 웹 localStorage 토큰 ↔ 확장 토큰 동기화 (refresh token 발급 시각이 최근인 쪽 우선, 웹 로그아웃 시 확장도 로그아웃) |
| `lib/extract.js` | 상품 정보 추출: JSON-LD(Product/ProductGroup) → og 메타 → 페이지 제목 |
| `lib/api.js` | 백엔드 호출, 401 이면 `/auth/refresh` 한 번 후 재시도 |
| `lib/config.js` | 백엔드·웹 주소, 분석 상태 폴링 주기 |
| `sidepanel/` | 패널 UI: 상품 카드, 보드 선택·새 보드, 저장, 분석 상태, "이번 달 n/50" |

## 사용하는 API (Back-end `feature/extension-item`)
- `POST /board/external-item/analyze` 분석 요청(수집된 상품이면 기존 itemcode, 아니면 VLM 분석 대기). 월 한도에 셈(같은 달 같은 상품은 1회)
- `GET /board/external-item/{itemcode}` 확장 상품 분석 상태(queued → ai_done → indexed | failed)
- `GET /products?itemCode=` 수집된 상품의 VLM 결과(웹 상세와 같은 데이터)
- `GET /board/external-item/{itemcode}/similar` FEDIT DB 속 비슷한 상품(기본: 요금제와 무관하게 전체 브랜드)
- `POST /board/newitem` 보드에 저장(한도와 무관)
- `GET /board/external-item/usage` 요금제별 월 분석 한도·사용량
- `GET /board/list`, `POST /board/new`, `POST /auth/refresh`

## 출시 전 할 일
- [ ] 아이콘 128px 원본(지금은 48px 를 키운 임시 이미지)
- [ ] 웹스토어 등록 정보: 설명, 스크린샷(1280×800), 개인정보처리방침 URL, 권한 사용 사유
- [ ] 웹 보드 화면에서 EXT 상품 클릭 시 상세(현재 `/detail/{itemcode}` 는 EXT 코드를 모름)
- [ ] `PRICING_URL` 을 요금제 페이지로
