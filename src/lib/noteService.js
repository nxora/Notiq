// src/lib/noteService.js
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

const notesCollectionRef = (userId) => collection(db, "users", userId, "notes");

export async function createNote(user) {
  const col = notesCollectionRef(user.uid);
  const docRef = await addDoc(col, {
    title: "",
    content: "<p></p>",
    tags: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deleted: false,
  });

  // return a minimal local representation (we'll rely on listener to pick up real data)
  return { id: docRef.id, title: "", content: "<p></p>", tags: [] };
}

export function subscribeToNotes(user, onUpdate) {
  const q = query(notesCollectionRef(user.uid), orderBy("updatedAt", "desc"));
  const unsub = onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((n) => !n.deleted);
    onUpdate(notes);
  }, (err) => {
    console.warn("notes subscription error:", err);
    onUpdate([]); // fallback
  });

  return unsub;
}

export async function updateNote(user, noteId, data) {
  const ref = doc(db, "users", user.uid, "notes", noteId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(user, noteId, soft = true) {
  const ref = doc(db, "users", user.uid, "notes", noteId);
  if (soft) {
    await updateDoc(ref, { deleted: true, updatedAt: serverTimestamp() });
  } else {
    await deleteDoc(ref);
  }
}

export async function getNotesOnce(user) {
  // fallback one-time read if needed (not used in the component below)
  const q = query(notesCollectionRef(user.uid), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(n => !n.deleted);
}
