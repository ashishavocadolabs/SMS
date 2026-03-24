import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { StudentPerformance } from "../../types";
import { AttendanceIcon, LectureIcon, TestIcon, ChartIcon, BookIcon, NotesIcon, VideoIcon } from "../../components/Icons";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [perf, setPerf] = useState<StudentPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<StudentPerformance>(`/api/performance/student/${user.id}`)
      .then(setPerf).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const att = perf?.attendance;
  const attPct = att && Number(att.total) > 0 ? Math.round((Number(att.present) / Number(att.total)) * 100) : 0;
  const recentTests = perf?.tests?.slice(0, 5) ?? [];

  return (
    <div className="page__content"> <div className="dash-welcome"> <div> <h1>Hello, {user?.firstName}!</h1> <p>Here's your academic progress at a glance.</p> </div> <Link to="/student/tests" className="button button--primary button--sm">Take a Test</Link> </div>

      {loading ? (
        <div className="skeleton-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : (
        <div className="stat-grid"> <div className="stat-card stat-card--green"> <div className="stat-card__icon"><AttendanceIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{attPct}%</span> <span className="stat-card__label">Attendance Rate</span> </div> </div> <div className="stat-card stat-card--blue"> <div className="stat-card__icon"><LectureIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{perf?.totalLectures ?? 0}</span> <span className="stat-card__label">Total Lectures</span> </div> </div> <div className="stat-card stat-card--purple"> <div className="stat-card__icon"><TestIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{perf?.tests?.length ?? 0}</span> <span className="stat-card__label">Tests Taken</span> </div> </div> <div className="stat-card stat-card--orange"> <div className="stat-card__icon"><ChartIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{perf?.avgScore ?? 0}%</span> <span className="stat-card__label">Average Score</span> </div> </div> </div>
      )}

      <div className="dash-grid"> <div className="card dash-card"> <h3>Quick Links</h3> <div className="quick-actions"> <Link to="/student/subjects" className="quick-action quick-action--blue"> <span className="quick-action__icon"><BookIcon size={20} /></span> <span>My Subjects</span> </Link> <Link to="/student/notes" className="quick-action quick-action--green"> <span className="quick-action__icon"><NotesIcon size={20} /></span> <span>Study Notes</span> </Link> <Link to="/student/videos" className="quick-action quick-action--purple"> <span className="quick-action__icon"><VideoIcon size={20} /></span> <span>Video Lectures</span> </Link> <Link to="/student/lectures" className="quick-action quick-action--teal"> <span className="quick-action__icon"><LectureIcon size={20} /></span> <span>Lecture Log</span> </Link> <Link to="/student/tests" className="quick-action quick-action--orange"> <span className="quick-action__icon"><TestIcon size={20} /></span> <span>Take MCQ Test</span> </Link> <Link to="/student/performance" className="quick-action quick-action--red"> <span className="quick-action__icon"><ChartIcon size={20} /></span> <span>My Performance</span> </Link> </div> </div> <div className="card dash-card"> <h3>Recent Test Results</h3>
          {recentTests.length === 0 ? (
            <div className="empty-state"> <p>No tests taken yet.</p> <Link to="/student/tests" className="button button--secondary button--sm">Browse Tests</Link> </div>
          ) : (
            <div className="result-list">
              {recentTests.map(t => {
                const pct = t.total_marks > 0 ? Math.round((t.score / t.total_marks) * 100) : 0;
                return (
                  <div key={t.result_id} className="result-item"> <div className="result-item__info"> <strong>{t.test_title}</strong> <span className="muted">{t.subject_name}</span> </div> <div className="result-item__score"> <span className={`badge ${pct >= 70 ? "badge--green" : pct >= 40 ? "badge--orange" : "badge--red"}`}>
                        {t.score}/{t.total_marks} ({pct}%)
                      </span> </div> </div>
                );
              })}
            </div>
          )}
        </div> </div> <div className="card" style={{ marginTop: 0 }}> <h3>Attendance Overview</h3>
        {att ? (
          <div className="att-overview"> <div className="att-overview__bar"> <div className="att-overview__segment att-overview__segment--present" style={{ width: `${att.total ? (Number(att.present)/Number(att.total)*100) : 0}%` }} title={`Present: ${att.present}`}>
                {Number(att.present) > 0 && <span>Present ({att.present})</span>}
              </div> <div className="att-overview__segment att-overview__segment--late" style={{ width: `${att.total ? (Number(att.late)/Number(att.total)*100) : 0}%` }} title={`Late: ${att.late}`}>
                {Number(att.late) > 0 && <span>Late ({att.late})</span>}
              </div> <div className="att-overview__segment att-overview__segment--absent" style={{ width: `${att.total ? (Number(att.absent)/Number(att.total)*100) : 0}%` }} title={`Absent: ${att.absent}`}>
                {Number(att.absent) > 0 && <span>Absent ({att.absent})</span>}
              </div> </div> <p className="att-overview__total">Total: {att.total} days tracked</p> </div>
        ) : (
          <p className="muted">No attendance data yet.</p>
        )}
      </div> </div>
  );
}


