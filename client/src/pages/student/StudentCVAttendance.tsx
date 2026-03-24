import { useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import FaceCamera from "../../components/FaceCamera";

interface Session {
  session_id: number;
  class_id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  auto_activate: boolean;
  allow_late_minutes: number;
  class_name?: string;
  section?: string;
  grade?: string;
}

export default function StudentCVAttendance() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; confidence?: number; status?: string } | null>(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      apiFetch<{ session: Session | null; already_verified: boolean }>(
        `/api/face/cv-sessions/active?student_id=${user.id}`
      ),
      apiFetch<{ face_registered: boolean }>(`/api/face/status?role=student&user_id=${user.id}`),
    ])
      .then(([sessionData, faceData]) => {
        setSession(sessionData.session);
        setAlreadyVerified(sessionData.already_verified);
        setFaceRegistered(faceData.face_registered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  // Auto-refresh every 15s to detect new sessions
  useEffect(() => {
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [user]);

  const handleVerify = async (descriptor: Float32Array) => {
    if (!user || !session) return;
    setVerifying(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string; confidence: number; status: string }>(
        "/api/face/cv-verify-attendance",
        {
          method: "POST",
          body: JSON.stringify({
            session_id: session.session_id,
            student_id: user.id,
            descriptor: Array.from(descriptor),
          }),
        }
      );
      setResult(res);
      setAlreadyVerified(true);
      addToast("success", "Verified!", res.message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setResult({ success: false, message: msg });
      addToast("error", "Verification Failed", msg);
    } finally {
      setVerifying(false);
    }
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    const ampm = hr >= 12 ? "PM" : "AM";
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${ampm}`;
  };

  if (loading) {
    return <div className="page__content"><h1>Face Attendance</h1><p>Loading...</p></div>;
  }

  return (
    <div className="page__content">
      <div className="page-header">
        <div>
          <h1>Face Verification Attendance</h1>
          <p>Verify your face to mark your attendance for today's session.</p>
        </div>
      </div>

      {!faceRegistered && (
        <div className="card cv-att__alert cv-att__alert--warning">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>Face Not Registered</strong>
            <p>You need to register your face before you can use face verification attendance. Go to <strong>Face Verification</strong> in the sidebar to register.</p>
          </div>
        </div>
      )}

      {!session && faceRegistered && (
        <div className="card cv-att__no-session">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h3>No Active Session</h3>
          <p>There is no face verification session active for your class right now. Your teacher will schedule one when needed.</p>
          <span className="text-muted" style={{ fontSize: 13 }}>This page auto-refreshes every 15 seconds.</span>
        </div>
      )}

      {session && !alreadyVerified && faceRegistered && (
        <>
          <div className="card cv-att__session-card">
            <div className="cv-att__session-info">
              <div className="cv-att__session-badge">
                <span className="badge badge--green">ACTIVE SESSION</span>
              </div>
              <h3>{session.class_name} {session.section}</h3>
              <div className="cv-att__session-meta">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {new Date(session.session_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {formatTime(session.start_time)} — {formatTime(session.end_time)}
                </span>
              </div>
              {session.allow_late_minutes > 0 && (
                <p className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>
                  Late threshold: {session.allow_late_minutes} minutes after start time.
                </p>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h3>Verify Your Face</h3>
            <p className="text-muted">Look at the camera and click verify when your face is detected.</p>
            {verifying ? (
              <div className="face-camera__loading"><div className="spinner" /><p>Verifying...</p></div>
            ) : (
              <FaceCamera
                onDescriptor={handleVerify}
                onError={(msg) => addToast("error", "Error", msg)}
                buttonLabel="Verify & Mark Attendance"
              />
            )}
          </div>
        </>
      )}

      {alreadyVerified && (
        <div className="card cv-att__verified">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h3>Attendance Verified!</h3>
          <p>Your face has been verified and attendance has been marked for today.</p>
          {result && result.confidence && (
            <div className="cv-att__result-details">
              <span>Confidence: <strong>{((result.confidence || 0) * 100).toFixed(1)}%</strong></span>
              <span>Status: <strong className={`badge badge--${result.status === "present" ? "green" : "orange"}`}>{result.status?.charAt(0).toUpperCase()}{result.status?.slice(1)}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
