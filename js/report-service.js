import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const JENIS_SESI_KHUSUS = {
  "olahraga::Renang": ["private", "semiprivate", "kelompok"],
  "olahraga::Karate": ["private", "kelompok"],
  "olahraga::Kebugaran Jasmani": ["private", "kelompok"],
};
const DEFAULT_TIPE_SESI = ["private"];

export function getAllowedTipeSesi(programId, sub) {
  return JENIS_SESI_KHUSUS[`${programId}::${sub}`] || DEFAULT_TIPE_SESI;
}

export const TIPE_SESI_LABEL = {
  private: "Private",
  semiprivate: "Semi-Private",
  kelompok: "Kelompok",
};

export const TIPE_SESI_ICON = {
  private: "👤",
  semiprivate: "🧑‍🤝‍🧑",
  kelompok: "👥",
};

export const TIPE_SESI_MAX_ANAK = {
  semiprivate: 4,
};

export function isTipeMultiAnak(tipe) {
  return tipe === "kelompok" || tipe === "semiprivate";
}

export function isAnakHadir(anakEntry) {
  return anakEntry?.hadir !== false;
}

export function anakHadirLabel(tipe, anakEntry) {
  if (!isTipeMultiAnak(tipe)) return null;
  return isAnakHadir(anakEntry) ? "Hadir" : "Tidak Hadir";
}

export function countKehadiranAnak(reports, anakId) {
  let hadir = 0, tidakHadir = 0;
  reports.forEach((r) => {
    const entry = (r.anakList || []).find((a) => a.anakId === anakId);
    if (!entry) return;
    if (isAnakHadir(entry)) hadir += 1;
    else tidakHadir += 1;
  });
  return { hadir, tidakHadir };
}


export function needsJamSesi(programId) {
  return false;
}

export async function createLaporan({
  pelatihUid, pelatihNama, programId, programTitle, subProgram,
  tipe, tanggal, laporanUmum, anakList, fotoUrls,
}) {
  return addDoc(collection(db, "session_reports"), {
    pelatihUid,
    pelatihNama,
    programId,
    programTitle,
    subProgram,
    tipe,
    tanggal: tanggal ? Timestamp.fromDate(new Date(tanggal)) : serverTimestamp(),
    laporanUmum: laporanUmum || "",
    fotoUrls: fotoUrls || [],
    anakIds: anakList.map((a) => a.anakId),
    anakList,
    createdAt: serverTimestamp(),
  });
}

