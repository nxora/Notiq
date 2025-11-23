// src/components/FlashcardList.jsx
import React from "react";
import { FiPlus, FiSearch } from "react-icons/fi";

export default function FlashcardList({
  cards = [],
  selectedId,
  onSelect,
  onNew,
  search,
  setSearch,
}) {
  return (
    <div className="w-72 md:w-80 border-r bg-white/60 backdrop-blur-md flex flex-col">
      <div className="px-4 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Flashcards</h2>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-2">
          <FiSearch size={16} className="text-gray-600" />
          <input
            placeholder="Search flashcards..."
            className="bg-transparent text-sm flex-1 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={onNew}
        className="w-full flex items-center justify-center gap-2 bg-indigo-700 text-white py-2.5 rounded-md text-sm hover:bg-indigo-600 transition"
      >
        <FiPlus size={16} /> New Flashcard
      </button>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => onSelect(card)}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              selectedId === card.id ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
            }`}
          >
            <div className="text-sm font-medium">{card.front || "Untitled"}</div>
            <div className="text-xs opacity-70 line-clamp-2">{(card.back || "").slice(0, 70)}</div>
            <div className="mt-2 text-[11px] text-gray-500">{card.tags?.join(", ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
