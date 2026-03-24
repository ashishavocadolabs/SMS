import { useEffect, useState } from "react";
import { apiFetch, buildQuery } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import type { LectureRecord, SubjectRecord, ChapterRecord } from "../../types";

export default function TeacherLectures() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [lectures, setLectures] = useState<LectureRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LectureRecord | null>(null);
  const [form, setForm] = useState({ subject_id: "", chapter_id: "", lecture_date: new Date().toISOString().slice(0,10), title: "", topics_covered: "", description: "" });


  const load = () => {
    const q = buildQuery({ teacher_id: user?.id });
    Promise.all([
      apiFetch<LectureRecord[]>(`/api/lectures${q}`),
      apiFetch<SubjectRecord[]>("/api/subjects"),
    ]).then(([l, s]) => { setLectures(l); setSubjects(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!form.subject_id) { setChapters([]); return; }
    apiFetch<ChapterRecord[]>(`/api/chapters?subject_id=${form.subject_id}`)
      .then(setChapters).catch(() => {});
  }, [form.subject_id]);

  const reset = () => { setForm({ subject_id: "", chapter_id: "", lecture_date: new Date().toISOString().slice(0,10), title: "", topics_covered: "", description: "" }); setEditing(null); setShowForm(false); };

  const openEdit = (l: LectureRecord) => {
    setEditing(l);
    setForm({ subject_id: String(l.subject_id), chapter_id: String(l.chapter_id ?? ""), lecture_date: l.lecture_date.slice(0,10), title: l.title, topics_covered: l.topics_covered ?? "", description: l.description ?? "" });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = { ...form, teacher_id: user?.id, subject_id: Number(form.subject_id), chapter_id: form.chapter_id ? Number(form.chapter_id) : null };
      if (editing) {
        await apiFetch(`/api/lectures/${editing.lecture_id}`, { method: "PUT", body: JSON.stringify(body) });
        addToast("success", "Lecture Updated", "Lecture has been updated.");
      } else {
        await apiFetch("/api/lectures", { method: "POST", body: JSON.stringify(body) });
        addToast("success", "Lecture Logged", "New lecture has been recorded.");
      }
      load(); reset();
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to save lecture.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this lecture record?")) return;
    try {
      await apiFetch(`/api/lectures/${id}`, { method: "DELETE" });
      addToast("success", "Lecture Deleted", "Lecture record removed.");
      load();
    } catch { addToast("error", "Error", "Failed to delete lecture."); }
  };

  // Group lectures by date
  const grouped = lectures.reduce<Record<string, LectureRecord[]>>((acc, l) => {
    const date = l.lecture_date.slice(0,10);
    (acc[date] = acc[date] || []).push(l);
    return acc;
  }, {});

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>Daily Lectures</h1> <p>Track topics covered in each lecture session.</p> </div> <button className="button button--primary" onClick={() => { reset(); setShowForm(true); }}>+ Log Lecture</button> </div>

      {showForm && (
        <div className="modal-overlay" onClick={reset}> <div className="modal" onClick={e => e.stopPropagation()}> <div className="modal__header"> <h3>{editing ? "Edit Lecture" : "Log New Lecture"}</h3> <button className="modal__close" onClick={reset}>✕</button> </div> <form className="form" onSubmit={handleSubmit}> <div className="form-row"> <label>Subject *
                  <select value={form.subject_id} onChange={e => setForm(f => ({...f, subject_id: e.target.value, chapter_id: ""}))} required> <option value="">-- Select Subject --</option>
                    {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                  </select> </label> <label>Date *
                  <input type="date" value={form.lecture_date} onChange={e => setForm(f => ({...f, lecture_date: e.target.value}))} required /> </label> </div> <label>Chapter
                <select value={form.chapter_id} onChange={e => setForm(f => ({...f, chapter_id: e.target.value}))} disabled={!form.subject_id}> <option value="">-- Select Chapter --</option>
                  {chapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>Ch.{c.chapter_number}: {c.chapter_title}</option>)}
                </select> </label> <label>Lecture Title *
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="e.g. Introduction to Algebra" /> </label> <label>Topics Covered
                <textarea value={form.topics_covered} onChange={e => setForm(f => ({...f, topics_covered: e.target.value}))} placeholder="List the topics covered in this lecture..." rows={3} /> </label> <label>Additional Notes
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Any notes or remarks..." rows={2} /> </label> <div className="form-actions"> <button type="button" className="button button--secondary" onClick={reset}>Cancel</button> <button type="submit" className="button button--primary">{editing ? "Update" : "Log"} Lecture</button> </div> </form> </div> </div>
      )}

      {loading ? (
        <div className="card"><p>Loading lectures...</p></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No lectures logged yet</h3> <p>Start by logging today's lecture</p> <button className="button button--primary" onClick={() => { reset(); setShowForm(true); }}>+ Log First Lecture</button> </div>
      ) : (
        <div className="lecture-timeline">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="lecture-day"> <div className="lecture-day__header"> <span className="lecture-day__date">{new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span> <span className="badge badge--blue">{items.length} lecture{items.length > 1 ? "s" : ""}</span> </div> <div className="lecture-day__items">
                {items.map(l => (
                  <div key={l.lecture_id} className="lecture-item"> <div className="lecture-item__left"> <div className="lecture-item__subject">{l.subject_name}</div> <h4 className="lecture-item__title">{l.title}</h4>
                      {l.chapter_title && <span className="badge badge--purple">Ch: {l.chapter_title}</span>}
                      {l.topics_covered && <p className="lecture-item__topics"><strong>Topics:</strong> {l.topics_covered}</p>}
                    </div> <div className="lecture-item__actions"> <button className="button button--secondary button--sm" onClick={() => openEdit(l)}>Edit</button> <button className="button button--danger button--sm" onClick={() => handleDelete(l.lecture_id)}>Delete</button> </div> </div>
                ))}
              </div> </div>
          ))}
        </div>
      )}
    </div>
  );
}