export async function getLaporanById(reportId) {
  const snap = await getDoc(doc(db, "session_reports", reportId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateLaporan(reportId, { tipe, tanggal, laporanUmum, anakList, fotoUrls }) {
  return updateDoc(doc(db, "session_reports", reportId), {
    tipe,
    tanggal: tanggal ? Timestamp.fromDate(new Date(tanggal)) : serverTimestamp(),
    laporanUmum: laporanUmum || "",
    fotoUrls: fotoUrls || [],
    anakIds: anakList.map((a) => a.anakId),
    anakList,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLaporan(reportId) {
  return deleteDoc(doc(db, "session_reports", reportId));
}


function sortByTanggalDesc(docs) {
  return docs.sort((a, b) => {
    const ta = a.tanggal?.toMillis ? a.tanggal.toMillis() : new Date(a.tanggal || 0).getTime();
    const tb = b.tanggal?.toMillis ? b.tanggal.toMillis() : new Date(b.tanggal || 0).getTime();
    return tb - ta;
  });
}

export async function listLaporanByPelatih(pelatihUid) {
  const snap = await getDocs(
    query(collection(db, "session_reports"), where("pelatihUid", "==", pelatihUid))
  );
  return sortByTanggalDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function listLaporanByProgram(programId) {
  const snap = await getDocs(
    query(collection(db, "session_reports"), where("programId", "==", programId))
  );
  return sortByTanggalDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function listLaporanByAnak(anakId) {
  const snap = await getDocs(
    query(collection(db, "session_reports"), where("anakIds", "array-contains", anakId))
  );
  return sortByTanggalDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function listAllLaporan() {
  const snap = await getDocs(query(collection(db, "session_reports"), orderBy("tanggal", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function tanggalToKey(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatTanggal(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function formatJam(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
}

export function formatTanggalJam(ts) {
  if (!ts) return "—";
  return `${formatTanggal(ts)}, pukul ${formatJam(ts)}`;
}

export function toDateSafe(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7;
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - day);
  return s;
}
function endOfWeek(d) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  return e;
}

const ID_BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function filterByDateRange(reports, startStr, endStr) {
  if (!startStr && !endStr) return reports;
  const startMs = startStr ? new Date(startStr + "T00:00:00").getTime() : -Infinity;
  const endMs = endStr ? new Date(endStr + "T23:59:59").getTime() : Infinity;
  return reports.filter((r) => {
    const d = toDateSafe(r.tanggal);
    if (!d) return false;
    const t = d.getTime();
    return t >= startMs && t <= endMs;
  });
}

export function groupSessionsByPeriod(reports, period) {
  const map = new Map();
  reports.forEach((r) => {
    const d = toDateSafe(r.tanggal);
    if (!d) return;
    let key, label, sortKey;
    if (period === "minggu") {
      const s = startOfWeek(d), e = endOfWeek(d);
      key = s.toISOString().slice(0, 10);
      label = `${s.getDate()} ${ID_BULAN_PENDEK[s.getMonth()]} – ${e.getDate()} ${ID_BULAN_PENDEK[e.getMonth()]} ${e.getFullYear()}`;
      sortKey = s.getTime();
    } else if (period === "tahun") {
      key = `${d.getFullYear()}`;
      label = key;
      sortKey = new Date(d.getFullYear(), 0, 1).getTime();
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      sortKey = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    }
    if (!map.has(key)) map.set(key, { key, label, sortKey, count: 0 });
    map.get(key).count += 1;
  });
  return Array.from(map.values()).sort((a, b) => b.sortKey - a.sortKey);
}

export function countByLabel(reports, getLabels) {
  const map = new Map();
  reports.forEach((r) => {
    const labels = getLabels(r);
    (Array.isArray(labels) ? labels : [labels]).forEach((lbl) => {
      if (!lbl) return;
      map.set(lbl, (map.get(lbl) || 0) + 1);
    });
  });
  return Array.from(map.entries())
    .map(([nama, count]) => ({ nama, count }))
    .sort((a, b) => b.count - a.count || a.nama.localeCompare(b.nama));
}

export function buildWaLink(noWa, message) {
  return `https://wa.me/${noWa}?text=${encodeURIComponent(message)}`;
}

export function buildLaporanMessage({ orangTuaNama, anakNama, programTitle, subProgram, tanggal, tipe, laporanUmum, catatanKhusus }) {
  const tglStr = tanggal instanceof Date
    ? tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : formatTanggal(tanggal);

  let narasi = (laporanUmum || "").trim();
  if (isTipeMultiAnak(tipe) && catatanKhusus && catatanKhusus.trim()) {
    narasi += (narasi ? "\n\n" : "") + `Catatan khusus untuk ${anakNama}:\n${catatanKhusus.trim()}`;
  }
  if (!narasi) narasi = "-";

  return (
    `Yth. Bapak/Ibu ${orangTuaNama || ""},\n\n` +
    `Berikut kami sampaikan laporan sesi untuk ananda ${anakNama}.\n\n` +
    `Program: ${programTitle}${subProgram ? " – " + subProgram : ""}\n` +
    `Tanggal: ${tglStr}\n\n` +
    `Ringkasan laporan:\n${narasi}\n\n` +
    `Laporan lengkap beserta dokumentasi kami lampirkan dalam bentuk file PDF.\n` +
    `Demikian laporan ini kami sampaikan. Terima kasih atas kepercayaan Bapak/Ibu kepada KidsPodu.\n\n` +
    `Hormat kami,\n` +
    `Tim KidsPodu\n\n` +
    `Kunjungi web kami di https://kidspodu.web.app/`
  );
}