import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  doc,
  setDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

async function bumpTotalAnak(delta) {
  try {
    await setDoc(doc(db, "stats_public", "main"), { totalAnak: increment(delta) }, { merge: true });
  } catch (err) {
    console.error("Gagal update stats_public.totalAnak:", err);
  }
}

export async function recalcTotalAnak() {
  const snap = await getDocs(collection(db, "anak"));
  const total = snap.size;
  await setDoc(doc(db, "stats_public", "main"), { totalAnak: total }, { merge: true });
  return total;
}

export function normalizeWaNumber(raw) {
  let digits = String(raw || "").replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

export async function addAnak({ nama, tanggalLahir, program, orangTuaNama, orangTuaNoWa, orangTuaAlamat }) {
  const ref = await addDoc(collection(db, "anak"), {
    nama: nama.trim(),
    tanggalLahir: tanggalLahir ? Timestamp.fromDate(new Date(tanggalLahir)) : null,
    program: program || [],
    orangTua: {
      nama: orangTuaNama.trim(),
      noWa: normalizeWaNumber(orangTuaNoWa),
      alamat: orangTuaAlamat.trim(),
    },
    status: "aktif",
    createdAt: serverTimestamp(),
  });
  await bumpTotalAnak(1);
  return ref;
}

export async function listAnak() {
  const snap = await getDocs(query(collection(db, "anak"), orderBy("nama")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listAnakByProgram(programId, subProgram) {
  const all = await listAnak();
  return all.filter(
    (a) =>
      (a.status || "aktif") === "aktif" &&
      (a.program || []).some(
        (p) => p.programId === programId && (!subProgram || p.subProgram === subProgram)
      )
  );
}

export async function updateAnak(anakId, { nama, tanggalLahir, program, orangTuaNama, orangTuaNoWa, orangTuaAlamat, status }) {
  await updateDoc(doc(db, "anak", anakId), {
    nama: nama.trim(),
    tanggalLahir: tanggalLahir ? Timestamp.fromDate(new Date(tanggalLahir)) : null,
    program: program || [],
    orangTua: {
      nama: orangTuaNama.trim(),
      noWa: normalizeWaNumber(orangTuaNoWa),
      alamat: orangTuaAlamat.trim(),
    },
    status: status || "aktif",
  });
}

export async function deleteAnak(anakId) {
  await deleteDoc(doc(db, "anak", anakId));
  await bumpTotalAnak(-1);
}