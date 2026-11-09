import { formatTanggal, formatTanggalJam, buildLaporanMessage, buildWaLink, TIPE_SESI_LABEL, isTipeMultiAnak, needsJamSesi, deleteLaporan, isAnakHadir } from "./report-service.js";
import { buildLaporanPdf, laporanPdfFilename } from "./report-pdf.js";
import { richTextToHtml } from "./rich-text.js";

let manageStylesInjected = false;
function ensureManageStyles() {
  if (manageStylesInjected) return;
  manageStylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .dl-head-right { display: flex; align-items: center; gap: 8px; flex: none; }
    .dl-manage-actions { display: flex; gap: 8px; flex: none; }
    .dl-edit-btn, .dl-delete-btn {
      font-size: 12px; font-weight: 700; padding: 6px 13px; border-radius: var(--radius-pill, 999px);
      border: none; cursor: pointer; white-space: nowrap; text-decoration: none; display: inline-flex; align-items: center;
    }
    .dl-edit-btn { background: var(--purple-100, #efeafe); color: var(--purple-700, #3c3489); }
    .dl-edit-btn:hover { background: var(--purple-200, #ddd9f7); }
    .dl-delete-btn { background: #fde9ea; color: var(--coral-600, #e0563a); }
    .dl-delete-btn:hover { background: var(--coral-600, #e0563a); color: #fff; }
    .dl-delete-btn:disabled { opacity: .6; cursor: not-allowed; }

    .dl-note-block { background: #fff8e8; border: 1.5px solid #f2dfa0; border-radius: var(--radius-sm, 12px); padding: 12px 14px; }
    .dl-note-block .dl-block-label { color: #9a6b00; }
    .dl-note-block p { color: #6b4e00; }

    .dl-copy-btn {
      font-size: 11.5px; font-weight: 700; color: var(--purple-700, #3c3489); background: var(--purple-100, #efeafe);
      border: none; border-radius: var(--radius-pill, 999px); padding: 5px 12px; cursor: pointer; font-family: inherit;
    }
    .dl-copy-btn:hover { background: var(--purple-200, #ddd9f7); }

    .dl-hadir-tag, .dl-tidak-hadir-tag {
      font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: var(--radius-pill, 999px); margin-left: 8px;
      display: inline-block; vertical-align: middle;
    }
    .dl-hadir-tag { background: #e3f7ef; color: #1a9c78; }
    .dl-tidak-hadir-tag { background: #fde9ea; color: var(--coral-600, #e0563a); }
  `;
  document.head.appendChild(style);
}

function renderManageActions(l, opts) {
  ensureManageStyles();
  const head = document.querySelector("#modal-detail-laporan .modal-detail-head");
  const closeBtn = document.getElementById("btn-close-detail");
  if (!head || !closeBtn) return;

  let right = document.getElementById("dl-head-right");
  if (!right) {
    right = document.createElement("div");
    right.id = "dl-head-right";
    right.className = "dl-head-right";
    closeBtn.insertAdjacentElement("beforebegin", right);
    right.appendChild(closeBtn);
  }

  let bar = document.getElementById("dl-manage-actions");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "dl-manage-actions";
    bar.className = "dl-manage-actions";
    right.insertBefore(bar, closeBtn);
  }
  bar.innerHTML = "";

  if (opts.canEdit) {
    const editBtn = document.createElement("a");
    editBtn.className = "dl-edit-btn";
    editBtn.href = `pelatih-laporan.html?editId=${encodeURIComponent(l.id)}`;
    editBtn.textContent = "✏️ Edit";
    bar.appendChild(editBtn);
  }
  if (opts.canDelete) {
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "dl-delete-btn";
    delBtn.textContent = "🗑️ Hapus";
    delBtn.addEventListener("click", () => hapusLaporan(l, delBtn, opts.onDeleted));
    bar.appendChild(delBtn);
  }
}

async function hapusLaporan(report, btn, onDeleted) {
  if (!confirm("Yakin mau hapus laporan ini? Tindakan ini tidak bisa dibatalkan.")) return;
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Menghapus...";
  try {
    await deleteLaporan(report.id);
    closeReportDetailModal();
    document.querySelectorAll(`[data-id="${CSS.escape(report.id)}"]`).forEach((el) => el.remove());
    onDeleted?.(report.id);
  } catch (err) {
    console.error(err);
    alert("Gagal menghapus laporan: " + err.message);
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

export function openReportDetailModal(l, opts = {}) {
  if (!l) return;

  document.getElementById("dl-title").textContent = `${l.programTitle || "-"}${l.subProgram ? " · " + l.subProgram : ""}`;
  const tglStr = needsJamSesi(l.programId) ? formatTanggalJam(l.tanggal) : formatTanggal(l.tanggal);
  document.getElementById("dl-sub").textContent = `${tglStr}${l.pelatihNama ? " · " + l.pelatihNama : ""}`;
  document.getElementById("dl-badges").innerHTML =
    `<span class="dl-badge">${TIPE_SESI_LABEL[l.tipe] || "Private"}</span>`;

  const anakList = l.anakList || [];
  const isKelompok = isTipeMultiAnak(l.tipe);

  let bodyHtml = `
    <div class="dl-block">
      <div class="dl-block-label">${isKelompok ? "Laporan Umum Kelompok" : "Laporan Sesi"}</div>
      ${richTextToHtml(l.laporanUmum)}
    </div>
  `;

  if (anakList.length) {
    bodyHtml += `
      <div class="dl-block">
        <div class="dl-block-label">${isKelompok ? "Anak & Catatan Khusus" : "Anak"}</div>
        ${anakList.map((a, i) => {
          if (isKelompok && !isAnakHadir(a)) {
            return `
              <div class="dl-anak-block">
                <div class="dl-anak-head">
                  <strong>${a.nama}</strong>
                  <span class="dl-tidak-hadir-tag">✕ Tidak Hadir</span>
                </div>
              </div>
            `;
          }
          return `
          <div class="dl-anak-block">
            <div class="dl-anak-head">
              <strong>${a.nama}</strong>
              ${isKelompok ? `<span class="dl-hadir-tag">✓ Hadir</span>` : ""}
              <div class="dl-anak-actions">
                <button type="button" class="dl-pdf-btn" data-idx="${i}">Unduh PDF</button>
                <button type="button" class="dl-copy-btn" data-idx="${i}">📋 Salin Teks</button>
                <button type="button" class="dl-wa-btn" data-idx="${i}" ${a.orangTuaNoWa ? "" : "disabled title='Nomor WA orang tua tidak ada'"}>Kirim ke Orang Tua</button>
              </div>
            </div>
            ${isKelompok ? (a.catatanKhusus ? richTextToHtml(a.catatanKhusus) : `<p>Tidak ada catatan khusus untuk anak ini.</p>`) : ""}
          </div>
          `;
        }).join("")}
      </div>
    `;
  }

  if ((l.fotoUrls || []).length) {
    bodyHtml += `
      <div class="dl-block">
        <div class="dl-block-label">Dokumentasi (${l.fotoUrls.length} foto)</div>
        <div class="dl-foto-grid">
          ${l.fotoUrls.map((u) => `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="Dokumentasi" /></a>`).join("")}
        </div>
      </div>
    `;
  }

  const bodyEl = document.getElementById("dl-body");
  bodyEl.innerHTML = bodyHtml;

  bodyEl.querySelectorAll(".dl-pdf-btn").forEach((btn) => {
    btn.addEventListener("click", () => unduhPdfLaporan(l, anakList[Number(btn.dataset.idx)], btn));
  });

  bodyEl.querySelectorAll(".dl-wa-btn").forEach((btn) => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => kirimKeOrtu(l, anakList[Number(btn.dataset.idx)], btn));
  });

  bodyEl.querySelectorAll(".dl-copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => salinTeksLaporan(l, anakList[Number(btn.dataset.idx)], btn));
  });

  renderManageActions(l, opts);

  document.getElementById("modal-detail-laporan").classList.add("open");
}

export function closeReportDetailModal() {
  document.getElementById("modal-detail-laporan").classList.remove("open");
}

export function wireReportDetailModalClose() {
  const modalDetail = document.getElementById("modal-detail-laporan");
  document.getElementById("btn-close-detail").addEventListener("click", closeReportDetailModal);
  modalDetail.addEventListener("click", (e) => { if (e.target === modalDetail) closeReportDetailModal(); });
}

async function unduhPdfLaporan(report, anakEntry, btn) {
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Menyiapkan...";
  try {
    const pdfDoc = await buildLaporanPdf(report, anakEntry);
    pdfDoc.save(laporanPdfFilename(report, anakEntry));
  } catch (err) {
    console.error(err);
    alert("Gagal membuat PDF. Coba lagi.");
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

async function salinTeksLaporan(report, anakEntry, btn) {
  const originalLabel = btn.textContent;
  try {
    const message = buildLaporanMessage({
      orangTuaNama: anakEntry.orangTuaNama,
      anakNama: anakEntry.nama,
      programTitle: report.programTitle,
      subProgram: report.subProgram,
      tanggal: report.tanggal,
      tipe: report.tipe,
      laporanUmum: report.laporanUmum,
      catatanKhusus: anakEntry.catatanKhusus,
    });
    await navigator.clipboard.writeText(message);
    btn.textContent = "✓ Tersalin";
  } catch (err) {
    console.error(err);
    btn.textContent = "Gagal, coba lagi";
  } finally {
    setTimeout(() => { btn.textContent = originalLabel; }, 1800);
  }
}

async function kirimKeOrtu(report, anakEntry, btn) {
  if (!anakEntry.orangTuaNoWa) return;
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Menyiapkan PDF...";

  const waTab = window.open("", "_blank");
  try {
    const pdfDoc = await buildLaporanPdf(report, anakEntry);
    pdfDoc.save(laporanPdfFilename(report, anakEntry));

    btn.textContent = "Membuka WhatsApp...";
    const message = buildLaporanMessage({
      orangTuaNama: anakEntry.orangTuaNama,
      anakNama: anakEntry.nama,
      programTitle: report.programTitle,
      subProgram: report.subProgram,
      tanggal: report.tanggal,
      tipe: report.tipe,
      laporanUmum: report.laporanUmum,
      catatanKhusus: anakEntry.catatanKhusus,
    });
    const link = buildWaLink(anakEntry.orangTuaNoWa, message);
    if (waTab) waTab.location.href = link;
    else window.open(link, "_blank");
  } catch (err) {
    console.error(err);
    if (waTab) waTab.close();
    alert("Gagal membuat PDF: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}