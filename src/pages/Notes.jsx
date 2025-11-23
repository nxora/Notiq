// src/pages/Notes.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { FiPlus, FiSearch, FiTag, FiMoreVertical } from "react-icons/fi";
import {
  createNote,
  subscribeToNotes,
  updateNote,
  deleteNote,
  Draft,
  makeDebouncer,
  filterNotes,
} from "../lib/noteService";
import { useAuth } from "../context/AuthContext";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import "../../src/index.css";

export default function Notes() {
  const { user, loading } = useAuth();

  const [selectedNote, setSelectedNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
 
  const editor = useEditor({
    extensions: [StarterKit, Highlight],
    content: "<p></p>",
    editable: true,
    onUpdate: ({ editor }) => handleContentUpdate(editor.getHTML()),
  });
 
  const saveContent = useCallback(
    (id, html) => {
      if (!user || !id) return;
      updateNote(user, id, { content: html });
    },
    [user]
  );

  const debouncedContentSave = useRef(makeDebouncer(saveContent, 650));

  const handleContentUpdate = (html) => {
    if (!selectedNote) return;

    setSelectedNote((prev) => ({ ...prev, content: html }));

    Draft.save(selectedNote.id, {
      content: html,
      title: selectedNote.title || "",
    });

    debouncedContentSave.current(selectedNote.id, html);
  };
 
  const saveTitle = useCallback(
    (id, title) => {
      if (!user || !id) return;
      updateNote(user, id, { title });
    },
    [user]
  );

  const debouncedTitleSave = useRef(makeDebouncer(saveTitle, 550));

  const handleTitleChange = (e) => {
    if (!selectedNote) return;

    const title = e.target.value;
    setSelectedNote((prev) => ({ ...prev, title }));

    Draft.save(selectedNote.id, {
      ...Draft.load(selectedNote.id),
      title,
    });

    debouncedTitleSave.current(selectedNote.id, title);
  }; 

  useEffect(() => {
    if (!user) return;
    return subscribeToNotes(user, (list) => {
      setNotes(list);

      setSelectedNote((prev) => {
        if (!prev) return null;
        return list.find((n) => n.id === prev.id) || null;
      });
    });
  }, [user]);
 
  useEffect(() => {
    if (!selectedNote || !editor) {
      editor?.commands.setContent("<p></p>");
      return;
    }

    editor.commands.setContent(selectedNote.content || "<p></p>");

    const cached = Draft.load(selectedNote.id);
    if (cached.content && cached.content !== selectedNote.content) {
      editor.commands.setContent(cached.content);
    }
  }, [selectedNote, editor]); 
  const handleNewNote = async () => {
    if (!user) return;
    const newNote = await createNote(user);
    setSelectedNote(newNote);
  };

  const handleDeleteNote = async (id) => {
    await deleteNote(user, id, true);
    Draft.remove(id);
    setSelectedNote(null);
  };
 
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You aren't logged in</div>;

  const filtered = filterNotes(notes, search);

  return (
    <div className="flex h-full">

       <div className="w-72 border-r bg-white/60 backdrop-blur-md flex flex-col">
        <div className="px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100">
            <FiMoreVertical size={18} />
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-2">
            <FiSearch size={16} className="text-gray-600" />
            <input
              placeholder="Search notes..."
              className="bg-transparent text-sm flex-1 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleNewNote}
          className="w-10/12 mx-6 flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-md text-sm hover:bg-gray-800"
        >
          <FiPlus size={16} /> New Note
        </button>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedNote?.id === note.id
                  ? "bg-gray-900 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              <h3 className="text-sm font-medium">{note.title || "Untitled"}</h3>
              <p className="text-xs opacity-70 line-clamp-1">
                {note.content?.replace(/<[^>]+>/g, "").slice(0, 80) || "Empty note"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 relative pt-8">
        {!selectedNote && (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select or create a note
          </div>
        )}

        {selectedNote && (
          <div className="h-full px-12 py-10">
            <input
              placeholder="Untitled"
              value={selectedNote.title}
              onChange={handleTitleChange}
              className="text-3xl font-semibold mb-6 w-full outline-none bg-transparent"
            />

            <div className="absolute top-4 right-10 flex gap-2 shadow-md bg-white/80 backdrop-blur-md border border-gray-200 rounded-lg px-3 py-1">
              <button onClick={() => editor.chain().focus().toggleBold().run()} className="px-2 py-1 text-sm hover:bg-gray-100 rounded">B</button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()} className="px-2 py-1 text-sm hover:bg-gray-100 rounded">I</button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="px-2 py-1 text-sm hover:bg-gray-100 rounded">H1</button>
              <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="px-2 py-1 text-sm hover:bg-gray-100 rounded">•</button>
              <button onClick={() => editor.chain().focus().toggleHighlight().run()} className="px-2 py-1 text-sm hover:bg-gray-100 rounded"><FiTag size={14} /></button>
              <button onClick={() => handleDeleteNote(selectedNote.id)} className="px-2 py-1 text-sm hover:bg-red-100 text-red-600 rounded">Del</button>
            </div>
            <hr />

            <EditorContent editor={editor} className="tiptap" />

            <div className="mt-6 text-xs text-gray-500 border-t border-gray-200 pt-4">
              {editor ? editor.getText().split(/\s+/).filter(Boolean).length : 0} words
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
