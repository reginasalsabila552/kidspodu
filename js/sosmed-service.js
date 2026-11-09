import { db } from "./firebase-config.js";
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

export async function addSosmedPost({ platform, kind, url, published }) {
  return addDoc(collection(db, "sosmed_posts"), {
    platform,
    kind: platform === "tiktok" ? "video" : kind,
    url: (url || "").trim(),
    published: published !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSosmedPost(id, { platform, kind, url, published }) {
  const patch = { updatedAt: serverTimestamp() };
  if (platform !== undefined) patch.platform = platform;
  if (platform !== undefined || kind !== undefined) {
    patch.kind = (platform === "tiktok") ? "video" : kind;
  }
  if (url !== undefined) patch.url = (url || "").trim();
  if (published !== undefined) patch.published = published;
  return updateDoc(doc(db, "sosmed_posts", id), patch);
}

export async function deleteSosmedPost(id) {
  return deleteDoc(doc(db, "sosmed_posts", id));
}

export async function listSosmedAdmin() {
  const snap = await getDocs(query(collection(db, "sosmed_posts"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
