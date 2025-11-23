// src/components/FlashcardEditor.jsx
import React, { useEffect, useRef, useState } from "react";
import { FlashDraft, makeDebouncer, updateFlashcard, deleteFlashcard } from "../lib/flashcardService";
import { useAuth } from "../context/AuthContext";

export default function FlashcardEditor({ card, onDeleted, onUpdated }) {
  const { user } = useAuth();
  const [front, setFront] = useState(card?.front || "");
  const [back, setBack] = useState(card?.back || "");
  const [tagsInput, setTagsInput] = useState((card?.tags || []).join(", "));
  const savingRef = useRef(false);

  useEffect(() => {
    setFront(card?.front || "");
    setBack(card?.back || "");
    setTagsInput((card?.tags || []).join(", "));
  }, [card?.id]);

  // Debounced update function
  const debouncedSave = useRef(
    makeDebouncer(async (id, payload) => {
      if (!user || !id) return;
      try {
        savingRef.current = true;
        await updateFlashcard(user, id, payload);
      } catch (err) {
        console.warn("save error:", err);
      } finally {
        savingRef.current = false;
      }
    }, 650)
  );

  // Draft autosave locally whenever local state changes
  useEffect(() => {
    if (!card) return;
    FlashDraft.save(card.id, { front, back, tags: tagsInput });
    debouncedSave.current(card.id, { front, back, tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean) });
  }, [front, back, tagsInput, card?.id]);

  const handleDelete = async () => {
    if (!user || !card) return;
    await deleteFlashcard(user, card.id, true);
    FlashDraft.remove(card.id);
    onDeleted(card.id);
  };

  return (
    
    <div className="flex-1 px-8 py-8">
      {!card ? (
        <div className="h-full flex items-center justify-center text-gray-400">Select or create a flashcard</div>
      ) : (
        <div className="max-w-3xl">
          <div className="mb-4">
            <label className="text-sm text-gray-600">Front</label>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={4}
              className="w-full mt-2 p-3 rounded-md border border-gray-200 resize-none"
            />
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-600">Back</label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={6}
              className="w-full mt-2 p-3 rounded-md border border-gray-200 resize-none"
            />
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-600">Tags (comma separated)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full mt-2 p-2 rounded-md border border-gray-200"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => debouncedSave.current(card.id, { front, back, tags: tagsInput.split(",").map((s)=>s.trim()).filter(Boolean) })} className="btn btn-sm">
              Save now
            </button>
            <button onClick={handleDelete} className="btn btn-sm btn-ghost text-red-600">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
