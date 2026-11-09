
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const DUMMY_PROGRAMS = [
  {
    id: "terapi",
    className: "p-terapi",
    title: "Terapi",
    items: ["Perilaku", "Okupasi", "Wicara"],
    imageSlot: "program_terapi.png",
  },
  {
    id: "olahraga",
    className: "p-olahraga",
    title: "Olahraga",
    items: ["Karate", "Renang", "Kebugaran Jasmani"],
    imageSlot: "program_olahraga.png",
  },
  {
    id: "psikolog",
    className: "p-psikolog",
    title: "Layanan Psikolog Klinis",
    items: ["Asesmen Gangguan", "Tes Intelegensi", "Tes Minat & Bakat", "Tes Kepribadian"],
    imageSlot: "program_psikolog.png",
  },
  {
    id: "vokasi",
    className: "p-vokasi",
    title: "Vokasi",
    items: ["Laundry", "Kewirausahaan"],
    imageSlot: "program_olahraga.png",
  },
  {
    id: "lifeskill",
    className: "p-lifeskill",
    title: "Life Skills",
    items: ["Bina Diri Aktifitas Sehari-Hari"],
    imageSlot: "program_life.png",
  },
  {
    id: "shadow-teacher",
    className: "p-shadow",
    title: "Shadow Teacher",
    items: ["Semua Jenjang Pendidikan"],
    imageSlot: "program_shadow.png",
  },
  {
    id: "intervention",
    className: "p-intervention",
    title: "Intervention Teaching",
    items: ["Semua Jenjang Pendidikan"],
    imageSlot: "program_inter.png",
  },
];



const DUMMY_STATS = { childrenHelped: "100+", programs: "8+", yearsExperience: "5+" };

const DUMMY_WHY_TRUST = [
  { title: "Tenaga Profesional Bersertifikat", desc: "Semua terapis & pengajar memiliki sertifikasi resmi." },
  { title: "Pendekatan Personal", desc: "Program disesuaikan dengan kebutuhan setiap anak." },
  { title: "Lingkungan Aman & Nyaman", desc: "Tempat belajar yang bersih, nyaman dan ramah anak." },
  { title: "Evaluasi Berkala", desc: "Perkembangan anak dipantau secara berkala." },
  { title: "Penuh Kasih & Empati", desc: "Kami melayani dengan hati dan kesabaran." },
];


export async function getPrograms() {
  return DUMMY_PROGRAMS;
}
export async function getFounder() {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "founder", "main"));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { name1: data.name1, name2: data.name2, quote: data.quote, imageSlot: data.photoUrl || "" };
  } catch (err) {
    console.error("getFounder() gagal:", err);
    return null;
  }
}
export async function getTeamPreview() {
  if (!db) return [];
  try {
    const q = query(collection(db, "team"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, name: d.data().name, role: d.data().role || "", imageSlot: d.data().photoUrl || "" }));
  } catch (err) {
    console.error("getTeamPreview() gagal:", err);
    return [];
  }
}
export async function getTestimonials(limitCount = 20) {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "testimonials"),
      where("published", "==", true),
      orderBy("createdAt", "desc"),
      fbLimit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("getTestimonials() gagal:", err);
    return [];
  }
}
export async function getSosmed() {
  if (!db) return { instagramReels: [], instagramFeed: [], tiktok: [] };
  try {
    const q = query(
      collection(db, "sosmed_posts"),
      where("published", "==", true),
      orderBy("createdAt", "desc"),
      fbLimit(60)
    );
    const snap = await getDocs(q);
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return {
      instagramReels: posts.filter((p) => p.platform === "instagram" && p.kind === "reel").slice(0, 3),
      instagramFeed: posts.filter((p) => p.platform === "instagram" && p.kind === "feed").slice(0, 3),
      tiktok: posts.filter((p) => p.platform === "tiktok"),
    };
  } catch (err) {
    console.error("getSosmed() gagal:", err);
    return { instagramReels: [], instagramFeed: [], tiktok: [] };
  }
}

function articleExcerpt(content, maxLen = 140) {
  const withoutTags = (content || "").replace(/<[^>]*>/g, " ");
  const plain = withoutTags.replace(/\s+/g, " ").trim();
  return plain.length > maxLen ? plain.slice(0, maxLen).trim() + "…" : plain;
}

export async function getArticles(limitCount = 50) {
  if (!db) return [];
  const q = query(
    collection(db, "articles"),
    where("published", "==", true),
    orderBy("createdAt", "desc"),
    fbLimit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, excerpt: articleExcerpt(data.content) };
  });
}

export async function getArticleById(id) {
  if (!db || !id) return null;
  const snap = await getDoc(doc(db, "articles", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
export async function getStats() {
  return DUMMY_STATS;
}

export async function getTotalAnak() {
  if (!db) return 0;
  try {
    const snap = await getDoc(doc(db, "stats_public", "main"));
    return snap.exists() ? (snap.data().totalAnak || 0) : 0;
  } catch (err) {
    console.error("getTotalAnak() gagal:", err);
    return 0;
  }
}
export async function getWhyTrust() {
  return DUMMY_WHY_TRUST;
}

export { db, collection, getDocs };