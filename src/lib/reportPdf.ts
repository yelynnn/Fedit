// 리포트 문서(#report-doc)를 A4 PDF 파일로 바로 저장한다(인쇄 창 없이, 엑셀처럼 다운로드).
// 화면을 고해상도 이미지로 찍은 뒤 A4 높이에 맞춰 나누는데, 섹션(.report-block)이 페이지 중간에서
// 잘리지 않도록 가능한 한 블록 경계에서 끊는다. 라이브러리는 누를 때만 불러온다.

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 10;

export async function downloadReportPdf(el: HTMLElement, fileName: string) {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const scale = 2;
  // 화면에 그려진 폭 그대로 찍는다(복제본이 w-full·mx-auto 로 넓어지면 오른쪽이 잘린다)
  const width = el.offsetWidth;
  const height = el.scrollHeight;
  const canvas = await toCanvas(el, {
    pixelRatio: scale,
    backgroundColor: "#ffffff",
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    // 화면용 테두리·그림자·가운데 정렬 여백은 빼고 찍는다
    style: { border: "0", boxShadow: "none", margin: "0", width: `${width}px`, maxWidth: "none" },
  });

  const contentWmm = PAGE_W_MM - MARGIN_MM * 2;
  const contentHmm = PAGE_H_MM - MARGIN_MM * 2;
  const pxPerMm = canvas.width / contentWmm;
  const pageHpx = Math.floor(contentHmm * pxPerMm);

  // 끊어도 되는 위치(블록·섹션 위쪽 경계, 캔버스 픽셀)
  const top0 = el.getBoundingClientRect().top;
  const breaks = Array.from(el.querySelectorAll<HTMLElement>(".report-block, section, footer"))
    .map((b) => Math.round((b.getBoundingClientRect().top - top0) * scale))
    .filter((y) => y > 0)
    .sort((a, b) => a - b);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let start = 0;
  let first = true;
  while (start < canvas.height - 2) {
    let end = Math.min(start + pageHpx, canvas.height);
    if (end < canvas.height) {
      // 페이지의 35% 이상을 채우는 가장 아래쪽 경계에서 끊는다(없으면 높이대로)
      const cut = breaks.filter((y) => y > start + pageHpx * 0.35 && y <= end).pop();
      if (cut) end = cut;
    }
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = end - start;
    const ctx = slice.getContext("2d");
    if (!ctx) break;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, start, canvas.width, slice.height, 0, 0, canvas.width, slice.height);

    if (!first) pdf.addPage();
    first = false;
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", MARGIN_MM, MARGIN_MM, contentWmm, slice.height / pxPerMm);
    start = end;
  }
  pdf.save(`${fileName}.pdf`);
}
