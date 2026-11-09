
import { TIPE_SESI_LABEL, isTipeMultiAnak, needsJamSesi } from "./report-service.js";
import { parseRichText } from "./rich-text.js";

const PURPLE = [83, 74, 183];
const PURPLE_DARK = [36, 31, 92];
const TEAL = [47, 185, 142];
const CORAL = [224, 86, 58];
const INK_SOFT = [82, 77, 128];

const CONTACT = {
  alamat: "The Alana Regency Blok F4/18, Tambak Oso, Sidoarjo",
  telepon: "0851-9090-5503",
  instagram: "@kidspodu",
  tiktok: "@kidspodu",
};

let logoDataUrlPromise = null;
function getLogoDataUrl() {
  if (!logoDataUrlPromise) logoDataUrlPromise = fetchAsDataUrl("assets/images/logo.png");
  return logoDataUrlPromise;
}

function formatTanggalPdf(input) {
  if (!input) return "—";
  const d = input.toDate ? input.toDate() : new Date(input);
  const tgl = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
  return `${tgl}, pukul ${jam}`;
}

function formatTanggalOnlyPdf(input) {
  if (!input) return "-";
  const d = input.toDate ? input.toDate() : new Date(input);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

async function fetchAsDataUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Gagal memuat foto untuk PDF:", url, err);
    return null;
  }
}

function sanitizeForPdf(text) {
  if (!text) return text;
  return String(text)
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g, "")
    .replace(/[ \t]{2,}/g, " ");
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

async function drawHeaderAndTitle(doc, { badgeText, title, subtitle }, pageWidth) {
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setFillColor(...TEAL);
  doc.rect(0, 40, pageWidth, 1.6, "F");

  const logoDataUrl = await getLogoDataUrl();
  const logoH = 24;
  const logoW = logoH * (570 / 402);
  let textX = 15;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 15, 8, logoW, logoH);
      textX = 15 + logoW + 7;
    } catch (err) {
      console.warn("Gagal menempel logo ke PDF:", err);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("KidsPodu", textX, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Kids Sport & Education Foundation", textX, 27);
  doc.setFontSize(8.5);
  doc.setTextColor(220, 245, 238);
  doc.text(badgeText, pageWidth - 15, 27, { align: "right" });

  let y = 54;
  doc.setTextColor(...PURPLE_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, y, { align: "center" });

  if (subtitle) {
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...INK_SOFT);
    doc.text(subtitle, pageWidth / 2, y, { align: "center" });
  }

  return y;
}

