import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import type { LectureRecord, SubjectRecord } from "../../types";

export default function StudentLectures() {
  const [lectures, setLectures] = useState<LectureRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<LectureRecord[]>("/api/lectures"),
      apiFetch<SubjectRecord[]>("/api/subjects"),
    ]).then(([l, s]) => { setLectures(l); setSubjects(s); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filterSubject ? lectures.filter(l => String(l.subject_id) === filterSubject) : lectures;

  const grouped = filtered.reduce<Record<string, LectureRecord[]>>((acc, l) => {
    const date = l.lecture_date.slice(0, 10);
    (acc[date] = acc[date] || []).push(l);
    return acc;
  }, {});

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>Lecture Log</h1> <p>View daily lecture records and topics covered by your teachers.</p> </div> </div> <div className="filter-bar card"> <label>Filter by Subject
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}> <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select> </label> </div>

      {loading ? (
        <div className="card"><p>Loading lectures...</p></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No lectures available</h3> <p>Check back after your teacher logs a lecture.</p> </div>
      ) : (
        <div className="lecture-timeline">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="lecture-day"> <div className="lecture-day__header"> <span className="lecture-day__date">
                  {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span> <span className="badge badge--blue">{items.length} lecture{items.length > 1 ? "s" : ""}</span> </div> <div className="lecture-day__items">
                {items.map(l => (
                  <div key={l.lecture_id} className="lecture-item lecture-item--student"> <div className="lecture-item__subject">{l.subject_name}</div> <h4 className="lecture-item__title">{l.title}</h4>
                    {l.chapter_title && <span className="badge badge--purple">Chapter: {l.chapter_title}</span>}
                    {l.topics_covered && <p className="lecture-item__topics"><strong>Topics Covered:</strong> {l.topics_covered}</p>}
                    {l.teacher_name && <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>👤 {l.teacher_name}</p>}
                  </div>
                ))}
              </div> </div>
          ))}
        </div>
      )}
    </div>
  );
}


