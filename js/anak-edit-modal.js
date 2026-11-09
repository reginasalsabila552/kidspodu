import { updateAnak } from "./anak-service.js";

let injected = false;
let currentPrograms = [];
let currentAnak = null;
let onSavedCallback = null;

function injectModalOnce() {
  if (injected) return;
  injected = true;

  const style = document.createElement("style");
  style.textContent = `
    .aem-overlay {
      display: none; position: fixed; inset: 0; background: rgba(36,31,92,.45);
      align-items: center; justify-content: center; padding: 20px; z-index: 100;
    }
    .aem-overlay.open { display: flex; }
    .aem-card {
      background: #fff; border-radius: var(--radius-md); padding: 26px; width: 100%;
      max-width: 560px; max-height: 88vh; overflow-y: auto; box-shadow: var(--shadow-pop);
      font-family: var(--font-body, inherit);
    }
    .aem-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 4px; }
    .aem-head h3 { font-size: 17px; margin: 0 0 2px; color: var(--ink); }
    .aem-head .aem-sub { font-size: 12.5px; color: var(--ink-soft); margin: 0; }
    .aem-close { flex: none; width: 30px; height: 30px; border-radius: 50%; background: var(--sky); color: var(--ink-soft); font-size: 14px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; }
    .aem-close:hover { background: var(--purple-100); color: var(--purple-700); }
    .aem-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; margin-top: 18px; }
    .aem-field { margin-bottom: 2px; }
    .aem-field.full { grid-column: 1 / -1; }
    .aem-field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--ink); }
    .aem-field input, .aem-field select, .aem-field textarea {
      width: 100%; padding: 10px 12px; border-radius: var(--radius-sm); border: 1.5px solid #ddd9f7;
      font-family: inherit; font-size: 14px; background: var(--sky); box-sizing: border-box; color: var(--ink);
    }
    .aem-field .aem-hint { font-size: 12px; color: var(--ink-soft); margin-top: 4px; }
    .aem-program-groups { display: flex; flex-direction: column; gap: 14px; }
    .aem-program-group { width: 100%; padding-bottom: 12px; border-bottom: 1px solid #f0eefb; }
    .aem-program-group:last-child { border-bottom: none; padding-bottom: 0; }
    .aem-program-group-title { font-size: 12px; font-weight: 700; color: var(--purple-700); text-transform: uppercase; letter-spacing: .03em; margin-bottom: 8px; }
    .aem-checkbox-group { display: flex; flex-wrap: wrap; gap: 10px; }
    .aem-checkbox-group label {
      display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;
      background: var(--sky); border: 1.5px solid #ddd9f7; border-radius: var(--radius-pill);
      padding: 8px 14px; cursor: pointer;
    }
    .aem-checkbox-group input { width: auto; accent-color: var(--purple-600); }
    .aem-actions { margin-top: 20px; display: flex; align-items: center; gap: 14px; }
    .aem-actions button[type="submit"] {
      padding: 11px 22px; border-radius: var(--radius-pill); border: none; background: var(--purple-600);
      color: #fff; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background .15s, opacity .15s;
    }
    .aem-actions button[type="submit"]:hover:not(:disabled) { background: var(--purple-700); }
    .aem-actions button[type="submit"]:disabled { opacity: .6; cursor: not-allowed; }
    .aem-msg { font-size: 13px; font-weight: 600; }
    .aem-msg.ok { color: var(--teal-700, #0f6e56); }
    .aem-msg.err { color: var(--coral-600); }
    @media (max-width: 640px) {
      .aem-form-grid { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "aem-overlay";
  overlay.id = "aem-overlay";
  overlay.innerHTML = `
    <div class="aem-card">
      <div class="aem-head">
        <div>
          <h3>Edit Data Anak</h3>
          <p class="aem-sub" id="aem-sub">—</p>
        </div>
        <button type="button" class="aem-close" id="aem-close">✕</button>
      </div>

      <form id="aem-form">
        <div class="aem-form-grid">
          <div class="aem-field">
            <label>Nama Anak</label>
            <input type="text" id="aem-nama" required placeholder="Nama lengkap anak" />
          </div>
          <div class="aem-field">
            <label>Tanggal Lahir</label>
            <input type="date" id="aem-tgl-lahir" required />
          </div>

          <div class="aem-field full">
            <label>Program yang Diikuti</label>
            <div class="aem-program-groups" id="aem-program"></div>
          </div>

          <div class="aem-field">
            <label>Status</label>
            <select id="aem-status">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>

          <div class="aem-field">
            <label>Nama Orang Tua / Wali</label>
            <input type="text" id="aem-ortu-nama" required placeholder="Nama orang tua" />
          </div>
          <div class="aem-field">
            <label>No. WhatsApp Orang Tua</label>
            <input type="text" id="aem-ortu-wa" required placeholder="08xxxxxxxxxx" />
            <p class="aem-hint">Boleh format 08xx atau +62xx, otomatis dirapikan.</p>
          </div>

          <div class="aem-field full">
            <label>Alamat</label>
            <textarea id="aem-ortu-alamat" rows="2" required placeholder="Alamat rumah"></textarea>
          </div>
        </div>

        <div class="aem-actions">
          <button type="submit" id="aem-submit">Simpan Perubahan</button>
          <span class="aem-msg" id="aem-msg"></span>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeAnakEditModal();
  });
  document.getElementById("aem-close").addEventListener("click", closeAnakEditModal);

  document.getElementById("aem-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("aem-msg");
    const submitBtn = document.getElementById("aem-submit");
    msg.textContent = "";
    msg.className = "aem-msg";

    const nama = document.getElementById("aem-nama").value.trim();
    const tanggalLahir = document.getElementById("aem-tgl-lahir").value;
    const program = Array.from(document.querySelectorAll('input[name="aem-program"]:checked')).map((c) => {
      const [programId, subProgram] = c.value.split("::");
      return { programId, subProgram };
    });
    const status = document.getElementById("aem-status").value;
    const orangTuaNama = document.getElementById("aem-ortu-nama").value.trim();
    const orangTuaNoWa = document.getElementById("aem-ortu-wa").value.trim();
    const orangTuaAlamat = document.getElementById("aem-ortu-alamat").value.trim();

    if (!nama || !tanggalLahir || !orangTuaNama || !orangTuaNoWa || !orangTuaAlamat) {
      msg.textContent = "Lengkapi semua field wajib dulu ya.";
      msg.classList.add("err");
      return;
    }
    if (!program.length) {
      msg.textContent = "Pilih minimal 1 program.";
      msg.classList.add("err");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Menyimpan...";
    try {
      await updateAnak(currentAnak.id, { nama, tanggalLahir, program, orangTuaNama, orangTuaNoWa, orangTuaAlamat, status });
      msg.textContent = "Berhasil disimpan!";
      msg.classList.add("ok");
      const updatedAnak = {
        ...currentAnak,
        nama,
        tanggalLahir: tanggalLahir ? { toDate: () => new Date(tanggalLahir) } : null,
        program,
        status,
        orangTua: { nama: orangTuaNama, noWa: orangTuaNoWa, alamat: orangTuaAlamat },
      };
      if (onSavedCallback) onSavedCallback(updatedAnak);
      setTimeout(closeAnakEditModal, 500);
    } catch (err) {
      console.error(err);
      msg.textContent = "Gagal menyimpan: " + err.message;
      msg.classList.add("err");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Simpan Perubahan";
    }
  });
}

