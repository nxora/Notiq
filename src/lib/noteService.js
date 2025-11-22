// src/lib/noteService.js
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from "firebase/firestore";

/*
  New design:
  - Top-level "notes" collection (collaborative friendly)
  - Each note has participants: [uid1, uid2, ...]
  - Each note contains lastEditedBy, tags, pinned, archived, colorLabel, deleted
  - Use serverTimestamp() for updatedAt/createdAt
*/

const notesCol = () => collection(db, "notes");

function noteDocRef(noteId) {
  return doc(db, "notes", noteId);
}

/* ---------- Create / Import / Export ---------- */

export async function createNote(user, opts = {}) {
  // opts: { title, content, tags, participants, pinned, colorLabel, archived }
  const participants = opts.participants || [user.uid];
  const payload = {
    title: opts.title || "",
    content: opts.content || "<p></p>",
    tags: opts.tags || [],
    participants,
    pinned: !!opts.pinned,
    archived: !!opts.archived,
    colorLabel: opts.colorLabel || null,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastEditedBy: {
      uid: user.uid,
      displayName: user.displayName || null,
      email: user.email || null,
    },
  };

  const ref = await addDoc(notesCol(), payload);
  return { id: ref.id, ...payload };
}

export async function importNoteFromMarkdown(user, markdown, meta = {}) {
  // Very simple MD -> note import. You can extend to parse frontmatter.
  const content = `<pre>${markdown.replace(/\</g, "&lt;")}</pre>`;
  const title = meta.title || (markdown.split("\n")[0] || "Imported note").slice(0, 120);
  return createNote(user, { title, content, tags: meta.tags || [] });
}

export function exportNoteToMarkdown(note) {
  // Convert basic HTML content to plain-ish markdown-ish text
  // You can improve this with a HTML -> Markdown library later.
  const title = note.title || "";
  // crude HTML strip for content; keep newlines for paragraphs
  const text = (note.content || "")
    .replace(/<\/p>\s*<p>/g, "\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();
  const md = `# ${title}\n\n${text}\n`;
  return md;
}

/* ---------- Subscriptions (list + per-document) ---------- */

export function subscribeToNotes(user, onUpdate, opts = { includeArchived: false, includeDeleted: false }) {
  // Returns unsubscribe function
  // Query: notes where participants array contains user.uid
  let q = query(
    notesCol(),
    where("participants", "array-contains", user.uid),
    orderBy("pinned", "desc"), // pinned first
    // Note: Firestore requires indexes for some compound queries — create index if prompted
  );

  // We'll listen to the entire set and filter client-side for archived/deleted if necessary.
  const unsub = onSnapshot(
    q,
    (snap) => {
      let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // serverTimestamp ordering only works when field exists; ensure fallback
      docs.sort((a, b) => {
        // pinned already ordered; next by updatedAt desc
        const at = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const bt = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return bt - at;
      });

      if (!opts.includeDeleted) docs = docs.filter((d) => !d.deleted);
      if (!opts.includeArchived) docs = docs.filter((d) => !d.archived);

      onUpdate(docs);
    },
    (err) => {
      console.warn("subscribeToNotes error:", err);
      onUpdate([]);
    }
  );

  return unsub;
}

export function subscribeToNote(noteId, onUpdate) {
  const ref = noteDocRef(noteId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate({ id: snap.id, ...snap.data() });
      }
    },
    (err) => {
      console.warn("subscribeToNote error:", err);
      onUpdate(null);
    }
  );
}

/* ---------- Read / Update / Delete / Trash ---------- */

export async function getNoteOnce(noteId) {
  const snap = await getDoc(noteDocRef(noteId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateNote(user, noteId, data = {}, options = { merge: true }) {
  // automatically stamp lastEditedBy and updatedAt
  const ref = noteDocRef(noteId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    lastEditedBy: {
      uid: user.uid,
      displayName: user.displayName || null,
      email: user.email || null,
    },
  };
  // merge by default
  return updateDoc(ref, payload);
}

export async function addParticipant(noteId, uid) {
  const ref = noteDocRef(noteId);
  return updateDoc(ref, { participants: arrayUnion(uid) });
}

export async function removeParticipant(noteId, uid) {
  const ref = noteDocRef(noteId);
  return updateDoc(ref, { participants: arrayRemove(uid) });
}

export async function moveToTrash(noteId, user) {
  return updateNote(user, noteId, { deleted: true });
}

export async function restoreNote(noteId, user) {
  return updateNote(user, noteId, { deleted: false });
}

export async function archiveNote(noteId, user) {
  return updateNote(user, noteId, { archived: true });
}

export async function unarchiveNote(noteId, user) {
  return updateNote(user, noteId, { archived: false });
}

export async function togglePin(noteId, user, pinned) {
  return updateNote(user, noteId, { pinned: !!pinned });
}

export async function hardDeleteNote(noteId) {
  return deleteDoc(noteDocRef(noteId));
}

/* ---------- Utilities: Draft + Debounce + Search ---------- */

export const Draft = {
  key(id) {
    return `note_draft_${id}`;
  },

  save(id, data) {
    try {
      localStorage.setItem(this.key(id), JSON.stringify(data));
    } catch {}
  },

  load(id) {
    try {
      return JSON.parse(localStorage.getItem(this.key(id)) || "{}");
    } catch {
      return {};
    }
  },

  remove(id) {
    try {
      localStorage.removeItem(this.key(id));
    } catch {}
  },
};

export function makeDebouncer(fn, delay = 600) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export function stripHtml(html = "") {
  return html.replace(/<[^>]+>/g, "");
}

export function filterNotes(notes, queryString) {
  if (!queryString) return notes;
  const s = queryString.toLowerCase();
  return notes.filter((note) => {
    const title = (note.title || "").toLowerCase();
    const text = stripHtml(note.content || "").toLowerCase();
    const tags = (note.tags || []).join(" ").toLowerCase();
    return title.includes(s) || text.includes(s) || tags.includes(s);
  });
}
