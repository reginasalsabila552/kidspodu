import { db, storage } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
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

async function compressImage(file, maxDim = 1600, quality = 0.78) {
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
    console.warn("Gagal kompres gambar, upload file asli:", err);
    return file;
  }
}

export async function uploadCoverImage(file, onProgress) {
  const compressed = await compressImage(file);
  const path = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}-${compressed.name}`;
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

export async function addArtikel({ title, content, coverImageUrl, published }) {
  return addDoc(collection(db, "articles"), {
    title: title.trim(),
    content: content.trim(),
    coverImageUrl: coverImageUrl || "",
    published: published !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateArtikel(id, { title, content, coverImageUrl, published }) {
  const patch = { updatedAt: serverTimestamp() };
  if (title !== undefined) patch.title = title.trim();
  if (content !== undefined) patch.content = content.trim();
  if (coverImageUrl !== undefined) patch.coverImageUrl = coverImageUrl;
  if (published !== undefined) patch.published = published;
  return updateDoc(doc(db, "articles", id), patch);
}

export async function deleteArtikel(id) {
  return deleteDoc(doc(db, "articles", id));
}

export async function listArtikelAdmin() {
  const snap = await getDocs(query(collection(db, "articles"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}