export function openAnakEditModal(anak, programs, onSaved) {
  injectModalOnce();
  currentAnak = anak;
  currentPrograms = programs || [];
  onSavedCallback = onSaved || null;

  document.getElementById("aem-sub").textContent = `Ubah data untuk ${anak.nama || "anak ini"}`;
  document.getElementById("aem-msg").textContent = "";
  document.getElementById("aem-msg").className = "aem-msg";

  document.getElementById("aem-nama").value = anak.nama || "";

  const tgl = anak.tanggalLahir?.toDate ? anak.tanggalLahir.toDate() : (anak.tanggalLahir ? new Date(anak.tanggalLahir) : null);
  document.getElementById("aem-tgl-lahir").value = tgl ? tgl.toISOString().slice(0, 10) : "";

  document.getElementById("aem-status").value = anak.status || "aktif";
  document.getElementById("aem-ortu-nama").value = anak.orangTua?.nama || "";
  document.getElementById("aem-ortu-wa").value = anak.orangTua?.noWa || "";
  document.getElementById("aem-ortu-alamat").value = anak.orangTua?.alamat || "";

  const selected = new Set((anak.program || []).map((p) => `${p.programId}::${p.subProgram}`));
  const programWrap = document.getElementById("aem-program");
  programWrap.innerHTML = currentPrograms.map((p) => `
    <div class="aem-program-group">
      <div class="aem-program-group-title">${p.title}</div>
      <div class="aem-checkbox-group">
        ${(p.items || []).map((item) => {
          const val = `${p.id}::${item}`;
          const checked = selected.has(val) ? "checked" : "";
          return `
            <label>
              <input type="checkbox" name="aem-program" value="${val}" ${checked} />
              ${item}
            </label>
          `;
        }).join("")}
      </div>
    </div>
  `).join("");

  document.getElementById("aem-overlay").classList.add("open");
}

export function closeAnakEditModal() {
  const overlay = document.getElementById("aem-overlay");
  if (overlay) overlay.classList.remove("open");
  currentAnak = null;
  onSavedCallback = null;
}
