// src/pages/Flashcards.jsx
import React, { useEffect, useState } from "react";
import FlashcardList from "../components/FlashcardList";
import FlashcardEditor from "../components/FlashcardEditor";
import StudyMode from "../components/StudyMode";
import { useAuth } from "../context/AuthContext";
import {
  createFlashcard,
  subscribeToFlashcards,
  FlashDraft,
  filterFlashcards,
} from "../lib/flashcardService";

export default function FlashCard () {
  const { user, loading } = useAuth();

  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [studyOpen, setStudyOpen] = useState(false);
  const [studyCards, setStudyCards] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFlashcards(user, (list) => {
      setCards(list);
      // keep selected in sync if it exists
      setSelected((prev) => (prev ? list.find((c) => c.id === prev.id) || null : prev));
    });
    return () => unsub && unsub();
  }, [user]);

  const handleNew = async () => {
    if (!user) return;
    const newC = await createFlashcard(user);
    setSelected(newC);
    FlashDraft.save(newC.id, { front: "", back: "", tags: [] });
  };

  const handleDeleted = (id) => {
    setSelected((s) => (s?.id === id ? null : s));
  };

  const openStudy = (opts = {}) => {
    // default: study all un-mastered or all
    const list = opts.unmastered ? cards.filter((c) => !c.mastered) : cards;
    setStudyCards(list);
    setStudyOpen(true);
  };

  const filtered = filterFlashcards(cards, search);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You aren't logged in</div>;

  return (
    <div className="flex h-full">
      <FlashcardList
        cards={filtered}
        selectedId={selected?.id}
        onSelect={setSelected}
        onNew={handleNew}
        search={search}
        setSearch={setSearch}
      />

      <div className="flex-1 relative">
        <div className="flex items-center justify-between px-8 py-6 border-b bg-white/50">
          <div className="text-lg font-semibold">Flashcards</div>
          <div className="flex gap-2">
            <button onClick={() => openStudy({ unmastered: true })} className="btn btn-sm">Study Unmastered</button>
            <button onClick={() => openStudy({ unmastered: false })} className="btn btn-sm">Study All</button>
          </div>
        </div>

        <FlashcardEditor card={selected} onDeleted={handleDeleted} />

        {studyOpen && <StudyMode cards={studyCards} onClose={() => setStudyOpen(false)} />}
      </div>
    </div>
  );
}
