#!/usr/bin/env bash
# 크롬 웹스토어 제출용 zip 만들기.
#  - 개발용 콘텐츠 스크립트 주소(localhost, vercel)를 뺀 manifest 로 압축
#  - store/, scripts/, README 는 넣지 않음
# 사용: extension 폴더에서 `bash scripts/build-zip.sh` → dist/fedit-extension-<버전>.zip
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
OUT=dist/fedit-extension-$VERSION.zip
TMP=$(mktemp -d)
cp -R background.js content icons lib sidepanel "$TMP"/
python3 - "$TMP/manifest.json" <<'PY'
import json, sys
m = json.load(open("manifest.json"))
for cs in m.get("content_scripts", []):
    cs["matches"] = [u for u in cs["matches"] if "localhost" not in u and "vercel.app" not in u]
json.dump(m, open(sys.argv[1], "w"), ensure_ascii=False, indent=2)
PY
mkdir -p dist && rm -f "$OUT"
(cd "$TMP" && zip -qr -X - . ) > "$OUT"
rm -rf "$TMP"
echo "$OUT"
unzip -l "$OUT" | tail -n +1
