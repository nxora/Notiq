import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();

  const pages = [
    { name: "🏷️ Notes", path: "/notes" },
    { name: "🧠 Flashcards", path: "/flashcards" },
    { name: "🎯 Quizzes", path: "/quiz" },
    { name: "⚙️ Settings", path: "/settings" },
  ];
  

  return (
    <div className="w-64 border-r border-gray-200 bg-white h-full flex flex-col">
      
      {/* Workspace Title */}
      <div className="px-5 py-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold tracking-tight">Notiq Workspace</h2>
      </div>

      {/* Navigation */}
      <div className="flex flex-col mt-4 px-3 gap-1">
        {pages.map((page) => (
          <NavLink
            key={page.name}
            to={page.path}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-[15px] font-medium transition
              ${isActive ? "bg-gray-100" : "hover:bg-gray-100"}`
            }
          >
            {page.name}
          </NavLink>
        ))}
      </div>

      {/* User Panel */}
      <div className="mt-auto px-5 py-6 border-t border-gray-200 flex items-center gap-3">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            className="w-10 h-10 rounded-md object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <p className="text-sm font-medium">{user?.email}</p>
          <p className="text-xs text-gray-500">Signed in</p>
        </div>
      </div>

    </div>
  );
}
