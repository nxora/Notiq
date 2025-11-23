const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nlp = require("compromise");

admin.initializeApp();
const db = admin.firestore();

/* ------------------------- HELPER: GENERATE QUIZ ------------------------- */
function generateQuizFromNoteContent(noteContent) {
  const doc = nlp(noteContent || "");
  const sentences = doc.sentences().out("array").slice(0, 10); // first 10 sentences
  const questions = sentences.map((s) => {
    const terms = nlp(s).nouns().out("array");
    const answer = terms[0] || "Answer";
    const options = shuffleArray([answer, "Option A", "Option B", "Option C"]);
    return { question: s, options, answer };
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

/* ------------------ FIRESTORE TRIGGER: NOTES ------------------ */
exports.autoGenerateQuiz = functions.firestore
  .document("users/{userId}/notes/{noteId}")
  .onWrite(async (change, context) => {
    const { userId, noteId } = context.params;
    const noteData = change.after.exists ? change.after.data() : null;

    if (!noteData || !noteData.content) return null;

    const quizRef = db.collection("users").doc(userId).collection("quizzes").doc();
    const quizData = {
      title: `Quiz from: ${noteData.title || "Untitled Note"}`,
      questions: generateQuizFromNoteContent(noteData.content),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deleted: false,
    };

    await quizRef.set(quizData);
    console.log(`Generated quiz ${quizRef.id} for user ${userId} from note ${noteId}`);
    return null;
  });
