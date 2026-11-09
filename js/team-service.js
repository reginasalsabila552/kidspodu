import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";


export async function getFounderAdmin() {
  const snap = await getDoc(doc(db, "founder", "main"));
  return snap.exists() ? snap.data() : null;
}

export async function setFounder({ name1, name2, quote, photoUrl }) {
  return setDoc(
    doc(db, "founder", "main"),
    {
      name1: name1.trim(),
      name2: name2.trim(),
      quote: quote.trim(),
      photoUrl: photoUrl || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}


export async function addTeamMember({ name, role, photoUrl }) {
  return addDoc(collection(db, "team"), {
    name: name.trim(),
    role: (role || "").trim(),
    photoUrl: photoUrl || "",
    order: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTeamMember(id, { name, role, photoUrl }) {
  const patch = { updatedAt: serverTimestamp() };
  if (name !== undefined) patch.name = name.trim();
  if (role !== undefined) patch.role = role.trim();
  if (photoUrl !== undefined) patch.photoUrl = photoUrl;
  return updateDoc(doc(db, "team", id), patch);
}

export async function deleteTeamMember(id) {
  return deleteDoc(doc(db, "team", id));
}

export async function listTeamAdmin() {
  const snap = await getDocs(query(collection(db, "team"), orderBy("order", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function swapTeamOrder(idA, orderA, idB, orderB) {
  await Promise.all([
    updateDoc(doc(db, "team", idA), { order: orderB }),
    updateDoc(doc(db, "team", idB), { order: orderA }),
  ]);
}