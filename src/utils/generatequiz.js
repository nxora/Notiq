import nlp from "compromise";

export function generateQuizFromNoteContent(noteContent) {
  const doc = nlp(noteContent || "");
  const sentences = doc.sentences().out("array").slice(0, 10);

  return sentences.map((s) => {
    const terms = nlp(s).nouns().out("array");
    const answer = terms[0] || "Answer";
    const options = shuffleArray([answer, "Option A", "Option B", "Option C"]);
    return { question: s, options, answer };
  });
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
