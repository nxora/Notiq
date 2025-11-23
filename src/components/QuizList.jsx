import React from "react";
import { FiPlus, FiSearch } from "react-icons/fi";

export default function QuizList({ quizzes, selectedId, onSelect, onNew, search, setSearch }) {
  return (
    <div className="w-72 md:w-80 border-r bg-white/60 backdrop-blur-md flex flex-col">
      <div className="px-4 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Quizzes</h2>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-2">
          <FiSearch size={16} className="text-gray-600" />
          <input
            placeholder="Search quizzes..."
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
        <FiPlus size={16} /> New Quiz
      </button>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            onClick={() => onSelect(quiz)}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              selectedId === quiz.id ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
            }`}
          >
            <div className="text-sm font-medium">{quiz.title}</div>
            <div className="text-xs opacity-70 line-clamp-2">{quiz.questions?.length || 0} questions</div>
          </div>
        ))}
      </div>
    </div>
  );
}
