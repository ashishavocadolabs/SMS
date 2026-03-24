import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import type { SubjectRecord, TeacherRecord, ClassEntity } from "../../types";

const COLORS = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899","#84cc16"];

export default function TeacherSubjects() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SubjectRecord | null>(null);
  const [form, setForm] = useState({ subject_name: "", subject_code: "", teacher_id: "", class_id: "", description: "", color: "#3b82f6" });

  const load = () => {
    Promise.all([
      apiFetch<SubjectRecord[]>("/api/subjects"),
      apiFetch<TeacherRecord[]>("/api/teachers"),
      apiFetch<ClassEntity[]>("/api/classes"),
    ]).then(([s, t, c]) => { setSubjects(s); setTeachers(t); setClasses(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm({ subject_name: "", subject_code: "", teacher_id: String(user?.id ?? ""), class_id: "", description: "", color: "#3b82f6" }); setEditing(null); setShowForm(false); };

  const openAdd = () => { reset(); setForm(f => ({ ...f, teacher_id: String(user?.id ?? "") })); setShowForm(true); };

  const openEdit = (s: SubjectRecord) => {
    setEditing(s);
    setForm({ subject_name: s.subject_name, subject_code: s.subject_code ?? "", teacher_id: String(s.teacher_id ?? ""), class_id: String(s.class_id ?? ""), description: s.description ?? "", color: s.color ?? "#3b82f6" });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = { ...form, teacher_id: form.teacher_id || null, class_id: form.class_id || null };
      if (editing) {
        await apiFetch(`/api/subjects/${editing.subject_id}`, { method: "PUT", body: JSON.stringify(body) });
        addToast("success", "Subject Updated", "Subject has been updated successfully.");
      } else {
        await apiFetch("/api/subjects", { method: "POST", body: JSON.stringify(body) });
        addToast("success", "Subject Created", "New subject has been added.");
      }
      load(); reset();
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to save subject.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this subject? All chapters, notes and videos will be removed.")) return;
    try {
      await apiFetch(`/api/subjects/${id}`, { method: "DELETE" });
      addToast("success", "Subject Deleted", "Subject and related data removed.");
      load();
    } catch { addToast("error", "Error", "Failed to delete subject."); }
  };

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>Subjects</h1> <p>Manage all subjects, assign teachers and classes.</p> </div> <button className="button button--primary" onClick={openAdd}>+ Add Subject</button> </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => reset()}> <div className="modal" onClick={e => e.stopPropagation()}> <div className="modal__header"> <h3>{editing ? "Edit Subject" : "Add New Subject"}</h3> <button className="modal__close" onClick={reset}>✕</button> </div> <form className="form" onSubmit={handleSubmit}> <label>Subject Name *
                <input value={form.subject_name} onChange={e => setForm(f => ({...f, subject_name: e.target.value}))} required placeholder="e.g. Mathematics" /> </label> <div className="form-row"> <label>Subject Code
                  <input value={form.subject_code} onChange={e => setForm(f => ({...f, subject_code: e.target.value}))} placeholder="e.g. MATH101" /> </label> <label>Color
                  <div className="color-picker">
                    {COLORS.map(c => (
                      <button key={c} type="button" className={`color-swatch${form.color === c ? " color-swatch--active" : ""}`} style={{ background: c }} onClick={() => setForm(f => ({...f, color: c}))} />
                    ))}
                  </div> </label> </div> <label>Assign Teacher
                <select value={form.teacher_id} onChange={e => setForm(f => ({...f, teacher_id: e.target.value}))}> <option value="">-- Select Teacher --</option>
                  {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.first_name} {t.last_name}</option>)}
                </select> </label> <label>Assign Class
                <select value={form.class_id} onChange={e => setForm(f => ({...f, class_id: e.target.value}))}> <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name} - {c.section} (Grade {c.grade})</option>)}
                </select> </label> <label>Description
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief description of the subject" /> </label> <div className="form-actions"> <button type="button" className="button button--secondary" onClick={reset}>Cancel</button> <button type="submit" className="button button--primary">{editing ? "Update" : "Create"} Subject</button> </div> </form> </div> </div>
      )}

      {loading ? (
        <div className="card-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton-card" style={{ height: 160 }} />)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No subjects yet</h3> <p>Create your first subject to get started</p> <button className="button button--primary" onClick={openAdd}>+ Add Subject</button> </div>
      ) : (
        <div className="subject-grid">
          {subjects.map(s => (
            <div key={s.subject_id} className="subject-card" style={{ borderTopColor: s.color }}> <div className="subject-card__header" style={{ background: s.color + "18" }}> <div className="subject-card__dot" style={{ background: s.color }} /> <h3>{s.subject_name}</h3>
                {s.subject_code && <span className="badge">{s.subject_code}</span>}
              </div> <div className="subject-card__body">
                {s.teacher_name && <p className="subject-card__meta">{s.teacher_name}</p>}
                {s.class_name && <p className="subject-card__meta">{s.class_name} - {s.section}</p>}
                {s.description && <p className="subject-card__desc">{s.description}</p>}
              </div> <div className="subject-card__actions"> <button className="button button--secondary button--sm" onClick={() => openEdit(s)}>Edit</button> <button className="button button--danger button--sm" onClick={() => handleDelete(s.subject_id)}>Delete</button> </div> </div>
          ))}
        </div>
      )}
    </div>
  );
}


