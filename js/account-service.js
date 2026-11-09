import { auth } from "./firebase-config.js";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

export async function changeMyPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error("Belum login.");
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}
