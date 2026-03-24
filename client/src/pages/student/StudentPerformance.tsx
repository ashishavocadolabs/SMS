import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { StudentPerformance } from "../../types";
import { AttendanceIcon, TestIcon, ChartIcon, LectureIcon } from "../../components/Icons";

function RingChart({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value >= 70 ? "#10b981" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}> <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" /> <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} /> <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
        {value}%
      </text> </svg>
  );
}

export default function StudentPerformancePage() {
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

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>My Performance</h1> <p>Track your academic progress, attendance and test scores.</p> </div> </div>

      {loading ? (
        <div className="card"><p>Loading...</p></div>
      ) : (
        <> <div className="stat-grid"> <div className="stat-card stat-card--green"> <div className="stat-card__icon"><AttendanceIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{attPct}%</span> <span className="stat-card__label">Attendance Rate</span> </div> </div> <div className="stat-card stat-card--blue"> <div className="stat-card__icon"><TestIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{perf?.tests?.length ?? 0}</span> <span className="stat-card__label">Tests Attempted</span> </div> </div> <div className="stat-card stat-card--purple"> <div className="stat-card__icon"><ChartIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{perf?.avgScore ?? 0}%</span> <span className="stat-card__label">Average Score</span> </div> </div> <div className="stat-card stat-card--orange"> <div className="stat-card__icon"><LectureIcon size={24} /></div> <div className="stat-card__body"> <span className="stat-card__value">{perf?.totalLectures ?? 0}</span> <span className="stat-card__label">Total Lectures</span> </div> </div> </div> <div className="perf-grid"> <div className="card"> <h3>Attendance Breakdown</h3> <div className="ring-row"> <div className="ring-item"> <RingChart value={attPct} size={90} /> <span>Attendance</span> </div> <div className="ring-item"> <RingChart value={perf?.avgScore ?? 0} size={90} /> <span>Avg Score</span> </div> </div>
              {att && (
                <div className="att-breakdown"> <div className="att-chip att-chip--green"> <strong>{att.present}</strong> Present
                  </div> <div className="att-chip att-chip--orange"> <strong>{att.late}</strong> Late
                  </div> <div className="att-chip att-chip--red"> <strong>{att.absent}</strong> Absent
                  </div> </div>
              )}
            </div> <div className="card"> <h3>Test History</h3>
              {!perf?.tests?.length ? (
                <p className="muted">No tests taken yet.</p>
              ) : (
                <div className="test-history">
                  {perf.tests.map((t, i) => {
                    const pct = t.total_marks > 0 ? Math.round((t.score / t.total_marks) * 100) : 0;
                    return (
                      <div key={t.result_id ?? i} className="test-history-item"> <div className="test-history-item__info"> <strong>{t.test_title}</strong> <span className="badge badge--blue">{t.subject_name}</span> </div> <div className="test-history-item__score"> <div className="progress-bar" style={{ width: 120 }}> <div className="progress-bar__fill" style={{ width: `${pct}%`, background: pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444" }} /> </div> <span className={`badge ${pct >= 70 ? "badge--green" : pct >= 40 ? "badge--orange" : "badge--red"}`}>
                            {t.score}/{t.total_marks} ({pct}%)
                          </span> </div> </div>
                    );
                  })}
                </div>
              )}
            </div> </div> </>
      )}
    </div>
  );
}


