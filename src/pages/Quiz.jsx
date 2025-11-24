import React, { useEffect, useState } from "react";
import QuizList from "../components/QuizList";
import QuizEditor from "../components/QuizEditor";
import StudyQuiz from "../components/StudyQuiz";
import { useAuth } from "../context/AuthContext";
import {  
  generateQuizFromNoteContent, 
} from "../firebase/quiz";
import {
  createQuiz,
  subscribeToQuizzes, 
  filterQuizzes,
} from "../lib/quizService";

export default function Quiz({ noteContent }) {
  const { user, loading } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [studyOpen, setStudyOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToQuizzes(user, setQuizzes);
    return () => unsub && unsub();
  }, [user]);

  const handleNew = async () => {
    if (!user) return;
    const questions = noteContent ? generateQuizFromNoteContent(noteContent) : [];
    const quiz = await createQuiz(user, "Untitled Quiz", questions);
    setSelected(quiz);
  };

  const handleDeleted = (id) => {
    setSelected((s) => (s?.id === id ? null : s));
  };

  const openStudy = () => {
    if (!selected) return;
    setStudyOpen(true);
  };

  const filtered = filterQuizzes(quizzes, search);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You aren't logged in</div>;

  return (
    <div className="flex h-full">
      <QuizList
        quizzes={filtered}
        selectedId={selected?.id}
        onSelect={setSelected}
        onNew={handleNew}
        search={search}
        setSearch={setSearch}
      />
      <div className="flex-1 relative">
        <div className="flex justify-between px-8 py-6 border-b bg-white/50">
          <div className="text-lg font-semibold">Quizzes</div>
          <button onClick={openStudy} className="btn btn-sm">Take Quiz</button>
        </div>
        <QuizEditor quiz={selected} onDeleted={handleDeleted} />
        {studyOpen && selected && <StudyQuiz quiz={selected} onClose={() => setStudyOpen(false)} />}
      </div>
    </div>
  );
}
