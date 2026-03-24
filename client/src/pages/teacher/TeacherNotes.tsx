import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import type { NoteRecord, SubjectRecord, ChapterRecord } from "../../types";

export default function TeacherNotes() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<NoteRecord | null>(null);
  const [editing, setEditing] = useState<NoteRecord | null>(null);
  const [form, setForm] = useState({ chapter_id: "", title: "", content: "", file_url: "" });

  const loadNotes = (subjectId?: string, chapterId?: string) => {
    let qs = "";
    if (chapterId) qs = `?chapter_id=${chapterId}`;
    else if (subjectId) qs = `?subject_id=${subjectId}`;
    apiFetch<NoteRecord[]>(`/api/notes${qs}`).then(setNotes).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([apiFetch<SubjectRecord[]>("/api/subjects"), apiFetch<ChapterRecord[]>("/api/chapters")])
      .then(([s, ch]) => { setSubjects(s); setChapters(ch); })
      .catch(() => {});
    loadNotes();
  }, []);

  useEffect(() => { loadNotes(filterSubject, filterChapter); }, [filterSubject, filterChapter]);

  const filteredChapters = filterSubject ? chapters.filter(c => String(c.subject_id) === filterSubject) : chapters;

  const reset = () => { setForm({ chapter_id: "", title: "", content: "", file_url: "" }); setEditing(null); setShowForm(false); };

  const openEdit = (n: NoteRecord) => { setEditing(n); setForm({ chapter_id: String(n.chapter_id), title: n.title, content: n.content ?? "", file_url: n.file_url ?? "" }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = { ...form, chapter_id: Number(form.chapter_id), created_by: user?.id };
      if (editing) {
        await apiFetch(`/api/notes/${editing.note_id}`, { method: "PUT", body: JSON.stringify(body) });
        addToast("success", "Note Updated", "Note has been updated.");
      } else {
        await apiFetch("/api/notes", { method: "POST", body: JSON.stringify(body) });
        addToast("success", "Note Added", "New note has been created.");
      }
      loadNotes(filterSubject, filterChapter); reset();
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to save note.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this note?")) return;
    try {
      await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
      addToast("success", "Note Deleted", "Note has been removed.");
      loadNotes(filterSubject, filterChapter);
    } catch { addToast("error", "Error", "Failed to delete note."); }
  };

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>Subject Notes</h1> <p>Create and manage chapter-wise notes for students.</p> </div> <button className="button button--primary" onClick={() => { reset(); setShowForm(true); }}>+ Add Note</button> </div>

      <div className="filter-bar card"> <label>Filter by Subject
          <select value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setFilterChapter(""); }}> <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select> </label> <label>Filter by Chapter
          <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)} disabled={!filterSubject}> <option value="">All Chapters</option>
            {filteredChapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>Ch.{c.chapter_number}: {c.chapter_title}</option>)}
          </select> </label> </div>

      {showForm && (
        <div className="modal-overlay" onClick={reset}> <div className="modal modal--lg" onClick={e => e.stopPropagation()}> <div className="modal__header"> <h3>{editing ? "Edit Note" : "Add New Note"}</h3> <button className="modal__close" onClick={reset}>✕</button> </div> <form className="form" onSubmit={handleSubmit}> <label>Chapter *
                <select value={form.chapter_id} onChange={e => setForm(f => ({...f, chapter_id: e.target.value}))} required> <option value="">-- Select Chapter --</option>
                  {chapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>[{c.subject_name}] Ch.{c.chapter_number}: {c.chapter_title}</option>)}
                </select> </label> <label>Title *
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="Note title" /> </label> <label>Content
                <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="Write the note content here..." rows={8} /> </label> <label>File / Reference URL
                <input value={form.file_url} onChange={e => setForm(f => ({...f, file_url: e.target.value}))} placeholder="https://drive.google.com/..." /> </label> <div className="form-actions"> <button type="button" className="button button--secondary" onClick={reset}>Cancel</button> <button type="submit" className="button button--primary">{editing ? "Update" : "Save"} Note</button> </div> </form> </div> </div>
      )}

      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}> <div className="modal modal--lg" onClick={e => e.stopPropagation()}> <div className="modal__header"> <div> <h3>{viewing.title}</h3> <small>{viewing.subject_name} • {viewing.chapter_title}</small> </div> <button className="modal__close" onClick={() => setViewing(null)}>✕</button> </div> <div className="note-viewer">
              {viewing.content ? <pre className="note-content">{viewing.content}</pre> : <p className="muted">No content written.</p>}
              {viewing.file_url && (
                <div className="note-file"> <span>📎 Attachment:</span> <a href={viewing.file_url} target="_blank" rel="noopener noreferrer" className="link">{viewing.file_url}</a> </div>
              )}
            </div> </div> </div>
      )}

      {loading ? (
        <div className="card"><p>Loading notes...</p></div>
      ) : notes.length === 0 ? (
        <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No notes yet</h3> <p>Add chapter-wise notes for your students</p> </div>
      ) : (
        <div className="notes-grid">
          {notes.map(n => (
            <div key={n.note_id} className="note-card"> <div className="note-card__header"> <div> <span className="badge badge--blue">{n.subject_name}</span>
                  {n.chapter_title && <span className="badge badge--purple" style={{ marginLeft: 6 }}>{n.chapter_title}</span>}
                </div> <span className="note-card__date">{new Date(n.created_at).toLocaleDateString()}</span> </div> <h4 className="note-card__title">{n.title}</h4>
              {n.content && <p className="note-card__preview">{n.content.slice(0, 120)}{n.content.length > 120 ? "..." : ""}</p>}
              {n.file_url && <p className="note-card__file">📎 <a href={n.file_url} target="_blank" rel="noopener noreferrer">Attachment</a></p>}
              <div className="note-card__actions"> <button className="button button--secondary button--sm" onClick={() => setViewing(n)}>View</button> <button className="button button--secondary button--sm" onClick={() => openEdit(n)}>Edit</button> <button className="button button--danger button--sm" onClick={() => handleDelete(n.note_id)}>Delete</button> </div> </div>
          ))}
        </div>
      )}
    </div>
  );
}


