import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import type { SubjectRecord, ChapterRecord } from "../../types";

export default function StudentSubjects() {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [selected, setSelected] = useState<SubjectRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch<SubjectRecord[]>("/api/subjects"), apiFetch<ChapterRecord[]>("/api/chapters")])
      .then(([s, ch]) => { setSubjects(s); setChapters(ch); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getChapters = (subjectId: number) =>
    chapters.filter(c => c.subject_id === subjectId).sort((a, b) => a.chapter_number - b.chapter_number);

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>My Subjects</h1> <p>Browse all your subjects and their chapters.</p> </div> </div>

      {loading ? (
        <div className="card"><p>Loading subjects...</p></div>
      ) : subjects.length === 0 ? (
        <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No subjects available</h3> <p>Your teacher hasn't added any subjects yet.</p> </div>
      ) : (
        <div className="subject-detail-layout"> <div className="subject-sidebar">
            {subjects.map(s => (
              <button
                key={s.subject_id}
                className={`subject-tab${selected?.subject_id === s.subject_id ? " subject-tab--active" : ""}`}
                style={{ borderLeftColor: s.color }}
                onClick={() => setSelected(s)}
              > <span className="subject-tab__dot" style={{ background: s.color }} /> <span className="subject-tab__name">{s.subject_name}</span>
                {s.subject_code && <span className="badge" style={{ marginLeft: "auto" }}>{s.subject_code}</span>}
              </button>
            ))}
          </div> <div className="subject-detail">
            {!selected ? (
              <div className="empty-state"> <div className="empty-state__icon">👈</div> <p>Select a subject to view its chapters</p> </div>
            ) : (
              <> <div className="subject-detail__header" style={{ borderColor: selected.color }}> <div className="subject-detail__title-row"> <div className="subject-detail__dot" style={{ background: selected.color }} /> <div> <h2>{selected.subject_name}</h2>
                      {selected.subject_code && <span className="badge">{selected.subject_code}</span>}
                    </div> </div>
                  {selected.teacher_name && <p className="muted">👤 Teacher: {selected.teacher_name}</p>}
                  {selected.description && <p>{selected.description}</p>}
                </div> <h3 style={{ marginTop: 20, marginBottom: 12 }}>Chapters</h3>
                {getChapters(selected.subject_id).length === 0 ? (
                  <div className="empty-state"><p>No chapters yet for this subject.</p></div>
                ) : (
                  <div className="chapter-list">
                    {getChapters(selected.subject_id).map(c => (
                      <div key={c.chapter_id} className="chapter-item chapter-item--student"> <div className="chapter-item__num" style={{ background: selected.color + "22", color: selected.color }}>Ch.{c.chapter_number}</div> <div className="chapter-item__body"> <h4>{c.chapter_title}</h4>
                          {c.description && <p>{c.description}</p>}
                        </div> </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div> </div>
      )}
    </div>
  );
}


