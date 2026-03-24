import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import type { ClassPerformanceRow, TeacherPerformance } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { StudentsIcon, AttendanceIcon, ChartIcon, LectureIcon, TestIcon } from "../../components/Icons";

function ProgressBar({ value, max = 100, color = "#3b82f6" }: { value: number; max?: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progress-bar"> <div className="progress-bar__fill" style={{ width: `${pct}%`, background: color }} /> <span className="progress-bar__label">{pct}%</span> </div>
  );
}

export default function TeacherPerformance() {
  const { user } = useAuth();
  const [classPerf, setClassPerf] = useState<ClassPerformanceRow[]>([]);
  const [teacherPerf, setTeacherPerf] = useState<TeacherPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"students"|"my">("students");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiFetch<ClassPerformanceRow[]>("/api/performance/class-performance"),
      apiFetch<TeacherPerformance>(`/api/performance/teacher/${user.id}`),
    ]).then(([cp, tp]) => { setClassPerf(cp); setTeacherPerf(tp); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const myAttPct = teacherPerf?.attendance && Number(teacherPerf.attendance.total) > 0
    ? Math.round((Number(teacherPerf.attendance.present) / Number(teacherPerf.attendance.total)) * 100)
    : 0;

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>Performance Reports</h1> <p>Track student performance and your teaching statistics.</p> </div> </div> <div className="tabs"> <button className={`tab${tab === "students" ? " tab--active" : ""}`} onClick={() => setTab("students")}>Student Performance</button> <button className={`tab${tab === "my" ? " tab--active" : ""}`} onClick={() => setTab("my")}>My Statistics</button> </div>

      {loading ? (
        <div className="card"><p>Loading performance data...</p></div>
      ) : tab === "students" ? (
        <div> <div className="stat-grid" style={{ marginBottom: 24 }}> <div className="stat-card stat-card--blue"> <div className="stat-card__icon"><StudentsIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{classPerf.length}</span> <span className="stat-card__label">Total Students</span> </div> </div> <div className="stat-card stat-card--green"> <div className="stat-card__icon"><ChartIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">
                  {classPerf.length > 0 ? Math.round(classPerf.reduce((a, r) => a + Number(r.avg_score), 0) / classPerf.length) : 0}%
                </span> <span className="stat-card__label">Class Average Score</span> </div> </div> <div className="stat-card stat-card--orange"> <div className="stat-card__icon"><AttendanceIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">
                  {classPerf.length > 0
                    ? Math.round(classPerf.reduce((a, r) => a + (Number(r.total_days) > 0 ? (Number(r.present_days)/Number(r.total_days))*100 : 0), 0) / classPerf.length)
                    : 0}%
                </span> <span className="stat-card__label">Avg Attendance Rate</span> </div> </div> </div>

          {classPerf.length === 0 ? (
            <div className="empty-state card"><p>No student data available.</p></div>
          ) : (
            <div className="card table-card"> <h3 style={{ marginBottom: 16 }}>Student-wise Performance</h3> <div className="table-wrapper"> <table className="data-table"> <thead> <tr> <th>#</th> <th>Student Name</th> <th>Days Present</th> <th>Attendance</th> <th>Tests Taken</th> <th>Avg Score</th> <th>Performance</th> </tr> </thead> <tbody>
                    {classPerf.map((r, i) => {
                      const attPct = Number(r.total_days) > 0 ? Math.round((Number(r.present_days) / Number(r.total_days)) * 100) : 0;
                      const score = Math.round(Number(r.avg_score));
                      return (
                        <tr key={r.student_id}> <td>{i + 1}</td> <td><strong>{r.student_name}</strong></td> <td>{r.present_days}/{r.total_days}</td> <td><ProgressBar value={attPct} color="#10b981" /></td> <td>{r.tests_taken}</td> <td><ProgressBar value={score} color={score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444"} /></td> <td> <span className={`badge ${score >= 70 ? "badge--green" : score >= 40 ? "badge--orange" : "badge--red"}`}>
                              {score >= 70 ? "Excellent" : score >= 40 ? "Average" : "Needs Help"}
                            </span> </td> </tr>
                      );
                    })}
                  </tbody> </table> </div> </div>
          )}
        </div>
      ) : (
        <div> <div className="stat-grid" style={{ marginBottom: 24 }}> <div className="stat-card stat-card--blue"> <div className="stat-card__icon"><LectureIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{teacherPerf?.totalLectures ?? 0}</span> <span className="stat-card__label">Lectures Given</span> </div> </div> <div className="stat-card stat-card--purple"> <div className="stat-card__icon"><TestIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{teacherPerf?.tests?.length ?? 0}</span> <span className="stat-card__label">Tests Created</span> </div> </div> <div className="stat-card stat-card--green"> <div className="stat-card__icon"><AttendanceIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{myAttPct}%</span> <span className="stat-card__label">Class Attendance</span> </div> </div> </div>

          {teacherPerf?.tests && teacherPerf.tests.length > 0 && (
            <div className="card table-card"> <h3 style={{ marginBottom: 16 }}>My Test Performance</h3> <div className="table-wrapper"> <table className="data-table"> <thead> <tr> <th>Test Title</th> <th>Subject</th> <th>Submissions</th> <th>Avg Score</th> <th>Created</th> </tr> </thead> <tbody>
                    {(teacherPerf.tests as any[]).map((t: any) => (
                      <tr key={t.test_id}> <td>{t.title}</td> <td><span className="badge badge--blue">{t.subject_name}</span></td> <td>{t.submissions}</td> <td> <ProgressBar value={Math.round(Number(t.avg_score))} color={Number(t.avg_score) >= 70 ? "#10b981" : "#f59e0b"} /> </td> <td>{new Date(t.created_at).toLocaleDateString()}</td> </tr>
                    ))}
                  </tbody> </table> </div> </div>
          )}
        </div>
      )}
    </div>
  );
}


