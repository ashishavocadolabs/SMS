import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { useToast } from "../../contexts/ToastContext";
import type { ChapterRecord, SubjectRecord } from "../../types";

export default function TeacherChapters() {
  const { addToast } = useToast();
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ChapterRecord | null>(null);
  const [form, setForm] = useState({ subject_id: "", chapter_number: "1", chapter_title: "", description: "" });

  const load = () => {
    const qs = filterSubject ? `?subject_id=${filterSubject}` : "";
    Promise.all([
      apiFetch<ChapterRecord[]>(`/api/chapters${qs}`),
      apiFetch<SubjectRecord[]>("/api/subjects"),
    ]).then(([ch, s]) => { setChapters(ch); setSubjects(s); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterSubject]);

  const reset = () => { setForm({ subject_id: "", chapter_number: "1", chapter_title: "", description: "" }); setEditing(null); setShowForm(false); };

  const openEdit = (c: ChapterRecord) => {
    setEditing(c);
    setForm({ subject_id: String(c.subject_id), chapter_number: String(c.chapter_number), chapter_title: c.chapter_title, description: c.description ?? "" });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = { ...form, subject_id: Number(form.subject_id), chapter_number: Number(form.chapter_number) };
      if (editing) {
        await apiFetch(`/api/chapters/${editing.chapter_id}`, { method: "PUT", body: JSON.stringify(body) });
        addToast("success", "Chapter Updated", "Chapter has been updated.");
      } else {
        await apiFetch("/api/chapters", { method: "POST", body: JSON.stringify(body) });
        addToast("success", "Chapter Added", "New chapter has been created.");
      }
      load(); reset();
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to save chapter.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this chapter? All notes and videos under it will be removed.")) return;
    try {
      await apiFetch(`/api/chapters/${id}`, { method: "DELETE" });
      addToast("success", "Chapter Deleted", "Chapter and related data removed.");
      load();
    } catch { addToast("error", "Error", "Failed to delete chapter."); }
  };

  // Group by subject
  const grouped = chapters.reduce<Record<string, ChapterRecord[]>>((acc, c) => {
    const key = c.subject_name ?? String(c.subject_id);
    (acc[key] = acc[key] || []).push(c);
    return acc;
  }, {});

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>Chapters</h1> <p>Manage subject chapters used for notes, videos, and MCQ tests.</p> </div> <button className="button button--primary" onClick={() => { reset(); setShowForm(true); }}>+ Add Chapter</button> </div>

      <div className="filter-bar card"> <label>Filter by Subject
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}> <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select> </label> </div>

      {showForm && (
        <div className="modal-overlay" onClick={reset}> <div className="modal" onClick={e => e.stopPropagation()}> <div className="modal__header"> <h3>{editing ? "Edit Chapter" : "Add Chapter"}</h3> <button className="modal__close" onClick={reset}>✕</button> </div> <form className="form" onSubmit={handleSubmit}> <label>Subject *
                <select value={form.subject_id} onChange={e => setForm(f => ({...f, subject_id: e.target.value}))} required> <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                </select> </label> <div className="form-row"> <label>Chapter Number *
                  <input type="number" value={form.chapter_number} onChange={e => setForm(f => ({...f, chapter_number: e.target.value}))} required min="1" /> </label> </div> <label>Chapter Title *
                <input value={form.chapter_title} onChange={e => setForm(f => ({...f, chapter_title: e.target.value}))} required placeholder="e.g. Introduction to Algebra" /> </label> <label>Description
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief overview of this chapter" rows={3} /> </label> <div className="form-actions"> <button type="button" className="button button--secondary" onClick={reset}>Cancel</button> <button type="submit" className="button button--primary">{editing ? "Update" : "Add"} Chapter</button> </div> </form> </div> </div>
      )}

      {loading ? (
        <div className="card"><p>Loading chapters...</p></div>
      ) : chapters.length === 0 ? (
        <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No chapters yet</h3> <p>Add chapters to organize notes, videos and tests</p> <button className="button button--primary" onClick={() => { reset(); setShowForm(true); }}>+ Add Chapter</button> </div>
      ) : (
        <div>
          {Object.entries(grouped).map(([subjectName, chs]) => (
            <div key={subjectName} className="chapter-section"> <h3 className="chapter-section__title">{subjectName}</h3> <div className="chapter-list">
                {chs.sort((a,b) => a.chapter_number - b.chapter_number).map(c => (
                  <div key={c.chapter_id} className="chapter-item"> <div className="chapter-item__num">Ch.{c.chapter_number}</div> <div className="chapter-item__body"> <h4>{c.chapter_title}</h4>
                      {c.description && <p>{c.description}</p>}
                    </div> <div className="chapter-item__actions"> <button className="button button--secondary button--sm" onClick={() => openEdit(c)}>Edit</button> <button className="button button--danger button--sm" onClick={() => handleDelete(c.chapter_id)}>Delete</button> </div> </div>
                ))}
              </div> </div>
          ))}
        </div>
      )}
    </div>
  );
}


