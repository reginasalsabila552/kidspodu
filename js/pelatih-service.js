import { db, firebaseConfig, auth, storage } from "./firebase-config.js";
import { normalizeWaNumber } from "./anak-service.js";
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
    img.src = url;
  });
}

async function compressImage(file, maxDim = 800, quality = 0.82) {
  if (!file.type.startsWith("image/")) return file;
  try {
    const img = await loadImageElement(file);
    let { width, height } = img;
    if (Math.max(width, height) > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch (err) {
    console.warn("Gagal kompres foto, upload file asli:", err);
    return file;
  }
}

export async function uploadPelatihFoto(file, onProgress) {
  const compressed = await compressImage(file);
  const path = `pelatih/${Date.now()}-${Math.random().toString(36).slice(2)}-${compressed.name}`;
  const fileRef = ref(storage, path);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, compressed);
    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) onProgress({ percent: Math.round((snap.bytesTransferred / snap.totalBytes) * 100) });
      },
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}

const verifyActionCodeSettings = {
  url: `${window.location.origin}/portal-login`,
  handleCodeInApp: false,
};

export async function addPelatih({ nama, email, password, kontak, alamat, fotoUrl }) {
  const secondaryApp = initializeApp(firebaseConfig, `pelatih-registration-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim(),
      password
    );
    const uid = cred.user.uid;

    await setDoc(doc(db, "users", uid), {
      name: nama.trim(),
      email: email.trim(),
      role: "pelatih",
      phone: normalizeWaNumber(kontak),
      alamat: (alamat || "").trim(),
      fotoUrl: fotoUrl || "",
      status: "aktif",
      createdAt: serverTimestamp(),
    });

    return uid;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}

export async function updatePelatih(uid, { nama, kontak, alamat, fotoUrl, status }) {
  const patch = {};
  if (nama !== undefined) patch.name = nama.trim();
  if (kontak !== undefined) patch.phone = normalizeWaNumber(kontak);
  if (alamat !== undefined) patch.alamat = (alamat || "").trim();
  if (fotoUrl !== undefined) patch.fotoUrl = fotoUrl;
  if (status !== undefined) patch.status = status;
  return updateDoc(doc(db, "users", uid), patch);
}

export async function updateMyProfile(uid, { nama, kontak, alamat, fotoUrl }) {
  const patch = { updatedAt: serverTimestamp() };
  if (nama !== undefined) patch.name = nama.trim();
  if (kontak !== undefined) patch.phone = normalizeWaNumber(kontak);
  if (alamat !== undefined) patch.alamat = (alamat || "").trim();
  if (fotoUrl !== undefined) patch.fotoUrl = fotoUrl;
  return updateDoc(doc(db, "users", uid), patch);
}

export async function requestMyEmailChange(newEmail) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sesi login tidak ditemukan, coba login ulang.");
  const trimmed = (newEmail || "").trim();
  if (!trimmed) throw new Error("Email baru tidak boleh kosong.");
  if (trimmed.toLowerCase() === (user.email || "").toLowerCase()) {
    throw new Error("Email baru sama dengan email yang sekarang.");
  }
  await verifyBeforeUpdateEmail(user, trimmed);
  await updateDoc(doc(db, "users", user.uid), { pendingEmail: trimmed });
}

export async function listPelatih() {
  const snap = await getDocs(
    query(collection(db, "users"), where("role", "==", "pelatih"))
  );
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export async function deletePelatih(uid) {
  await deleteDoc(doc(db, "users", uid));
}

export async function sendPelatihPasswordReset(email) {
  if (!email) throw new Error("Pelatih ini tidak punya alamat email yang tercatat.");
  await sendPasswordResetEmail(auth, email.trim(), verifyActionCodeSettings);
}

export const resendPelatihVerification = sendPelatihPasswordReset;