import React, { useState } from "react";

export default function StudyQuiz({ quiz, onClose }) {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  if (!quiz || !quiz.questions?.length) return null;

  const q = quiz.questions[index];

  const mark = (correct) => {
    if (correct) setScore(score + 1);
    const next = index + 1;
    if (next < quiz.questions.length) {
      setIndex(next);
      setShowAnswer(false);
    } else {
      alert(`Quiz completed! Score: ${score + (correct ? 1 : 0)} / ${quiz.questions.length}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white max-w-2xl w-full rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600">Close</button>
        <div className="text-lg font-semibold">{q.question}</div>

        {showAnswer && (
          <div className="mt-4 border p-4 rounded bg-gray-50">
            Answer: {q.answer}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={() => setShowAnswer(true)} className="px-3 py-1 bg-gray-300 rounded">Show Answer</button>
          <button onClick={() => mark(true)} className="px-3 py-1 bg-green-500 text-white rounded">Correct</button>
          <button onClick={() => mark(false)} className="px-3 py-1 bg-red-500 text-white rounded">Wrong</button>
        </div>

        <div className="mt-4 text-sm text-gray-500">{index + 1} / {quiz.questions.length}</div>
      </div>
    </div>
  );
}
