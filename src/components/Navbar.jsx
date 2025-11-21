import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <div className="w-full h-14 bg-white/70 backdrop-blur-md border-b border-gray-200 
      flex items-center justify-between px-6 sticky top-0 z-50">

      <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
        Dashboard
      </h1>

      <div className="flex items-center gap-4">
        <div className="px-3 py-1.5 rounded-lg text-sm text-gray-700 border border-gray-200 bg-white/50">
          Level 1 · XP 0
        </div>

        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="Profile"
            className="w-9 h-9 rounded-lg object-cover border border-gray-300"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center 
            text-gray-700 font-semibold border border-gray-300">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
