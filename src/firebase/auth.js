import {
  sendSignInLinkToEmail,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const actionCodeSettings = {
  url: "https://notiq-jjca20qm8-daveora.vercel.app/login",
  handleCodeInApp: true,
};

// -------------------- REGISTER --------------------
export const registerUser = async (email) => {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem("emailForSignIn", email);
  return { needsVerification: true };
};

// -------------------- LOGIN EMAIL-ONLY --------------------
export const loginUser = async (email) => {
  if (!email) throw new Error("Email is required.");

  // check cached session first
  const cached = localStorage.getItem("notiq_user");
  if (cached) {
    const user = JSON.parse(cached);
    if (user.email === email) return user;
  }

  const q = query(collection(db, "users"), where("email", "==", email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) throw new Error("Email not registered.");

  const userDoc = snapshot.docs[0].data();

  // save session locally
  localStorage.setItem("notiq_user", JSON.stringify(userDoc));
  return userDoc;
};

// -------------------- PROVIDER LOGIN --------------------
export const loginWithProvider = async (provider) => {
  const result = await signInWithPopup(auth, provider);
  await createUserDocument(result.user);

  const userDoc = {
    email: result.user.email,
    displayName: result.user.displayName || "",
    photoURL: result.user.photoURL || "",
    uid: result.user.uid,
  };
  localStorage.setItem("notiq_user", JSON.stringify(userDoc));

  return result.user;
};

// -------------------- CREATE/UPDATE USER DOC --------------------
export const createUserDocument = async (user) => {
  if (!user) return;
  const ref = doc(db, "users", user.uid);

  await setDoc(
    ref,
    {
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    },
    { merge: true }
  );
};

// -------------------- RESET PASSWORD --------------------
export const resetPassword = async (email) => sendPasswordResetEmail(auth, email);

// -------------------- LOGOUT --------------------
export const logoutUser = () => {
  localStorage.removeItem("notiq_user");
  localStorage.removeItem("cachedProfile");
};

// -------------------- GET CACHED USER --------------------
export const getCachedUser = () => {
  const cached = localStorage.getItem("notiq_user");
  if (!cached) return null;
  return JSON.parse(cached);
};
