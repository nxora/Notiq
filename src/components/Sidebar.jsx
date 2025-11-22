import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar() {
  const { profile, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState("pages");

  const sections = [
    {
      key: "workspace",
      name: "Workspace",
      items: [{ name: "🏠 Dashboard", path: "/dashboard" }]
    },
    {
      key: "pages",
      name: "Pages",
      items: [
        { name: "🏷️ Notes", path: "/notes" },
        { name: "🧠 Flashcards", path: "/flashcards" },
        { name: "🎯 Quizzes", path: "/quiz" }
      ]
    },
    {
      key: "tools",
      name: "Tools",
      items: [{ name: "⚙️ Settings", path: "/settings" }]
    }
  ];

  if (loading) return <div> Loading </div>
  return (
    <div
      className={`h-full border-r bg-white transition-all duration-300 flex flex-col ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Collapse Button */}
      <button
        className="absolute top-4 right-[-14px] bg-white border rounded-full p-1 shadow hover:scale-110 transition"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo */}
      <div className="px-5 py-6 border-b">
        {!collapsed && <h2 className="text-xl font-semibold tracking-tight">Notiq</h2>}
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto mt-4">
        {sections.map((section) => (
          <div key={section.key} className="mb-3 px-3">
            {/* Section Header */}
            <button
              onClick={() =>
                setOpenSection(openSection === section.key ? "" : section.key)
              }
              className="flex items-center justify-between w-full text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
            >
              {!collapsed && section.name}
              {!collapsed && (
                <motion.span animate={{ rotate: openSection === section.key ? 90 : 0 }}>
                  ▶
                </motion.span>
              )}
            </button>

            {/* Items */}
            <AnimatePresence>
              {openSection === section.key && !collapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex flex-col gap-1"
                >
                  {section.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-[15px] transition-all ${
                          isActive
                            ? "bg-gray-100 shadow-sm"
                            : "hover:bg-gray-100 hover:shadow"
                        }`
                      }
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* User */}
      <div className="mt-auto px-5 py-6 border-t flex items-center gap-3">
        {!collapsed && profile && (
          <>
            {/* Avatar */}
            <div className="w-12 h-12 bg-gray-100 border rounded-full flex items-center justify-center text-gray-700 overflow-hidden">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold">
                  {profile.displayName
                    ? profile.displayName.charAt(0)
                    : profile.email.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name & Email */}
            <div className="flex flex-col text-sm">
              <p className="font-medium">
                {profile.displayName || profile.email.split("@")[0]}
              </p>
              <p className="text-gray-500 text-xs">{profile.email}</p>
              <p className="text-green-500 text-xs mt-1">Online</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
