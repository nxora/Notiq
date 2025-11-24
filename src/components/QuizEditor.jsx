import React, { useEffect, useState, useRef } from "react";
import { Draft, makeDebouncer, updateQuiz, deleteQuiz } from "../lib/quizService";
import { useAuth } from "../context/AuthContext";

export default function QuizEditor({ quiz, onDeleted, onUpdated }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(quiz?.title || "");
  const [questions, setQuestions] = useState(quiz?.questions || []);

  const debouncedSave = useRef(makeDebouncer(async (id, data) => {
    if (!user || !id) return;
    await updateQuiz(user, id, data);
  }, 650));

  useEffect(() => {
    setTitle(quiz?.title || "");
    setQuestions(quiz?.questions || []);
  }, [quiz?.id]);

  const save = () => {
    if (!quiz) return;
    const data = { title, questions };
    Draft.save(quiz.id, data);
    debouncedSave.current(quiz.id, data);
    onUpdated?.(data);
  };

  const handleDelete = async () => {
    if (!quiz || !user) return;
    await deleteQuiz(user, quiz.id, true);
    Draft.remove(quiz.id);
    onDeleted?.(quiz.id);
  };

  const updateQuestion = (idx, field, value) => {
    const q = [...questions];
    q[idx] = { ...q[idx], [field]: value };
    setQuestions(q);
    save();
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { question: "", options: ["", "", "", ""], answer: "" }]);
  };

  const removeQuestion = (idx) => {
    const q = [...questions];
    q.splice(idx, 1);
    setQuestions(q);
    save();
  };

  if (!quiz) return <div className="h-full flex items-center justify-center text-gray-400">Select or create a quiz</div>;

  return (
    <div className="flex-1 px-8 py-8 max-w-3xl">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quiz Title"
        className="text-2xl font-bold mb-4 w-full outline-none bg-transparent"
      />

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={idx} className="border rounded-md p-4">
            <input
              value={q.question}
              onChange={(e) => updateQuestion(idx, "question", e.target.value)}
              placeholder={`Question ${idx + 1}`}
              className="w-full mb-2 p-2 border rounded"
            />
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...q.options];
                    opts[i] = e.target.value;
                    updateQuestion(idx, "options", opts);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="p-2 border rounded"
                />
              ))}
            </div>
            <input
              value={q.answer}
              onChange={(e) => updateQuestion(idx, "answer", e.target.value)}
              placeholder="Correct answer"
              className="mt-2 w-full p-2 border rounded"
            />
            <button onClick={() => removeQuestion(idx)} className="mt-2 text-red-600 text-sm hover:underline">Remove Question</button>
          </div>
        ))}
      </div>

      <button onClick={addQuestion} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500">Add Question</button>

      <div className="mt-6 flex gap-2">
        <button onClick={save} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500">Save</button>
        <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500">Delete Quiz</button>
      </div>
    </div>
  );
}
