import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import type { NoteRecord, SubjectRecord, ChapterRecord } from "../../types";

export default function StudentNotes() {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [viewing, setViewing] = useState<NoteRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadNotes = (subjectId?: string, chapterId?: string) => {
    let qs = "";
    if (chapterId) qs = `?chapter_id=${chapterId}`;
    else if (subjectId) qs = `?subject_id=${subjectId}`;
    apiFetch<NoteRecord[]>(`/api/notes${qs}`).then(setNotes).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([apiFetch<SubjectRecord[]>("/api/subjects"), apiFetch<ChapterRecord[]>("/api/chapters")])
      .then(([s, ch]) => { setSubjects(s); setChapters(ch); }).catch(() => {});
    loadNotes();
  }, []);

  useEffect(() => { loadNotes(filterSubject, filterChapter); }, [filterSubject, filterChapter]);

  const filteredChapters = filterSubject ? chapters.filter(c => String(c.subject_id) === filterSubject) : chapters;

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>Study Notes</h1> <p>Browse subject and chapter-wise notes shared by your teachers.</p> </div> </div> <div className="filter-bar card"> <label>Subject
          <select value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setFilterChapter(""); }}> <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select> </label> <label>Chapter
          <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)} disabled={!filterSubject}> <option value="">All Chapters</option>
            {filteredChapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>Ch.{c.chapter_number}: {c.chapter_title}</option>)}
          </select> </label> </div>

      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}> <div className="modal modal--lg" onClick={e => e.stopPropagation()}> <div className="modal__header"> <div> <h3>{viewing.title}</h3> <small className="muted">{viewing.subject_name} • {viewing.chapter_title} • by {viewing.teacher_name}</small> </div> <button className="modal__close" onClick={() => setViewing(null)}>✕</button> </div> <div className="note-viewer">
              {viewing.content ? <pre className="note-content">{viewing.content}</pre> : <p className="muted">No text content.</p>}
              {viewing.file_url && (
                <div className="note-file"> <span>📎 File/Reference: </span> <a href={viewing.file_url} target="_blank" rel="noopener noreferrer" className="link">{viewing.file_url}</a> </div>
              )}
            </div> </div> </div>
      )}

      {loading ? (
        <div className="card"><p>Loading notes...</p></div>
      ) : notes.length === 0 ? (
        <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No notes available</h3> <p>Your teacher hasn't added any notes yet.</p> </div>
      ) : (
        <div className="notes-grid">
          {notes.map(n => (
            <div key={n.note_id} className="note-card note-card--student"> <div className="note-card__header"> <div> <span className="badge badge--blue">{n.subject_name}</span>
                  {n.chapter_title && <span className="badge badge--purple" style={{ marginLeft: 6 }}>{n.chapter_title}</span>}
                </div> <span className="note-card__date">{new Date(n.created_at).toLocaleDateString()}</span> </div> <h4 className="note-card__title">{n.title}</h4>
              {n.content && <p className="note-card__preview">{n.content.slice(0, 150)}{n.content.length > 150 ? "..." : ""}</p>}
              {n.teacher_name && <p className="note-card__teacher">👤 {n.teacher_name}</p>}
              <div className="note-card__actions"> <button className="button button--primary button--sm" onClick={() => setViewing(n)}>Read Note</button>
                {n.file_url && <a href={n.file_url} target="_blank" rel="noopener noreferrer" className="button button--secondary button--sm">📎 Download</a>}
              </div> </div>
          ))}
        </div>
      )}
    </div>
  );
}