function drawSlimHeader(doc, pageWidth, headerH, logoDataUrl) {
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, pageWidth, headerH, "F");
  doc.setFillColor(...TEAL);
  doc.rect(0, headerH, pageWidth, 1.2, "F");

  const logoH = 14;
  const logoW = logoH * (570 / 402);
  let textX = 12;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 12, (headerH - logoH) / 2, logoW, logoH);
      textX = 12 + logoW + 6;
    } catch (err) {
      console.warn("Gagal menempel logo ke PDF:", err);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("KidsPodu", textX, headerH / 2 + 1.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(220, 245, 238);
  doc.text("Kids Sport & Education Foundation", textX, headerH / 2 + 6.5);
}

function renderRichText(doc, rawText, x, startY, maxWidth, { ensureSpace, fontSize = 10, lineHeight = 5.4, color = [30, 27, 60] } = {}) {
  const lines = parseRichText(sanitizeForPdf(rawText) || "-");
  let y = startY;
  doc.setFontSize(fontSize);

  lines.forEach((line) => {
    if (line.empty) { y += lineHeight * 0.5; return; }

    const indent = line.bullet ? 5 : 0;
    const lineStartX = x + indent;
    const usableWidth = maxWidth - indent;

    y = ensureSpace(y, lineHeight);
    let cx = lineStartX;
    doc.setTextColor(...color);

    if (line.bullet) {
      doc.setFont("helvetica", "normal");
      doc.text("•", x, y);
    }

    line.segments.forEach((seg) => {
      doc.setFont("helvetica", seg.bold ? "bold" : seg.italic ? "italic" : "normal");
      const words = seg.text.split(" ");
      words.forEach((word, wi) => {
        if (word === "") { cx += doc.getTextWidth(" "); return; }
        const isLast = wi === words.length - 1;
        const piece = isLast ? word : word + " ";
        const w = doc.getTextWidth(piece);
        if (cx + w > lineStartX + usableWidth && cx > lineStartX) {
          y += lineHeight;
          y = ensureSpace(y, 0);
          cx = lineStartX;
        }
        doc.text(piece, cx, y);
        cx += w;
      });
    });

    y += lineHeight;
  });

  return y;
}

export async function buildLaporanPdf(report, anakEntry) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;

  const HEADER_H = 22;
  const FOOTER_H = 34;
  const TOP_Y = HEADER_H + 10;
  const BOTTOM_Y = pageHeight - FOOTER_H - 6;

  const logoDataUrl = await getLogoDataUrl();

  const ensureSpace = (cursorY, needed) => {
    if (cursorY + needed > BOTTOM_Y) {
      doc.addPage();
      return TOP_Y;
    }
    return cursorY;
  };

  let cursorY = TOP_Y + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PURPLE_DARK);
  doc.text("LAPORAN SESI", pageWidth / 2, cursorY, { align: "center" });
  cursorY += 10;

  doc.autoTable({
    startY: cursorY,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9.5, cellPadding: 3, textColor: [30, 27, 60] },
    headStyles: { fillColor: PURPLE, textColor: 255, fontStyle: "bold", fontSize: 9.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, fillColor: [238, 237, 254] } },
    margin: { left: marginX, right: marginX, top: TOP_Y, bottom: FOOTER_H + 6 },
    head: [["Info Sesi", ""]],
    body: [
      ["Nama Anak", sanitizeForPdf(anakEntry.nama) || "—"],
      ["Program", `${sanitizeForPdf(report.programTitle) || "—"} – ${sanitizeForPdf(report.subProgram) || "—"}`],
      ["Jenis Sesi", TIPE_SESI_LABEL[report.tipe] || "Private"],
      ["Tanggal Sesi", needsJamSesi(report.programId) ? formatTanggalPdf(report.tanggal) : formatTanggalOnlyPdf(report.tanggal)],
      ["Pelatih", sanitizeForPdf(report.pelatihNama) || "—"],
    ],
  });
  cursorY = doc.lastAutoTable.finalY + 10;

  cursorY = ensureSpace(cursorY, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PURPLE_DARK);
  doc.text(isTipeMultiAnak(report.tipe) ? "Laporan Umum" : "Laporan", marginX, cursorY);
  cursorY += 7;
  cursorY = renderRichText(doc, report.laporanUmum, marginX, cursorY, contentWidth, { ensureSpace });
  cursorY += 6;

  if (anakEntry.catatanKhusus) {
    cursorY = ensureSpace(cursorY, 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PURPLE_DARK);
    doc.text(`Catatan Khusus untuk ${sanitizeForPdf(anakEntry.nama)}`, marginX, cursorY);
    cursorY += 7;
    cursorY = renderRichText(doc, anakEntry.catatanKhusus, marginX, cursorY, contentWidth, { ensureSpace });
    cursorY += 6;
  }

  const fotoUrls = report.fotoUrls || [];
  if (fotoUrls.length) {
    cursorY = ensureSpace(cursorY, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PURPLE_DARK);
    doc.text("Dokumentasi", marginX, cursorY);
    cursorY += 9;

    const cols = 2;
    const imgMarginX = 8;
    const imgContentWidth = pageWidth - imgMarginX * 2;
    const gap = 5;
    const boxSize = (imgContentWidth - gap * (cols - 1)) / cols;
    let col = 0;

    for (const url of fotoUrls) {
      const dataUrl = await fetchAsDataUrl(url);
      if (!dataUrl) continue;
      if (col === 0) cursorY = ensureSpace(cursorY, boxSize);
      const x = imgMarginX + col * (boxSize + gap);
      try {
        const dims = await getImageDimensions(dataUrl);
        let drawW = boxSize;
        let drawH = boxSize;
        let offX = 0;
        let offY = 0;
        if (dims && dims.w && dims.h) {
          const scale = Math.min(boxSize / dims.w, boxSize / dims.h);
          drawW = dims.w * scale;
          drawH = dims.h * scale;
          offX = (boxSize - drawW) / 2;
          offY = (boxSize - drawH) / 2;
        }
        doc.addImage(dataUrl, "JPEG", x + offX, cursorY + offY, drawW, drawH);
      } catch (err) {
        console.warn("Gagal menempel foto ke PDF:", err);
      }
      col++;
      if (col >= cols) { col = 0; cursorY += boxSize + gap; }
    }
    if (col !== 0) cursorY += boxSize + gap;
  }

  const totalPages = doc.internal.getNumberOfPages();
  const fineprint = `Dibuat oleh ${sanitizeForPdf(report.pelatihNama) || "-"} · Diunduh ${new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawSlimHeader(doc, pageWidth, HEADER_H, logoDataUrl);
    drawKontakFooter(
      doc,
      i === totalPages ? fineprint : "",
      pageWidth, pageHeight, FOOTER_H,
      totalPages > 1 ? `Hal. ${i}/${totalPages}` : ""
    );
  }

  return doc;
}

function drawKontakFooter(doc, fineprint, pageWidth, pageHeight, footerHeight, pageLabel = "") {
  const footerY = pageHeight - footerHeight;

  doc.setFillColor(...PURPLE_DARK);
  doc.rect(0, footerY, pageWidth, footerHeight, "F");
  doc.setFillColor(...TEAL);
  doc.rect(0, footerY, pageWidth, 1.4, "F");

  const leftX = 15;
  let ky = footerY + 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("KONTAK", leftX, ky);

  const rowLeft = [
    { dot: CORAL, label: CONTACT.alamat },
    { dot: CORAL, label: CONTACT.telepon },
  ];
  const rowRight = [
    { dot: TEAL, label: `Instagram ${CONTACT.instagram}` },
    { dot: TEAL, label: `TikTok ${CONTACT.tiktok}` },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  let ly = ky + 6;
  const colWidth = (pageWidth - leftX - 15) * 0.6;
  rowLeft.forEach((row) => {
    doc.setFillColor(...row.dot);
    doc.circle(leftX + 1, ly - 1.3, 1.1, "F");
    doc.setTextColor(235, 233, 250);
    const lines = doc.splitTextToSize(row.label, colWidth - 8);
    doc.text(lines, leftX + 5, ly);
    ly += lines.length * 4.2 + 1.8;
  });

  let ry = ky + 6;
  const rightX = leftX + colWidth + 6;
  rowRight.forEach((row) => {
    doc.setFillColor(...row.dot);
    doc.circle(rightX + 1, ry - 1.3, 1.1, "F");
    doc.setTextColor(235, 233, 250);
    doc.text(row.label, rightX + 5, ry);
    ry += 6;
  });

  if (fineprint) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(165, 160, 205);
    doc.text(fineprint, leftX, footerY + footerHeight - 4);
  }

  if (pageLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(165, 160, 205);
    doc.text(pageLabel, pageWidth - 15, footerY + footerHeight - 4, { align: "right" });
  }
}

export function laporanPdfFilename(report, anakEntry) {
  const tgl = formatTanggalOnlyPdf(report.tanggal).replace(/\s+/g, "-");
  return `Laporan Sesi - ${anakEntry.nama} - ${tgl}.pdf`;
}

export async function buildBiodataAnakPdf(anak, programLabel) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const y = await drawHeaderAndTitle(doc, {
    badgeText: "Formulir Registrasi Anak",
    title: "BIODATA ANAK",
    subtitle: sanitizeForPdf(anak.nama) || "—",
  }, pageWidth);

  const programNames = (anak.program || []).map((sel) => programLabel(sel)).join(", ") || "—";

  doc.autoTable({
    startY: y + 10,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 11, cellPadding: 6, textColor: [30, 27, 60] },
    headStyles: { fillColor: PURPLE, textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60, fillColor: [238, 237, 254] } },
    head: [["Data Anak", ""]],
    body: [
      ["Nama Anak", sanitizeForPdf(anak.nama) || "—"],
      ["Tanggal Lahir", formatTanggalPdf(anak.tanggalLahir).replace(/, pukul.*$/, "")],
      ["Program yang Diikuti", sanitizeForPdf(programNames)],
      ["Status", (anak.status || "aktif").toUpperCase()],
    ],
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 11, cellPadding: 6, textColor: [30, 27, 60] },
    headStyles: { fillColor: PURPLE, textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60, fillColor: [238, 237, 254] } },
    head: [["Data Orang Tua / Wali", ""]],
    body: [
      ["Nama Orang Tua / Wali", sanitizeForPdf(anak.orangTua?.nama) || "—"],
      ["No. WhatsApp Orang Tua", sanitizeForPdf(anak.orangTua?.noWa) || "—"],
      ["Alamat", sanitizeForPdf(anak.orangTua?.alamat) || "—"],
    ],
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const footerHeight = 40;
  let cursorY = doc.lastAutoTable.finalY + 12;
  if (cursorY > pageHeight - footerHeight - 8) {
    doc.addPage();
  }
  const terdaftarStr = formatTanggalPdf(anak.createdAt).replace(/, pukul.*$/, "");
  drawKontakFooter(
    doc,
    `Terdaftar sejak ${terdaftarStr} · Diunduh ${new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`,
    pageWidth, pageHeight, footerHeight
  );

  return doc;
}

export function biodataPdfFilename(anak) {
  return `Biodata - ${anak.nama || "anak"}.pdf`;
}