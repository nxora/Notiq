// src/lib/noteService.js
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

/* --------------------------- COLLECTION REFERENCE --------------------------- */

const notesCollectionRef = (userId) => collection(db, "users", userId, "notes");

/* ------------------------------- CRUD LOGIC -------------------------------- */

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
  return { id: docRef.id, title: "", content: "<p></p>", tags: [] };
}

export function subscribeToNotes(user, onUpdate) {
  const q = query(notesCollectionRef(user.uid), orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const notes = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((n) => !n.deleted);
      onUpdate(notes);
    },
    (err) => {
      console.warn("notes subscription error:", err);
      onUpdate([]);
    }
  );
}

export async function updateNote(user, noteId, data) {
  const ref = doc(db, "users", user.uid, "notes", noteId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteNote(user, noteId, soft = true) {
  const ref = doc(db, "users", user.uid, "notes", noteId);
  return soft
    ? updateDoc(ref, { deleted: true, updatedAt: serverTimestamp() })
    : deleteDoc(ref);
}

/* ---------------------------- LOCAL DRAFT CACHE ---------------------------- */

export const Draft = {
  key(id) {
    return `note_draft_${id}`;
  },

  save(id, data) {
    localStorage.setItem(this.key(id), JSON.stringify(data));
  },

  load(id) {
    try {
      return JSON.parse(localStorage.getItem(this.key(id)) || "{}");
    } catch {
      return {};
    }
  },

  remove(id) {
    localStorage.removeItem(this.key(id));
  },
};

/* ----------------------------- DEBOUNCE UTIL ------------------------------ */

export function makeDebouncer(fn, delay = 600) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* ------------------------------ SEARCH UTILS ------------------------------ */

export function stripHtml(html = "") {
  return html.replace(/<[^>]+>/g, "");
}

export function filterNotes(notes, queryString) {
  if (!queryString) return notes;

  const s = queryString.toLowerCase();
  return notes.filter((note) => {
    const title = (note.title || "").toLowerCase();
    const text = stripHtml(note.content || "").toLowerCase();
    return title.includes(s) || text.includes(s);
  });
}
