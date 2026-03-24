import { useState, useEffect } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import FaceCamera from "../../components/FaceCamera";

export default function StudentFaceRegister() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Re-verify request state
  const [reverifyRequest, setReverifyRequest] = useState<{
    has_request: boolean;
    request?: { request_id: number; status: string; reason: string; created_at: string; reviewer_first?: string; reviewer_last?: string };
  } | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiFetch<{ face_registered: boolean; face_photo: string | null }>(
        `/api/face/status?role=student&user_id=${user.id}`
      ),
      apiFetch<{ has_request: boolean; request?: any }>(
        `/api/face/reverify-request/status?student_id=${user.id}`
      ),
    ])
      .then(([faceData, reqData]) => {
        setFaceRegistered(faceData.face_registered);
        setFacePhoto(faceData.face_photo);
        setReverifyRequest(reqData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleCapture = async (descriptor: Float32Array, photo: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await apiFetch("/api/face/register", {
        method: "POST",
        body: JSON.stringify({
          role: "student",
          user_id: user.id,
          descriptor: Array.from(descriptor),
          photo,
        }),
      });
      setFaceRegistered(true);
      setFacePhoto(photo);
      setShowCamera(false);
      addToast("success", "Face Registered", "Your face has been registered successfully for attendance verification.");
    } catch (err) {
      addToast("error", "Registration Failed", err instanceof Error ? err.message : "Failed to register face.");
    } finally {
      setSaving(false);
    }
  };

  const submitReverifyRequest = async () => {
    if (!user || !requestReason.trim()) return;
    setSubmittingRequest(true);
    try {
      await apiFetch("/api/face/reverify-request", {
        method: "POST",
        body: JSON.stringify({ student_id: user.id, reason: requestReason.trim() }),
      });
      addToast("success", "Request Sent", "Your re-verify request has been sent to the teacher for approval.");
      setShowRequestForm(false);
      setRequestReason("");
      setReverifyRequest({ has_request: true, request: { request_id: 0, status: "pending", reason: requestReason.trim(), created_at: new Date().toISOString() } });
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="page__content">
        <h1>Face Verification</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page__content">
      <div className="page-header">
        <div>
          <h1>Face Verification</h1>
          <p>Register your face for camera-verified attendance marking.</p>
        </div>
      </div>

      <div className="face-reg-grid">
        {/* Status Card */}
        <div className="card face-reg__status-card">
          <div className="face-reg__status-header">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={faceRegistered ? "#10b981" : "#f59e0b"} strokeWidth="2" strokeLinecap="round">
              {faceRegistered ? (
                <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
              ) : (
                <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
              )}
            </svg>
            <div>
              <h3 style={{ margin: 0 }}>
                {faceRegistered ? "Face Registered" : "Face Not Registered"}
              </h3>
              <p className="text-muted" style={{ margin: "4px 0 0" }}>
                {faceRegistered
                  ? "Your face is registered. You can use camera verification for attendance."
                  : "You need to register your face to use camera-verified attendance."}
              </p>
            </div>
          </div>

          {facePhoto && (
            <div className="face-reg__photo-preview">
              <img src={facePhoto} alt="Registered face" />
              <span className="badge badge--green">{faceRegistered ? "Verified & Locked" : "Registered"}</span>
            </div>
          )}

          {faceRegistered ? (
            <>
              <div className="face-reg__locked" style={{ marginTop: 16, padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ color: "#15803d", fontSize: 14 }}>Your face is verified and locked. It cannot be changed.</span>
              </div>

              {/* Re-verify request section */}
              {reverifyRequest?.has_request && reverifyRequest.request?.status === "pending" ? (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <strong style={{ color: "#92400e", fontSize: 14 }}>Re-verify Request Pending</strong>
                  </div>
                  <p style={{ color: "#78716c", fontSize: 13, margin: 0 }}>Your request to change your face is awaiting teacher approval.</p>
                </div>
              ) : reverifyRequest?.has_request && reverifyRequest.request?.status === "rejected" ? (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <strong style={{ color: "#991b1b", fontSize: 14 }}>Re-verify Request Rejected</strong>
                  </div>
                  <p style={{ color: "#78716c", fontSize: 13, margin: "0 0 8px" }}>Your previous request was rejected.</p>
                  <button className="button button--secondary button--sm" onClick={() => setShowRequestForm(true)}>Request Again</button>
                </div>
              ) : (
                <button
                  className="button button--secondary button--sm"
                  onClick={() => setShowRequestForm(true)}
                  style={{ marginTop: 12 }}
                >
                  Request Face Change
                </button>
              )}

              {showRequestForm && (
                <div style={{ marginTop: 12, padding: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                  <h4 style={{ margin: "0 0 8px" }}>Request to Re-verify Face</h4>
                  <p className="text-muted" style={{ fontSize: 13, margin: "0 0 12px" }}>Provide a reason for why you need to change your registered face. A teacher will review your request.</p>
                  <textarea
                    placeholder="e.g. My appearance has changed significantly, wrong photo captured..."
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    style={{ width: "100%", minHeight: 80, padding: 10, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, resize: "vertical" }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button className="button button--primary button--sm" onClick={submitReverifyRequest} disabled={submittingRequest || !requestReason.trim()}>
                      {submittingRequest ? "Submitting..." : "Submit Request"}
                    </button>
                    <button className="button button--secondary button--sm" onClick={() => { setShowRequestForm(false); setRequestReason(""); }}>Cancel</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button
              className="button button--primary"
              onClick={() => setShowCamera(!showCamera)}
              style={{ marginTop: 16, width: "100%" }}
            >
              {showCamera ? "Cancel" : "Register My Face"}
            </button>
          )}
        </div>

        {/* Instructions Card */}
        <div className="card face-reg__info-card">
          <h3>How it works</h3>
          <ol className="face-reg__steps">
            <li>
              <div className="face-reg__step-num">1</div>
              <div>
                <strong>Register Your Face</strong>
                <p>Look directly at the camera and capture your face. This is stored securely.</p>
              </div>
            </li>
            <li>
              <div className="face-reg__step-num">2</div>
              <div>
                <strong>Teacher Schedules Session</strong>
                <p>Your teacher will create a face verification attendance session with a time window.</p>
              </div>
            </li>
            <li>
              <div className="face-reg__step-num">3</div>
              <div>
                <strong>Verify &amp; Mark Attendance</strong>
                <p>During the session, verify your face to automatically mark your attendance.</p>
              </div>
            </li>
          </ol>

          <div className="face-reg__tips">
            <h4>Tips for best results</h4>
            <ul>
              <li>Good lighting — face the light source</li>
              <li>Remove sunglasses or face coverings</li>
              <li>Look directly at the camera</li>
              <li>Keep a neutral expression</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Camera Section */}
      {showCamera && !faceRegistered && (
        <div className="card face-reg__camera-card" style={{ marginTop: 24 }}>
          <h3>Register Your Face</h3>
          <p className="text-muted">Position your face in the frame and click capture when the green indicator appears.</p>
          {saving ? (
            <div className="face-camera__loading">
              <div className="spinner" />
              <p>Saving face data...</p>
            </div>
          ) : (
            <FaceCamera
              onDescriptor={handleCapture}
              onError={(msg) => addToast("error", "Detection Error", msg)}
              buttonLabel="Register Face"
            />
          )}
        </div>
      )}
    </div>
  );
}
