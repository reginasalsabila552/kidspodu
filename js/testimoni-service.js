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

export async function addTestimoni({ name, screenshotUrl, published }) {
  return addDoc(collection(db, "testimonials"), {
    name: (name || "").trim(),
    screenshotUrl: (screenshotUrl || "").trim(),
    published: published !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTestimoni(id, { name, screenshotUrl, published }) {
  const patch = { updatedAt: serverTimestamp() };
  if (name !== undefined) patch.name = (name || "").trim();
  if (screenshotUrl !== undefined) patch.screenshotUrl = (screenshotUrl || "").trim();
  if (published !== undefined) patch.published = published;
  return updateDoc(doc(db, "testimonials", id), patch);
}

export async function deleteTestimoni(id) {
  return deleteDoc(doc(db, "testimonials", id));
}

export async function listTestimoniAdmin() {
  const snap = await getDocs(query(collection(db, "testimonials"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
