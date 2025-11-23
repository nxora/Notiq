// src/lib/quizService.js
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
import nlp from "compromise";

 const quizCollectionRef = (userId) => collection(db, "users", userId, "quizzes");

 export async function createQuiz(user, title = "Untitled Quiz", questions = []) {
  const col = quizCollectionRef(user.uid);
  const docRef = await addDoc(col, {
    title,
    questions,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deleted: false,
  });

  return { id: docRef.id, title, questions };
}

export async function updateQuiz(user, quizId, data) {
  const ref = doc(db, "users", user.uid, "quizzes", quizId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteQuiz(user, quizId, soft = true) {
  const ref = doc(db, "users", user.uid, "quizzes", quizId);
  return soft
    ? updateDoc(ref, { deleted: true, updatedAt: serverTimestamp() })
    : deleteDoc(ref);
}

 export function subscribeToQuizzes(user, onUpdate) {
  const q = query(quizCollectionRef(user.uid), orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const quizzes = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((q) => !q.deleted);
      onUpdate(quizzes);
    },
    (err) => {
      console.warn("quiz subscription error:", err);
      onUpdate([]);
    }
  );
}

 export const QuizDraft = {
  key(id) {
    return `quiz_draft_${id}`;
  },
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

 export function filterQuizzes(quizzes, queryString) {
  if (!queryString) return quizzes;
  const s = queryString.toLowerCase();
  return quizzes.filter((q) => {
    const title = (q.title || "").toLowerCase();
    return title.includes(s);
  });
}

/* ----------------------- AUTO-GENERATE QUIZZES FROM NOTES ----------------- */
/**
 * Extract keywords from note content and create simple multiple-choice questions
 * @param {string} noteContent
 */
export function generateQuizFromNoteContent(noteContent) {
  const doc = nlp(noteContent || "");
  const sentences = doc.sentences().out("array").slice(0, 10); 
  const questions = sentences.map((s) => {
    const terms = nlp(s).nouns().out("array");  
    const answer = terms[0] || "";
    return {
      question: s,
      options: shuffleArray([answer, "Option A", "Option B", "Option C"]),
      answer,
    };
  });
  return questions;
}

 function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
