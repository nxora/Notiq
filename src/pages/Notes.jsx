// src/pages/Notes.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { FiPlus, FiSearch, FiTag, FiMoreVertical } from "react-icons/fi";
import { createNote, subscribeToNotes, updateNote, deleteNote } from "../lib/noteService";
import { useAuth } from "../context/AuthContext";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { db } from "../firebase/firebaseConfig";

 
/* Native debounce (no dependency) */
function debounce(fn, wait = 500) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export default function Notes() {
  const { user, loading } = useAuth();
  const [selectedNote, setSelectedNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const editorRef = useRef(null);

  // TipTap editor instance
 const editor = useEditor(
  {
    extensions: [StarterKit],
    content: selectedNote?.content || "<p></p>",
    onUpdate: ({ editor }) => {
      handleEditorUpdate(editor.getHTML());
    },
    editable: !!selectedNote,
  },
  [selectedNote?.id]  // <-- this forces Tiptap to reinitialize when a note changes
);


  // Keep a stable debounced save function
  const debouncedSaveRef = useRef();
  useEffect(() => {
    debouncedSaveRef.current = debounce(async (noteId, payload) => {
      try {
        if (!user || !noteId) return;
        await updateNote(user, noteId, payload);
        // also store last saved snapshot locally for offline recovery
        const cacheKey = `note_draft_${noteId}`;
        localStorage.setItem(cacheKey, JSON.stringify({ ...payload, savedAt: Date.now() }));
      } catch (err) {
        console.warn("Failed to save note (debounced):", err);
      }
    }, 650); // ~650ms debounce
  }, [user]);

  // subscribe to notes in realtime
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotes(user, (list) => {
      setNotes(list);
      // if we have a selectedNote id, update selectedNote from incoming list
      setSelectedNote((prev) => {
        if (!prev) return prev;
        const updated = list.find((n) => n.id === prev.id);
        if (updated) return updated;
        return prev;
      });
    });
    return () => unsub();
  }, [user]);

  // load drafts from localStorage when selecting a note
  useEffect(() => {
    if (!selectedNote) {
      editor?.commands?.clearContent();
      return;
    }

    // apply content into editor (do not trigger onUpdate save)
    if (editor && selectedNote.content) {
      editor.commands.setContent(selectedNote.content);
    }

    // try to apply cached draft if present and newer
    try {
      const cacheKey = `note_draft_${selectedNote.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // if cached content exists and differs, we keep it in editor (optimistic)
        if (parsed && parsed.content && parsed.content !== selectedNote.content) {
          editor.commands.setContent(parsed.content);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [selectedNote, editor]);

  // editor update handler (uses debounced save)
  const handleEditorUpdate = useCallback(
    (html) => {
      if (!selectedNote) return;
      // update local UI immediately (optimistic)
      setSelectedNote((prev) => ({ ...prev, content: html }));

      // store unsaved draft locally immediately
      try {
        const cacheKey = `note_draft_${selectedNote.id}`;
        localStorage.setItem(cacheKey, JSON.stringify({ content: html, title: selectedNote.title || "" }));
      } catch (e) {}

      // call debounced save
      if (debouncedSaveRef.current) debouncedSaveRef.current(selectedNote.id, { content: html });
    },
    [selectedNote]
  );

  // title change handler - debounced save
  const debouncedSaveTitleRef = useRef();
  useEffect(() => {
    debouncedSaveTitleRef.current = debounce(async (noteId, title) => {
      try {
        if (!user || !noteId) return;
        await updateNote(user, noteId, { title });
      } catch (err) {
        console.warn("Failed to save title:", err);
      }
    }, 550);
  }, [user]);

  const handleTitleChange = (e) => {
    if (!selectedNote) return;
    const title = e.target.value;
    setSelectedNote((prev) => ({ ...prev, title }));
    try {
      const cacheKey = `note_draft_${selectedNote.id}`;
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "{}");
      localStorage.setItem(cacheKey, JSON.stringify({ ...cached, title }));
    } catch (e) {}

    if (debouncedSaveTitleRef.current) debouncedSaveTitleRef.current(selectedNote.id, title);
  };

  const handleNewNote = async () => {
    if (!user) return alert("Not authenticated!");
    const newNote = await createNote(user);
    // select immediately; content will be filled in via subscription
    setSelectedNote(newNote);
  };

  const handleDeleteNote = async (noteId) => {
    if (!user) return;
    // soft delete by default
    await deleteNote(user, noteId, true);
    // remove draft from localStorage
    try {
      localStorage.removeItem(`note_draft_${noteId}`);
    } catch (e) {}
    setSelectedNote(null);
  };

  // simple search/filter
  const filteredNotes = notes.filter((n) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const title = (n.title || "").toLowerCase();
    const content = (n.content || "").replace(/<[^>]+>/g, "").toLowerCase();
    return title.includes(s) || content.includes(s);
  });

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You aren't logged in</div>;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 bg-white/60 backdrop-blur-md flex flex-col">
        <div className="px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition">
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

        <button onClick={handleNewNote} className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-md text-sm hover:bg-gray-800 transition">
          <FiPlus size={16} /> New Note
        </button>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${selectedNote?.id === note.id ? "bg-gray-900 text-white shadow-sm" : "hover:bg-gray-100"}`}
            >
              <h3 className="text-sm font-medium">{note.title || "Untitled"}</h3>
              <p className="text-xs opacity-70 line-clamp-1">{(note.content || "").replace(/<[^>]+>/g, "").slice(0, 80) || "Empty note"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {!selectedNote && (
          <div className="h-full flex items-center justify-center text-gray-400">Select or create a note</div>
        )}

        {selectedNote && (
          <div className="h-full px-12 py-10">
            <input
              placeholder="Untitled"
              value={selectedNote.title}
              onChange={handleTitleChange}
              className="text-3xl font-semibold mb-6 w-full outline-none bg-transparent text-gray-900"
            />

            <div className="absolute top-4 right-10 flex gap-2 shadow-md bg-white/80 backdrop-blur-md border border-gray-200 rounded-lg px-3 py-1">
              {/* You can wire these to editor commands if you want */}
              <button className="px-2 py-1 text-sm hover:bg-gray-100 rounded">B</button>
              <button className="px-2 py-1 text-sm hover:bg-gray-100 rounded">I</button>
              <button className="px-2 py-1 text-sm hover:bg-gray-100 rounded">H1</button>
              <button className="px-2 py-1 text-sm hover:bg-gray-100 rounded">•</button>
              <button className="px-2 py-1 text-sm hover:bg-gray-100 rounded"><FiTag size={14} /></button>
              <button onClick={() => handleDeleteNote(selectedNote.id)} className="px-2 py-1 text-sm hover:bg-red-100 text-red-600 rounded">Del</button>
            </div>

            <div className="prose max-w-none">
              <EditorContent editor={editor} />
            </div>

            <div className="mt-6 text-xs text-gray-500 border-t border-gray-200 pt-4">
              Last edited just now • {editor ? editor.getText().split(/\s+/).filter(Boolean).length : 0} words
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
