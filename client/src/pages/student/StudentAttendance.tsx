import { useEffect, useState } from "react";
import { apiFetch, buildQuery } from "../../api";
import { useAuth } from "../../contexts/AuthContext";

interface AttendanceRow {
  attendance_id: number;
  student_id: number;
  class_id: number;
  status: string;
  date: string;
  class_name?: string;
  section?: string;
  grade?: string;
}

interface Summary {
  total: number;
  present: number;
  absent: number;
  late: number;
}

export default function StudentAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, present: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const load = () => {
    if (!user) return;
    setLoading(true);
    const q = buildQuery({ from: fromDate, to: toDate });
    apiFetch<{ records: AttendanceRow[]; summary: Summary }>(`/api/attendance/student/${user.id}${q}`)
      .then((data) => {
        setRecords(data.records);
        setSummary(data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const attPct = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

  const statusBadge = (s: string) => {
    if (s === "present") return "badge badge--green";
    if (s === "late") return "badge badge--orange";
    return "badge badge--red";
  };

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>My Attendance</h1> <p>View your attendance records marked by your teachers.</p> </div> </div>

      <div className="stat-grid"> <div className="stat-card stat-card--blue"> <div className="stat-card__body"> <span className="stat-card__value">{summary.total}</span> <span className="stat-card__label">Total Days</span> </div> </div> <div className="stat-card stat-card--green"> <div className="stat-card__body"> <span className="stat-card__value">{summary.present}</span> <span className="stat-card__label">Present</span> </div> </div> <div className="stat-card stat-card--red"> <div className="stat-card__body"> <span className="stat-card__value">{summary.absent}</span> <span className="stat-card__label">Absent</span> </div> </div> <div className="stat-card stat-card--orange"> <div className="stat-card__body"> <span className="stat-card__value">{summary.late}</span> <span className="stat-card__label">Late</span> </div> </div> </div>

      <div className="card" style={{ marginBottom: 24 }}> <div className="att-pct-bar"> <div className="att-pct-bar__track"> <div className="att-pct-bar__fill" style={{ width: `${attPct}%`, background: attPct >= 75 ? "#10b981" : attPct >= 50 ? "#f59e0b" : "#ef4444" }} /> </div> <span className="att-pct-bar__label">{attPct}% Attendance Rate</span> </div> </div>

      <div className="card" style={{ marginBottom: 24 }}> <form className="att-filter" onSubmit={handleFilter}> <label>
            From
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /> </label> <label>
            To
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /> </label> <button type="submit" className="button button--primary button--sm">Filter</button> <button type="button" className="button button--secondary button--sm" onClick={() => { setFromDate(""); setToDate(""); setTimeout(load, 0); }}>Reset</button> </form> </div>

      {loading ? (
        <div className="card"><p>Loading attendance...</p></div>
      ) : records.length === 0 ? (
        <div className="empty-state card"> <h3>No attendance records</h3> <p>Your teachers haven't marked any attendance yet.</p> </div>
      ) : (
        <div className="card table-card"> <div className="table-wrapper"> <table className="data-table"> <thead> <tr> <th>#</th> <th>Date</th> <th>Class</th> <th>Status</th> </tr> </thead> <tbody>
                {records.map((r, i) => (
                  <tr key={r.attendance_id}> <td>{i + 1}</td> <td>{new Date(r.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</td> <td>{r.class_name ? `${r.class_name} - ${r.section}` : `Class #${r.class_id}`}</td> <td><span className={statusBadge(r.status)}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td> </tr>
                ))}
              </tbody> </table> </div> </div>
      )}
    </div>
  );
}


