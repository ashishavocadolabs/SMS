import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import FaceCamera from "../../components/FaceCamera";
import type { ClassEntity } from "../../types";

interface CVSession {
  session_id: number;
  class_id: number;
  teacher_id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  auto_activate: boolean;
  allow_late_minutes: number;
  created_at: string;
  class_name?: string;
  section?: string;
  grade?: string;
  teacher_name?: string;
  verified_count?: number;
}

interface LogEntry {
  log_id: number;
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  verified_at: string;
  confidence: number;
  method: string;
  status: string;
  face_registered: boolean;
}

interface UnverifiedStudent {
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  face_registered: boolean;
}

interface ReverifyRequest {
  request_id: number;
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  face_photo: string | null;
  reason: string;
  status: string;
  created_at: string;
}

export default function TeacherCVAttendance() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sessions, setSessions] = useState<CVSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sessions" | "create" | "reverify">("sessions");

  // Create form
  const [form, setForm] = useState({
    class_id: "",
    session_date: new Date().toISOString().slice(0, 10),
    start_time: "09:00",
    end_time: "09:30",
    auto_activate: true,
    allow_late_minutes: 10,
  });
  const [creating, setCreating] = useState(false);

  // Detail view
  const [selectedSession, setSelectedSession] = useState<CVSession | null>(null);
  const [sessionLog, setSessionLog] = useState<LogEntry[]>([]);
  const [unverified, setUnverified] = useState<UnverifiedStudent[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Teacher verify student
  const [verifyStudent, setVerifyStudent] = useState<UnverifiedStudent | null>(null);
  const [teacherFaceRegistered, setTeacherFaceRegistered] = useState(false);

  // Re-verify requests
  const [reverifyRequests, setReverifyRequests] = useState<ReverifyRequest[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [cls, sess, faceStatus, revReqs] = await Promise.allSettled([
        apiFetch<ClassEntity[]>("/api/classes"),
        apiFetch<CVSession[]>(`/api/face/cv-sessions?teacher_id=${user.id}`),
        apiFetch<{ face_registered: boolean }>(`/api/face/status?role=teacher&user_id=${user.id}`),
        apiFetch<ReverifyRequest[]>("/api/face/reverify-requests"),
      ]);
      if (cls.status === "fulfilled") setClasses(cls.value);
      if (sess.status === "fulfilled") setSessions(sess.value);
      if (faceStatus.status === "fulfilled") setTeacherFaceRegistered(faceStatus.value.face_registered);
      if (revReqs.status === "fulfilled") setReverifyRequests(revReqs.value);
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Auto refresh sessions
  useEffect(() => {
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.class_id) return;
    setCreating(true);
    try {
      await apiFetch("/api/face/cv-sessions", {
        method: "POST",
        body: JSON.stringify({
          class_id: Number(form.class_id),
          teacher_id: user.id,
          session_date: form.session_date,
          start_time: form.start_time,
          end_time: form.end_time,
          auto_activate: form.auto_activate,
          allow_late_minutes: form.allow_late_minutes,
        }),
      });
      addToast("success", "Session Created", "Face verification session created. Students have been notified.");
      setTab("sessions");
      load();
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to create session.");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (session: CVSession) => {
    try {
      await apiFetch(`/api/face/cv-sessions/${session.session_id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !session.is_active }),
      });
      addToast("success", "Updated", `Session ${session.is_active ? "deactivated" : "activated"}.`);
      load();
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to update.");
    }
  };

  const deleteSession = async (id: number) => {
    try {
      await apiFetch(`/api/face/cv-sessions/${id}`, { method: "DELETE" });
      addToast("success", "Deleted", "Session deleted.");
      setSelectedSession(null);
      load();
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to delete.");
    }
  };

  const openDetail = async (session: CVSession) => {
    setSelectedSession(session);
    setLoadingDetail(true);
    try {
      const [log, unv] = await Promise.all([
        apiFetch<LogEntry[]>(`/api/face/cv-sessions/${session.session_id}/log`),
        apiFetch<UnverifiedStudent[]>(`/api/face/cv-sessions/${session.session_id}/unverified`),
      ]);
      setSessionLog(log);
      setUnverified(unv);
    } catch { /* ignore */ }
    setLoadingDetail(false);
  };

  const handleTeacherVerify = async (descriptor: Float32Array) => {
    if (!user || !selectedSession || !verifyStudent) return;
    try {
      await apiFetch("/api/face/cv-teacher-verify", {
        method: "POST",
        body: JSON.stringify({
          session_id: selectedSession.session_id,
          student_id: verifyStudent.student_id,
          teacher_id: user.id,
          teacher_descriptor: Array.from(descriptor),
        }),
      });
      addToast("success", "Verified", `${verifyStudent.first_name} ${verifyStudent.last_name} verified by teacher.`);
      setVerifyStudent(null);
      openDetail(selectedSession);
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Verification failed.");
    }
  };

  // Teacher face registration
  const [showTeacherFaceReg, setShowTeacherFaceReg] = useState(false);

  // Re-verify requests
  const [loadingReverify, setLoadingReverify] = useState(false);

  const loadReverifyRequests = async () => {
    setLoadingReverify(true);
    try {
      const data = await apiFetch<ReverifyRequest[]>("/api/face/reverify-requests");
      setReverifyRequests(data);
    } catch { /* ignore */ }
    setLoadingReverify(false);
  };

  useEffect(() => {
    if (tab === "reverify") loadReverifyRequests();
  }, [tab]);

  const handleReverifyAction = async (requestId: number, action: "approved" | "rejected") => {
    if (!user) return;
    try {
      await apiFetch(`/api/face/reverify-request/${requestId}`, {
        method: "PUT",
        body: JSON.stringify({ status: action, teacher_id: user.id }),
      });
      addToast("success", action === "approved" ? "Approved" : "Rejected",
        action === "approved" ? "Student can now re-register their face." : "Request rejected.");
      loadReverifyRequests();
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to process request.");
    }
  };
  const handleTeacherFaceReg = async (descriptor: Float32Array, photo: string) => {
    if (!user) return;
    try {
      await apiFetch("/api/face/register", {
        method: "POST",
        body: JSON.stringify({ role: "teacher", user_id: user.id, descriptor: Array.from(descriptor), photo }),
      });
      setTeacherFaceRegistered(true);
      setShowTeacherFaceReg(false);
      addToast("success", "Registered", "Your face has been registered.");
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to register face.");
    }
  };

  const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    const ampm = hr >= 12 ? "PM" : "AM";
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${ampm}`;
  };

  if (loading) {
    return <div className="page__content"><h1>Face Verification Attendance</h1><p>Loading...</p></div>;
  }

  // Detail view for a selected session
  if (selectedSession) {
    return (
      <div className="page__content">
        <div className="page-header">
          <div>
            <button className="button button--secondary button--sm" onClick={() => { setSelectedSession(null); setVerifyStudent(null); }} style={{ marginBottom: 8 }}>
              ← Back to Sessions
            </button>
            <h1>Session Details</h1>
            <p>{selectedSession.class_name} {selectedSession.section} — {new Date(selectedSession.session_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`button ${selectedSession.is_active ? "button--danger" : "button--success"} button--sm`}
              onClick={() => toggleActive(selectedSession).then(() => {
                setSelectedSession(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
              })}
            >
              {selectedSession.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>

        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card stat-card--blue">
            <div className="stat-card__body">
              <span className="stat-card__value">{formatTime(selectedSession.start_time)} - {formatTime(selectedSession.end_time)}</span>
              <span className="stat-card__label">Time Window</span>
            </div>
          </div>
          <div className="stat-card stat-card--green">
            <div className="stat-card__body">
              <span className="stat-card__value">{sessionLog.length}</span>
              <span className="stat-card__label">Verified</span>
            </div>
          </div>
          <div className="stat-card stat-card--red">
            <div className="stat-card__body">
              <span className="stat-card__value">{unverified.length}</span>
              <span className="stat-card__label">Unverified</span>
            </div>
          </div>
          <div className="stat-card stat-card--orange">
            <div className="stat-card__body">
              <span className="stat-card__value">{selectedSession.is_active ? "Active" : selectedSession.auto_activate ? "Auto" : "Inactive"}</span>
              <span className="stat-card__label">Status</span>
            </div>
          </div>
        </div>

        {loadingDetail ? <div className="card"><p>Loading...</p></div> : (
          <>
            {/* Verified Students */}
            <div className="card table-card" style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16 }}>
                <span style={{ color: "#10b981" }}>✓</span> Verified Students ({sessionLog.length})
              </h3>
              {sessionLog.length === 0 ? (
                <p className="text-muted">No students verified yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>#</th><th>Student</th><th>Verified At</th><th>Confidence</th><th>Method</th></tr>
                    </thead>
                    <tbody>
                      {sessionLog.map((l, i) => (
                        <tr key={l.log_id}>
                          <td>{i + 1}</td>
                          <td><strong>{l.first_name} {l.last_name}</strong><br/><span className="text-muted" style={{ fontSize: 12 }}>{l.email}</span></td>
                          <td>{new Date(l.verified_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                          <td><span className={`badge ${l.confidence >= 0.7 ? "badge--green" : "badge--orange"}`}>{(l.confidence * 100).toFixed(1)}%</span></td>
                          <td><span className={`badge ${l.method === "teacher" ? "badge--blue" : "badge--green"}`}>{l.method === "teacher" ? "Teacher" : "Self"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Unverified Students */}
            <div className="card table-card">
              <h3 style={{ marginBottom: 16 }}>
                <span style={{ color: "#ef4444" }}>✗</span> Unverified Students ({unverified.length})
              </h3>
              {unverified.length === 0 ? (
                <p className="text-muted">All students verified!</p>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>#</th><th>Student</th><th>Face Registered</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {unverified.map((s, i) => (
                        <tr key={s.student_id}>
                          <td>{i + 1}</td>
                          <td><strong>{s.first_name} {s.last_name}</strong><br/><span className="text-muted" style={{ fontSize: 12 }}>{s.email}</span></td>
                          <td>
                            {s.face_registered
                              ? <span className="badge badge--green">Yes</span>
                              : <span className="badge badge--red">No</span>}
                          </td>
                          <td>
                            {teacherFaceRegistered ? (
                              <button className="button button--primary button--sm" onClick={() => setVerifyStudent(s)}>
                                Verify with Face
                              </button>
                            ) : (
                              <span className="text-muted" style={{ fontSize: 12 }}>Register your face first</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Teacher verify modal */}
            {verifyStudent && (
              <div className="modal-backdrop" onClick={() => setVerifyStudent(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                  <div className="modal__header">
                    <h2>Verify Student: {verifyStudent.first_name} {verifyStudent.last_name}</h2>
                    <button className="modal__close" onClick={() => setVerifyStudent(null)}>×</button>
                  </div>
                  <div className="modal__body">
                    <p className="text-muted">Verify your identity to mark this student as present.</p>
                    <FaceCamera
                      onDescriptor={handleTeacherVerify}
                      onError={(msg) => addToast("error", "Error", msg)}
                      buttonLabel="Verify My Face & Mark Student Present"
                      compact
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page__content">
      <div className="page-header">
        <div>
          <h1>Face Verification Attendance</h1>
          <p>Create and manage camera-verified attendance sessions for your classes.</p>
        </div>
      </div>

      {/* Teacher Face Registration Alert */}
      {!teacherFaceRegistered && (
        <div className="card cv-att__alert cv-att__alert--warning" style={{ marginBottom: 24 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>Register Your Face</strong>
            <p>To verify students manually, you need to register your own face first.</p>
            <button className="button button--primary button--sm" onClick={() => setShowTeacherFaceReg(true)} style={{ marginTop: 8 }}>
              Register Face Now
            </button>
          </div>
        </div>
      )}

      {showTeacherFaceReg && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Register Your Face</h3>
          <FaceCamera
            onDescriptor={handleTeacherFaceReg}
            onError={(msg) => addToast("error", "Error", msg)}
            buttonLabel="Register My Face"
            compact
          />
          <button className="button button--secondary button--sm" onClick={() => setShowTeacherFaceReg(false)} style={{ marginTop: 12 }}>Cancel</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        <button className={`tab-btn${tab === "sessions" ? " tab-btn--active" : ""}`} onClick={() => setTab("sessions")}>
          Sessions {sessions.length > 0 && <span className="tab-bar__badge">{sessions.length}</span>}
        </button>
        <button className={`tab-btn${tab === "create" ? " tab-btn--active" : ""}`} onClick={() => setTab("create")}>
          + Create Session
        </button>
        <button className={`tab-btn${tab === "reverify" ? " tab-btn--active" : ""}`} onClick={() => setTab("reverify")}>
          Re-verify Requests {reverifyRequests.filter(r => r.status === "pending").length > 0 && <span className="tab-bar__badge">{reverifyRequests.filter(r => r.status === "pending").length}</span>}
        </button>
      </div>

      {tab === "create" && (
        <div className="card">
          <h3>Create New Session</h3>
          <form onSubmit={handleCreate} className="form cv-form">
            <div className="cv-form__grid">
              <label>
                Class *
                <select value={form.class_id} onChange={(e) => setForm(f => ({ ...f, class_id: e.target.value }))} required>
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c.class_id} value={c.class_id}>{c.class_name} - {c.section} (Grade {c.grade})</option>
                  ))}
                </select>
              </label>
              <label>
                Date *
                <input type="date" value={form.session_date} onChange={(e) => setForm(f => ({ ...f, session_date: e.target.value }))} required />
              </label>
              <label>
                Start Time *
                <input type="time" value={form.start_time} onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))} required />
              </label>
              <label>
                End Time *
                <input type="time" value={form.end_time} onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))} required />
              </label>
              <label>
                Late Threshold (minutes)
                <input type="number" min={0} max={120} value={form.allow_late_minutes} onChange={(e) => setForm(f => ({ ...f, allow_late_minutes: Number(e.target.value) }))} />
              </label>
              <label className="cv-form__checkbox">
                <input type="checkbox" checked={form.auto_activate} onChange={(e) => setForm(f => ({ ...f, auto_activate: e.target.checked }))} />
                Auto-activate within time window
              </label>
            </div>
            <div style={{ marginTop: 20 }}>
              <button className="button button--primary" disabled={creating}>
                {creating ? "Creating..." : "Create Session"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "reverify" && (
        <div className="card table-card">
          <h3 style={{ marginBottom: 16 }}>Face Re-verify Requests</h3>
          {loadingReverify ? (
            <p>Loading...</p>
          ) : reverifyRequests.length === 0 ? (
            <div className="empty-state">
              <h3>No pending requests</h3>
              <p>All re-verify requests have been processed.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Student</th><th>Current Photo</th><th>Reason</th><th>Requested</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {reverifyRequests.map((r, i) => (
                    <tr key={r.request_id}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{r.first_name} {r.last_name}</strong>
                        <br /><span className="text-muted" style={{ fontSize: 12 }}>{r.email}</span>
                      </td>
                      <td>
                        {r.face_photo ? (
                          <img src={r.face_photo} alt="Face" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td style={{ maxWidth: 250, fontSize: 13 }}>{r.reason}</td>
                      <td style={{ fontSize: 13 }}>{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="button button--success button--sm" onClick={() => handleReverifyAction(r.request_id, "approved")}>Approve</button>
                          <button className="button button--danger button--sm" onClick={() => handleReverifyAction(r.request_id, "rejected")}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "sessions" && (
        <>
          {sessions.length === 0 ? (
            <div className="empty-state card">
              <h3>No sessions yet</h3>
              <p>Create a face verification session to get started.</p>
              <button className="button button--primary" onClick={() => setTab("create")}>Create Session</button>
            </div>
          ) : (
            <div className="cv-sessions__grid">
              {sessions.map(s => {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                const today = `${y}-${m}-${d}`;
                const sDate = typeof s.session_date === "string" ? s.session_date.slice(0, 10) : new Date(s.session_date).toISOString().slice(0, 10);
                const isToday = sDate === today;
                const isPast = sDate < today;

                return (
                  <div key={s.session_id} className={`card cv-session-card${s.is_active ? " cv-session-card--active" : isPast ? " cv-session-card--past" : ""}`}>
                    <div className="cv-session-card__header">
                      <div>
                        <h4>{s.class_name} {s.section} <span className="text-muted">(Grade {s.grade})</span></h4>
                        <span className="text-muted" style={{ fontSize: 13 }}>
                          {new Date(s.session_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {s.is_active && <span className="badge badge--green cv-pulse">LIVE</span>}
                        {!s.is_active && s.auto_activate && isToday && <span className="badge badge--blue">Auto</span>}
                        {isPast && !s.is_active && <span className="badge badge--muted">Ended</span>}
                      </div>
                    </div>

                    <div className="cv-session-card__body">
                      <div className="cv-session-card__time">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {formatTime(s.start_time)} — {formatTime(s.end_time)}
                      </div>
                      <div className="cv-session-card__stats">
                        <span>{s.verified_count || 0} verified</span>
                        {s.allow_late_minutes > 0 && <span>Late: {s.allow_late_minutes}min</span>}
                      </div>
                    </div>

                    <div className="cv-session-card__actions">
                      <button className="button button--sm button--secondary" onClick={() => openDetail(s)}>View Details</button>
                      <button
                        className={`button button--sm ${s.is_active ? "button--danger" : "button--success"}`}
                        onClick={() => toggleActive(s)}
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
                      {!s.is_active && (
                        <button className="button button--sm button--danger" onClick={() => deleteSession(s.session_id)}>Delete</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
