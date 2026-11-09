import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const PER_SUB_TEMPLATE_PROGRAMS = new Set(["olahraga"]);

export function programHasSubTemplates(programId) {
  return PER_SUB_TEMPLATE_PROGRAMS.has(programId);
}

export function templateKey(programId, sub) {
  return programHasSubTemplates(programId) && sub ? `${programId}::${sub}` : programId;
}

export async function listProgramTemplates() {
  const snap = await getDocs(collection(db, "program_templates"));
  const map = {};
  snap.docs.forEach((d) => { map[d.id] = d.data().template || ""; });
  return map;
}

export async function saveProgramTemplate(id, template) {
  return setDoc(
    doc(db, "program_templates", id),
    { template: (template || "").trim(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getProgramTemplate(programId, sub) {
  if (!programId) return "";
  const snap = await getDoc(doc(db, "program_templates", templateKey(programId, sub)));
  return snap.exists() ? (snap.data().template || "") : "";
}