import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function DashboardWelcome() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
<motion.h1
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className="text-4xl font-bold tracking-tight"
>
  Welcome back, {user?.displayName || user?.email?.split("@")[0]} 👋
</motion.h1>


      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-600 text-lg max-w-xl"
      >
        Here’s a quick overview of your workspace. You can jump into notes, revise flashcards, or start a quiz.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {["Notes", "Flashcards", "Quizzes"].map((card, i) => (
          <motion.div
            key={card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.2 }}
            className="p-6 bg-white rounded-xl border shadow-sm hover:shadow-md hover:scale-[1.01] transition"
          >
            <h3 className="text-xl font-semibold mb-2">{card}</h3>
            <p className="text-gray-600">Open your {card.toLowerCase()} to continue where you left off.</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
