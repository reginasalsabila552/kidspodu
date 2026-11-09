import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export function guardDashboard(requiredRole, onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/portal-login";
      return;
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists() || snap.data().role !== requiredRole) {
      window.location.href = "/portal-login";
      return;
    }
    const userData = { uid: user.uid, email: user.email, ...snap.data() };
    await syncVerifiedEmail(user, userData);
    await syncVerifiedStatus(user, userData);
    onReady(userData);
  });
}

async function syncVerifiedStatus(user, userData) {
  if (userData.status !== "menunggu_verifikasi") return;
  try {
    await updateDoc(doc(db, "users", user.uid), { status: "aktif" });
    userData.status = "aktif";
  } catch (err) {
    console.warn("Gagal sinkronkan status verifikasi pelatih:", err);
  }
}

async function syncVerifiedEmail(user, userData) {
  try {
    await user.reload();
    if (user.email && user.email !== userData.email) {
      await user.getIdToken(true);
      await updateDoc(doc(db, "users", user.uid), {
        email: user.email,
        pendingEmail: deleteField(),
      });
      userData.email = user.email;
      delete userData.pendingEmail;
    }
  } catch (err) {
    console.warn("Gagal sinkronkan email terverifikasi:", err);
  }
}

export function wireLogout(buttonSelector) {
  const btn = document.querySelector(buttonSelector);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/portal-login";
  });
}