// src/lib/flashcardService.js
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

 const flashcardsRef = (userId) => collection(db, "users", userId, "flashcards");

 
export async function createFlashcard(user) {
  const col = flashcardsRef(user.uid);
  const docRef = await addDoc(col, {
    front: "",
    back: "",
    tags: [],
    mastered: false,
    score: 0,  
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deleted: false,
  });

   return { id: docRef.id, front: "", back: "", tags: [], mastered: false, score: 0 };
}


export async function updateFlashcard(user, cardId, data) {
  const ref = doc(db, "users", user.uid, "flashcards", cardId);
  return updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

 
export async function deleteFlashcard(user, cardId, soft = true) {
  const ref = doc(db, "users", user.uid, "flashcards", cardId);
  return soft ? updateDoc(ref, { deleted: true, updatedAt: serverTimestamp() }) : deleteDoc(ref);
}

 
 
export function subscribeToFlashcards(user, onUpdate) {
  const q = query(flashcardsRef(user.uid), orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const cards = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => !c.deleted);
      onUpdate(cards);
    },
    (err) => {
      console.warn("flashcards subscription error:", err);
      onUpdate([]);
    }
  );
}


export const FlashDraft = {
  key(id) { return `flash_draft_${id}` },
  save(id, data) {
    try {
      localStorage.setItem(this.key(id), JSON.stringify(data));
    } catch {}
  },
  load(id) {
    try {
      return JSON.parse(localStorage.getItem(this.key(id)) || "{}");
    } catch {
      return {};
    }
  },
  remove(id) {
    try {
      localStorage.removeItem(this.key(id));
    } catch {}
  },
};

 
export function makeDebouncer(fn, delay = 600) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

 
 
export function adjustScore(currentScore, correct) {
  if (correct) {
    return Math.min(5, currentScore + 1);
  } else {
    return Math.max(0, (currentScore || 0) - 1);
  }
}

 
export function stripText(str = "") {
  return (str || "").toString().replace(/<[^>]+>/g, "");
}

export function filterFlashcards(cards, queryString, tags = []) {
  let results = cards;
  if (queryString) {
    const s = queryString.toLowerCase();
    results = results.filter((c) => {
      return (c.front || "").toLowerCase().includes(s) || (c.back || "").toLowerCase().includes(s);
    });
  }
  if (tags?.length) {
    results = results.filter((c) => (c.tags || []).some((t) => tags.includes(t)));
  }
  return results;
}
