import React from 'react'

function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-gray-800 p-6 bg-gray-300">
      <h1 className="text-5xl font-extrabold mb-4">Welcome to Lumino</h1>
      <p className="mb-8 text-lg text-center max-w-md">
        Collaborate, Quiz, and Learn smarter. Create notes, flashcards, and track your learning streaks.
      </p>

      <div className="flex flex-col md:flex-row justify-center gap-6 mt-16 px-4">
        <div className="card bg-slate-500 shadow-md p-6 w-64 text-center border border-gray-200 hover:bg-slate-400 hover:scale-105 transition-transform duration-300">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="font-bold mb-2 text-gray-900">Notes</h3>
          <p className="text-gray-700">Create and share notes with your study group.</p>
        </div>

        <div className="card bg-slate-500 shadow-md p-6 w-64 text-center border border-gray-200 hover:bg-slate-400 hover:scale-105 transition-transform duration-300">
          <div className="text-4xl mb-4">🎴</div>
          <h3 className="font-bold mb-2 text-gray-900">Flashcards</h3>
          <p className="text-gray-700">Learn faster with custom flashcards and quizzes.</p>
        </div>

        <div className="card bg-slate-500 shadow-md p-6 w-64 text-center border border-gray-200 hover:bg-slate-400 hover:scale-105 transition-transform duration-300">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="font-bold mb-2 text-gray-900">Achievements</h3>
          <p className="text-gray-700">Earn badges, streaks, and track your progress.</p>
        </div>
      </div>

      <a 
        href="/register" 
        className="btn btn-lg bg-slate-600 text-white shadow-md hover:bg-slate-800 hover:scale-105 transform transition-all duration-300 mt-20"
      >
        Get Started
      </a>
    </div>
  )
}

export default Home
