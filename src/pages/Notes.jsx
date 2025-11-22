// src/pages/Notes.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { FiPlus, FiSearch, FiTag, FiMoreVertical, FiTrash2, FiDownload, FiUpload, FiArchive, FiStar } from "react-icons/fi";
import {
  createNote,
  subscribeToNotes,
  subscribeToNote,
  updateNote,
  moveToTrash,
  restoreNote,
  hardDeleteNote,
  togglePin,
  archiveNote,
  unarchiveNote,
  exportNoteToMarkdown,
  importNoteFromMarkdown,
  Draft,
  makeDebouncer,
  filterNotes,
} from "../lib/noteService";
import { useAuth } from "../context/AuthContext";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import "../../src/index.css";

export default function Notes() {
  const { user, loading } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [search, setSearch] = useState("");
  const [viewingTrash, setViewingTrash] = useState(false);
  const [viewingArchived, setViewingArchived] = useState(false);
  const noteSubRef = useRef(null);

  /* ---------- Editor ---------- */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: "<p></p>",
    editable: true,
    onUpdate: ({ editor }) => handleContentUpdate(editor.getHTML()),
  });

  /* ---------- Save / Debounced ---------- */
  const saveContent = useCallback(
    async (id, html) => {
      if (!user || !id) return;
      await updateNote(user, id, { content: html });
      // Draft already saved locally by handleContentUpdate
    },
    [user]
  );
  const debouncedSave = useRef(makeDebouncer(saveContent, 650));

  function handleContentUpdate(html) {
    if (!selectedNote) return;
    setSelectedNote((prev) => ({ ...prev, content: html }));
    Draft.save(selectedNote.id, { content: html, title: selectedNote.title || "" });
    debouncedSave.current(selectedNote.id, html);
  }

  /* ---------- Title ---------- */
  const saveTitle = useCallback(async (id, title) => {
    if (!user || !id) return;
    await updateNote(user, id, { title });
  }, [user]);
  const debouncedTitle = useRef(makeDebouncer(saveTitle, 550));
  function handleTitleChange(e) {
    if (!selectedNote) return;
    const title = e.target.value;
    setSelectedNote((p) => ({ ...p, title }));
    Draft.save(selectedNote.id, { ...Draft.load(selectedNote.id), title });
    debouncedTitle.current(selectedNote.id, title);
  }

  /* ---------- Real-time list subscription ---------- */
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotes(user, (list) => {
      setNotes(list);
      // keep selectedNote in sync with incoming list (if deleted/archived)
      setSelectedNote((prev) => {
        if (!prev) return null;
        const updated = list.find((n) => n.id === prev.id);
        return updated || null;
      });
    }, { includeArchived: viewingArchived, includeDeleted: viewingTrash });
    return unsub;
  }, [user, viewingArchived, viewingTrash]);

  /* ---------- Per-note collaborative subscription ---------- */
  useEffect(() => {
    // clean up previous subscription
    if (noteSubRef.current) noteSubRef.current();

    if (!selectedNote) {
      editor?.commands?.setContent("<p></p>");
      return;
    }

    // set initial content from selectedNote or draft
    const cached = Draft.load(selectedNote.id);
    if (cached.content && cached.content !== selectedNote.content) {
      editor.commands.setContent(cached.content);
    } else {
      editor.commands.setContent(selectedNote.content || "<p></p>");
    }

    // subscribe to document for collaborative changes
    const unsub = subscribeToNote(selectedNote.id, (remote) => {
      // remote may be null if deleted
      if (!remote) return;
      // keep UI in sync if remote updatedAt is newer than local
      const localUpdated = selectedNote.updatedAt?.toMillis ? selectedNote.updatedAt.toMillis() : 0;
      const remoteUpdated = remote.updatedAt?.toMillis ? remote.updatedAt.toMillis() : 0;
      // If remote is newer and differs, update local state and editor (but avoid overwriting local edits in progress)
      if (remoteUpdated > localUpdated && remote.content !== selectedNote.content) {
        setSelectedNote(remote);
        // only update editor if user is not typing (simple heuristic: compare drafts)
        const cached = Draft.load(selectedNote.id);
        if (!cached.content || cached.content === selectedNote.content) {
          editor.commands.setContent(remote.content || "<p></p>");
        }
      } else {
        // otherwise, accept other fields like tags/pinned changes
        setSelectedNote(remote);
      }
    });

    noteSubRef.current = unsub;
    return () => {
      if (noteSubRef.current) noteSubRef.current();
      noteSubRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNote?.id, editor]);

  /* ---------- Create / Delete ---------- */
  const handleNewNote = async () => {
    if (!user) return;
    const n = await createNote(user);
    setSelectedNote(n);
  };

  const handleDelete = async (note) => {
    if (!user || !note) return;
    // move to trash (soft delete)
    await moveToTrash(note.id, user);
    Draft.remove(note.id);
    setSelectedNote(null);
  };

  /* ---------- Pin / Archive / Restore / Hard Delete ---------- */
  const handleTogglePin = async (note) => {
    if (!user || !note) return;
    await togglePin(note.id, user, !note.pinned);
  };

  const handleArchive = async (note) => {
    if (!user || !note) return;
    if (note.archived) await unarchiveNote(note.id, user);
    else await archiveNote(note.id, user);
  };

  const handleRestore = async (note) => {
    if (!user || !note) return;
    await restoreNote(note.id, user);
  };

  const handleHardDelete = async (note) => {
    if (!note) return;
    // permanent delete (dangerous)
    if (!confirm("Permanently delete this note? This cannot be undone.")) return;
    await hardDeleteNote(note.id);
    Draft.remove(note.id);
    setSelectedNote(null);
  };

  /* ---------- Export / Import ---------- */

  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleExport = (note) => {
    const md = exportNoteToMarkdown(note);
    downloadFile(`${(note.title || "note").replace(/\s+/g, "_")}.md`, md);
  };

  const fileInputRef = useRef(null);
  const onImportClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    await importNoteFromMarkdown(user, text, { title: f.name.replace(/\.[^/.]+$/, "") });
    e.target.value = "";
  };

  /* ---------- Keyboard Shortcuts (basic) ---------- */
  useEffect(() => {
    function onKey(e) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      // Bold: Ctrl/Cmd+B
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        editor.chain().focus().toggleBold().run();
        return;
      }
      // Italic: Ctrl/Cmd+I
      if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        editor.chain().focus().toggleItalic().run();
        return;
      }
      // Heading: Ctrl/Cmd+Shift+1 -> H1 (detect Shift+1)
      if (e.shiftKey && e.key === "!") {
        // some keyboards produce '!' for Shift+1 — but we'll also accept '1' with shift
        e.preventDefault();
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        return;
      }
      if (e.key === "1" && e.shiftKey) {
        e.preventDefault();
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        return;
      }
      // Bullet list: Ctrl/Cmd+L (example)
      if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        editor.chain().focus().toggleBulletList().run();
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor]);

  /* ---------- Load cached draft when selecting ---------- */
  useEffect(() => {
    if (!selectedNote || !editor) return;
    const cached = Draft.load(selectedNote.id);
    if (cached.content && cached.content !== selectedNote.content) {
      editor.commands.setContent(cached.content);
    }
  }, [selectedNote, editor]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>You aren't logged in</div>;

  const filtered = filterNotes(notes, search);

  return (
    <div className="flex h-full">
      {/* SIDEBAR */}
      <div className="w-80 border-r bg-white/60 backdrop-blur-md flex flex-col">
        <div className="px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-md hover:bg-gray-100" onClick={() => { setViewingArchived(!viewingArchived); }}>
              <FiArchive />
            </button>
            <button className="w-8 h-8 rounded-md hover:bg-gray-100" onClick={() => { setViewingTrash(!viewingTrash); }}>
              <FiTrash2 />
            </button>
            <button className="w-8 h-8 rounded-md hover:bg-gray-100" onClick={() => {}}>
              <FiMoreVertical />
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-2">
            <FiSearch size={16} className="text-gray-600" />
            <input
              placeholder="Search notes or tags..."
              className="bg-transparent text-sm flex-1 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="px-3 pb-3 space-y-2">
          <button
            onClick={handleNewNote}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-md text-sm hover:bg-gray-800"
          >
            <FiPlus size={16} /> New Note
          </button>

          <div className="flex gap-2">
            <button onClick={() => { if (selectedNote) handleExport(selectedNote); }} className="flex-1 py-2 rounded-md border hover:bg-gray-50">
              <FiDownload className="inline mr-2" /> Export
            </button>
            <button onClick={onImportClick} className="flex-1 py-2 rounded-md border hover:bg-gray-50">
              <FiUpload className="inline mr-2" /> Import
            </button>
            <input ref={fileInputRef} type="file" accept=".md,.txt" onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`p-3 rounded-lg cursor-pointer transition-all flex flex-col ${
                selectedNote?.id === note.id ? "bg-gray-900 text-white" : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{note.title || "Untitled"}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleTogglePin(note); }} className="p-1 rounded">
                    <FiStar className={note.pinned ? "text-yellow-400" : ""} />
                  </button>
                </div>
              </div>
              <p className="text-xs opacity-70 line-clamp-1">
                {(note.content || "").replace(/<[^>]+>/g, "").slice(0, 80) || "Empty note"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {(note.tags || []).slice(0, 3).map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-gray-200 rounded">{t}</span>
                ))}
                {note.archived && <span className="text-xs px-2 py-0.5 bg-blue-100 rounded">archived</span>}
                {note.deleted && <span className="text-xs px-2 py-0.5 bg-red-100 rounded">trashed</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 relative pt-8">
        {!selectedNote && (
          <div className="h-full flex items-center justify-center text-gray-400">Select or create a note</div>
        )}

        {selectedNote && (
          <div className="h-full px-12 py-10">
            <div className="flex items-start justify-between gap-4">
              <input
                placeholder="Untitled"
                value={selectedNote.title}
                onChange={handleTitleChange}
                className="text-3xl font-semibold mb-6 w-full outline-none bg-transparent"
              />

              <div className="flex items-center gap-2">
                <button onClick={() => handleTogglePin(selectedNote)} title="Pin/unpin" className="px-2 py-1 rounded hover:bg-gray-100">
                  <FiStar className={selectedNote.pinned ? "text-yellow-400" : ""} />
                </button>
                <button onClick={() => handleArchive(selectedNote)} title="Archive/unarchive" className="px-2 py-1 rounded hover:bg-gray-100">
                  <FiArchive />
                </button>
                {!selectedNote.deleted ? (
                  <button onClick={() => handleDelete(selectedNote)} title="Move to trash" className="px-2 py-1 rounded hover:bg-red-50 text-red-600">
                    <FiTrash2 />
                  </button>
                ) : (
                  <>
                    <button onClick={() => handleRestore(selectedNote)} className="px-2 py-1 rounded hover:bg-gray-100">Restore</button>
                    <button onClick={() => handleHardDelete(selectedNote)} className="px-2 py-1 rounded hover:bg-red-50 text-red-600">Delete forever</button>
                  </>
                )}
              </div>
            </div>

            <div className="absolute top-20 right-10 flex gap-2 shadow-md bg-white/80 backdrop-blur-md border border-gray-200 rounded-lg px-3 py-1">
              <button onClick={() => editor.chain().focus().toggleBold().run()} className="px-2 py-1 text-sm hover:bg-gray-100 rounded">B</button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()} className="px-2 py-1 text-sm hover:bg-gray-100 rounded">I</button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="px-2 py-1 text-sm hover:bg-gray-100 rounded">H1</button>
              <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="px-2 py-1 text-sm hover:bg-gray-100 rounded">•</button>
              <button onClick={() => {
                const tag = prompt("Add tag (single):");
                if (tag) {
                  updateNote(user, selectedNote.id, { tags: Array.from(new Set([...(selectedNote.tags || []), tag])) });
                }
              }} className="px-2 py-1 text-sm hover:bg-gray-100 rounded"><FiTag /></button>
            </div>

            <hr />

            <EditorContent editor={editor} className="tiptap mt-6" />

            <div className="mt-6 text-xs text-gray-500 border-t border-gray-200 pt-4 flex items-center justify-between">
              <div>
                {editor ? editor.getText().split(/\s+/).filter(Boolean).length : 0} words
                {selectedNote.lastEditedBy && (
                  <span className="ml-4"> • last edited by {selectedNote.lastEditedBy.displayName || selectedNote.lastEditedBy.email}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedNote.colorLabel && <span className="px-2 py-1 text-xs rounded" style={{ background: selectedNote.colorLabel }}>{selectedNote.colorLabel}</span>}
                <div className="text-xs text-gray-400">Updated: {selectedNote.updatedAt?.toDate ? selectedNote.updatedAt.toDate().toLocaleString() : "-"}</div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
