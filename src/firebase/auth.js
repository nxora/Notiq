// src/firebase/auth.js
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup,
} from "firebase/auth";

import { auth, db } from "./firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// --------------------- ACTION CODE SETTINGS ---------------------
export const actionCodeSettings = {
  url: "http://localhost:5173/login",
  handleCodeInApp: true,
};

// --------------------- CREATE / UPDATE USER IN FIRESTORE ---------------------
export async function createUserProfile(user) {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);

  await setDoc(
    userRef,
    {
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      lastLogin: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// --------------------- SEND LOGIN EMAIL LINK ---------------------
export async function sendMagicLink(email) {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem("emailForSignIn", email);
}

// --------------------- COMPLETE LOGIN WITH EMAIL LINK ---------------------
export async function completeEmailLinkLogin() {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = localStorage.getItem("emailForSignIn");

    if (!email) {
      email = window.prompt("Enter your email");
    }

    const cred = await signInWithEmailLink(auth, email, window.location.href);

    await createUserProfile(cred.user);

    localStorage.removeItem("emailForSignIn");
    return true;
  }
  return false;
}

// --------------------- PROVIDER LOGINS ---------------------
export async function loginWithProvider(provider) {
  const result = await signInWithPopup(auth, provider);
  await createUserProfile(result.user);
  return result.user;
}
