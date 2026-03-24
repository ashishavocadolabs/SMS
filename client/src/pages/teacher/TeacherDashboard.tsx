import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { TeacherPerformance } from "../../types";
import { StudentsIcon, LectureIcon, TestIcon, AttendanceIcon, BookIcon, NotesIcon, VideoIcon, ChartIcon } from "../../components/Icons";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [perf, setPerf] = useState<TeacherPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<TeacherPerformance>(`/api/performance/teacher/${user.id}`)
      .then(setPerf)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const attendance = perf?.attendance;
  const attendancePct = attendance && Number(attendance.total) > 0
    ? Math.round((Number(attendance.present) / Number(attendance.total)) * 100)
    : 0;

  return (
    <div className="page__content"> <div className="dash-welcome"> <div> <h1>Welcome back, {user?.firstName}!</h1> <p>Here's your school management overview for today.</p> </div> <Link to="/teacher/lectures/new" className="button button--primary button--sm">
          + Log Today's Lecture
        </Link> </div>

      {loading ? (
        <div className="skeleton-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : (
        <div className="stat-grid"> <div className="stat-card stat-card--blue"> <div className="stat-card__icon"><StudentsIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{perf?.totalStudents ?? 0}</span> <span className="stat-card__label">Total Students</span> </div> </div> <div className="stat-card stat-card--green"> <div className="stat-card__icon"><LectureIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{perf?.totalLectures ?? 0}</span> <span className="stat-card__label">Lectures Delivered</span> </div> </div> <div className="stat-card stat-card--purple"> <div className="stat-card__icon"><TestIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{perf?.tests?.length ?? 0}</span> <span className="stat-card__label">MCQ Tests Created</span> </div> </div> <div className="stat-card stat-card--orange"> <div className="stat-card__icon"><AttendanceIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{attendancePct}%</span> <span className="stat-card__label">Class Attendance Rate</span> </div> </div> </div>
      )}

      <div className="dash-grid"> <div className="card dash-card"> <h3>Quick Actions</h3> <div className="quick-actions"> <Link to="/teacher/subjects" className="quick-action quick-action--blue"> <span className="quick-action__icon"><BookIcon size={20} /></span> <span>Manage Subjects</span> </Link> <Link to="/teacher/lectures" className="quick-action quick-action--green"> <span className="quick-action__icon"><LectureIcon size={20} /></span> <span>Daily Lectures</span> </Link> <Link to="/teacher/notes" className="quick-action quick-action--purple"> <span className="quick-action__icon"><NotesIcon size={20} /></span> <span>Upload Notes</span> </Link> <Link to="/teacher/videos" className="quick-action quick-action--orange"> <span className="quick-action__icon"><VideoIcon size={20} /></span> <span>Add Videos</span> </Link> <Link to="/teacher/tests" className="quick-action quick-action--red"> <span className="quick-action__icon"><TestIcon size={20} /></span> <span>Create MCQ Test</span> </Link> <Link to="/teacher/performance" className="quick-action quick-action--teal"> <span className="quick-action__icon"><ChartIcon size={20} /></span> <span>View Reports</span> </Link> </div> </div> <div className="card dash-card"> <h3>Recent Test Performance</h3>
          {perf?.tests && perf.tests.length > 0 ? (
            <div className="table-wrapper"> <table className="data-table"> <thead> <tr> <th>Test</th> <th>Subject</th> <th>Submissions</th> <th>Avg Score</th> </tr> </thead> <tbody>
                  {perf.tests.slice(0, 5).map((t) => (
                    <tr key={t.test_id}> <td>{t.title}</td> <td><span className="badge badge--blue">{t.subject_name}</span></td> <td>{t.submissions}</td> <td> <span className={`badge ${Number(t.avg_score) >= 70 ? "badge--green" : Number(t.avg_score) >= 40 ? "badge--orange" : "badge--red"}`}>
                          {Math.round(Number(t.avg_score))}%
                        </span> </td> </tr>
                  ))}
                </tbody> </table> </div>
          ) : (
            <div className="empty-state"> <p>No tests created yet.</p> <Link to="/teacher/tests" className="button button--secondary button--sm">Create Your First Test</Link> </div>
          )}
        </div> </div> </div>
  );
}


