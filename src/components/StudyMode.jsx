// src/components/StudyMode.jsx
import React, { useEffect, useState } from "react";
import { adjustScore, updateFlashcard } from "../lib/flashcardService";
import { useAuth } from "../context/AuthContext";

export default function StudyMode({ cards = [], onClose }) {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((v) => !v);
      } else if (e.code === "ArrowRight") {
        setIndex((i) => Math.min(cards.length - 1, i + 1));
        setFlipped(false);
      } else if (e.code === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
        setFlipped(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards]);

  if (!cards || cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
        <div className="bg-white p-6 rounded-md">No cards selected for study.</div>
      </div>
    );
  }

  const card = cards[index];

  const mark = async (correct) => {
    if (!user) return;
    const nextScore = adjustScore(card.score || 0, correct);
    await updateFlashcard(user, card.id, { score: nextScore, mastered: nextScore >= 4 });
    setIndex((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white max-w-2xl w-full rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-600">Close</button>

        <div
          onClick={() => setFlipped((v) => !v)}
          className={`cursor-pointer rounded-lg p-8 min-h-[260px] flex items-center justify-center text-center transition-transform ${
            flipped ? "rotate-y-180" : ""
          }`}
        >
          {!flipped ? (
            <div>
              <div className="text-xl font-semibold mb-3">{card.front}</div>
              <div className="text-sm text-gray-500">Tap or press Space to flip</div>
            </div>
          ) : (
            <div>
              <div className="text-lg mb-4">{card.back}</div>
              <div className="flex items-center gap-2 justify-center mt-6">
                <button onClick={() => mark(false)} className="btn btn-ghost text-red-600">Again</button>
                <button onClick={() => mark(true)} className="btn btn-primary">Good</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500 flex justify-between">
          <div>{index + 1} / {cards.length}</div>
          <div>Score: {card.score || 0} {card.mastered ? "· Mastered" : ""}</div>
        </div>
      </div>
    </div>
  );
}
