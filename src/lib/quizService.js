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

 const quizzesCollectionRef = (userId) => collection(db, "users", userId, "quizzes");

 export async function createQuiz(user) {
  const col = quizzesCollectionRef(user.uid);
  const docRef = await addDoc(col, {
    title: "New Quiz",
    questions: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deleted: false,
  });
  return { id: docRef.id, title: "New Quiz", questions: [] };
}

export function subscribeToQuizzes(user, onUpdate) {
  const q = query(quizzesCollectionRef(user.uid), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const quizzes = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((q) => !q.deleted);
      onUpdate(quizzes);
    },
    (err) => {
      console.warn("quizzes subscription error:", err);
      onUpdate([]);
    }
  );
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

 export const Draft = {
  key(id) {
    return `quiz_draft_${id}`;
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
  return quizzes.filter((quiz) => quiz.title.toLowerCase().includes(s));
}
