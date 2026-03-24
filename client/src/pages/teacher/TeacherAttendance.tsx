import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { useToast } from "../../contexts/ToastContext";
import type { ClassEntity, AttendanceStatus } from "../../types";

interface StudentRow {
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface AttRecord {
  student_id: number;
  status: AttendanceStatus;
}

const STATUSES: AttendanceStatus[] = ["present", "absent", "late"];

export default function TeacherAttendance() {
  const { addToast } = useToast();
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [classId, setClassId] = useState<number | "">("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [marks, setMarks] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  /* load classes */
  useEffect(() => {
    apiFetch<ClassEntity[]>("/api/classes")
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* when class or date changes, load students & existing records */
  useEffect(() => {
    if (!classId) { setStudents([]); return; }

    (async () => {
      try {
        const [studs, existing] = await Promise.all([
          apiFetch<StudentRow[]>(`/api/attendance/class/${classId}/students`),
          apiFetch<AttRecord[]>(`/api/attendance/class/${classId}?date=${date}`),
        ]);
        setStudents(studs);

        const map: Record<number, AttendanceStatus> = {};
        studs.forEach(s => { map[s.student_id] = "present"; });
        existing.forEach(r => { map[r.student_id] = r.status as AttendanceStatus; });
        setMarks(map);
      } catch {
        setStudents([]);
      }
    })();
  }, [classId, date]);

  const setStatus = (sid: number, status: AttendanceStatus) => {
    setMarks(prev => ({ ...prev, [sid]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const newMarks: Record<number, AttendanceStatus> = {};
    students.forEach(s => { newMarks[s.student_id] = status; });
    setMarks(newMarks);
  };

  const handleSave = async () => {
    if (!classId) return;
    setSaving(true);

    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        status: marks[s.student_id] || "present",
      }));

      await apiFetch("/api/attendance/bulk", {
        method: "POST",
        body: JSON.stringify({ records, date, class_id: classId }),
      });

      addToast("success", "Attendance Saved", `Attendance saved for ${records.length} students!`);
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(marks).filter(s => s === "present").length;
  const absentCount = Object.values(marks).filter(s => s === "absent").length;
  const lateCount = Object.values(marks).filter(s => s === "late").length;

  if (loading) {
    return <div className="page__content"><h1>Mark Attendance</h1><p>Loading...</p></div>;
  }

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>Mark Attendance</h1> <p>Select a class and date, then mark each student's attendance.</p> </div> </div>

      <div className="card" style={{ marginBottom: 24 }}> <div className="att-filter"> <label>
            Class
            <select value={classId} onChange={e => setClassId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">-- Select Class --</option>
              {classes.map(c => (
                <option key={c.class_id} value={c.class_id}>{c.class_name} - {c.section} (Grade {c.grade})</option>
              ))}
            </select> </label> <label>
            Date
            <input type="date" value={date} onChange={e => setDate(e.target.value)} /> </label> </div> </div>

      {classId && students.length > 0 && (
        <> <div className="stat-grid" style={{ marginBottom: 16 }}> <div className="stat-card stat-card--blue"> <div className="stat-card__body"> <span className="stat-card__value">{students.length}</span> <span className="stat-card__label">Total Students</span> </div> </div> <div className="stat-card stat-card--green"> <div className="stat-card__body"> <span className="stat-card__value">{presentCount}</span> <span className="stat-card__label">Present</span> </div> </div> <div className="stat-card stat-card--red"> <div className="stat-card__body"> <span className="stat-card__value">{absentCount}</span> <span className="stat-card__label">Absent</span> </div> </div> <div className="stat-card stat-card--orange"> <div className="stat-card__body"> <span className="stat-card__value">{lateCount}</span> <span className="stat-card__label">Late</span> </div> </div> </div>

          <div className="card table-card"> <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}> <h3 style={{ margin: 0 }}>Student List</h3> <div style={{ display: "flex", gap: 6 }}> <button className="button button--sm" style={{ background: "#10b981", color: "#fff", border: "none" }} onClick={() => markAll("present")}>All Present</button> <button className="button button--sm" style={{ background: "#ef4444", color: "#fff", border: "none" }} onClick={() => markAll("absent")}>All Absent</button> </div> </div> <div className="table-wrapper"> <table className="data-table"> <thead> <tr> <th>#</th> <th>Student Name</th> <th>Email</th> <th>Status</th> </tr> </thead> <tbody>
                  {students.map((s, i) => (
                    <tr key={s.student_id}> <td>{i + 1}</td> <td><strong>{s.first_name} {s.last_name}</strong></td> <td>{s.email}</td> <td> <div className="att-status-group">
                          {STATUSES.map(st => (
                            <button
                              key={st}
                              type="button"
                              className={`att-status-btn att-status-btn--${st}${marks[s.student_id] === st ? " att-status-btn--active" : ""}`}
                              onClick={() => setStatus(s.student_id, st)}
                            >
                              {st.charAt(0).toUpperCase() + st.slice(1)}
                            </button>
                          ))}
                        </div> </td> </tr>
                  ))}
                </tbody> </table> </div> <div style={{ marginTop: 20, textAlign: "right" }}> <button className="button button--primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Attendance"}
              </button> </div> </div> </>
      )}

      {classId && students.length === 0 && (
        <div className="empty-state card"> <h3>No students found</h3> <p>No students are assigned to this class yet.</p> </div>
      )}
    </div>
  );
}


