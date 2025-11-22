import {  signInWithEmailAndPassword, sendPasswordResetEmail, sendSignInLinkToEmail } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const actionCodeSettings = {
  // URL you want to redirect back to
  url: "http://localhost:5173/login",
  handleCodeInApp: true,
};

export const registerUser = async (email) => {
   await sendSignInLinkToEmail(auth, email, actionCodeSettings)
   localStorage.setItem("emailForSignIn", email)
   
   return {needsVerification: true }
}

export function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
}