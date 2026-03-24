import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { useToast } from "../../contexts/ToastContext";

interface StudentRow {
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  address: string | null;
  status: string;
  class_id: number | null;
  created_at: string;
}

interface ClassRow {
  class_id: number;
  class_name: string;
  section: string;
  grade: string;
}

export default function TeacherStudents() {
  const { addToast } = useToast();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [assignClass, setAssignClass] = useState<Record<number, number>>({});
  const [editStudent, setEditStudent] = useState<StudentRow | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "", phone: "", date_of_birth: "", gender: "", blood_group: "", address: "" });
  const [editSaving, setEditSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [sRes, cRes] = await Promise.allSettled([
      apiFetch<StudentRow[]>("/api/students"),
      apiFetch<ClassRow[]>("/api/classes"),
    ]);
    if (sRes.status === "fulfilled") setStudents(sRes.value);
    if (cRes.status === "fulfilled") setClasses(cRes.value);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Polling every 15s
  useEffect(() => {
    const iv = setInterval(() => {
      Promise.allSettled([
        apiFetch<StudentRow[]>("/api/students"),
        apiFetch<ClassRow[]>("/api/classes"),
      ]).then(([sRes, cRes]) => {
        if (sRes.status === "fulfilled") setStudents(sRes.value);
        if (cRes.status === "fulfilled") setClasses(cRes.value);
      });
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  const filtered = students.filter((s) => s.status === tab);

  const handleApprove = async (id: number) => {
    const class_id = assignClass[id];
    if (!class_id) {
      addToast("warning", "Select a Class", "Please assign a class before approving.");
      return;
    }
    setActionLoading(id);
    try {
      await apiFetch(`/api/students/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ status: "approved", class_id }),
      });
      addToast("success", "Student Approved", "Student has been approved and assigned to class.");
      await load();
    } catch {
      addToast("error", "Approval Failed", "Could not approve the student. Try again.");
    }
    setActionLoading(null);
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await apiFetch(`/api/students/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ status: "rejected" }),
      });
      addToast("success", "Student Rejected", "Student registration has been rejected.");
      await load();
    } catch {
      addToast("error", "Rejection Failed", "Could not reject the student.");
    }
    setActionLoading(null);
  };

  const openEdit = (s: StudentRow) => {
    setEditStudent(s);
    setEditForm({
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email,
      phone: s.phone || "",
      date_of_birth: s.date_of_birth || "",
      gender: s.gender || "",
      blood_group: s.blood_group || "",
      address: s.address || "",
    });
  };

  const handleEditSave = async () => {
    if (!editStudent) return;
    setEditSaving(true);
    try {
      await apiFetch(`/api/students/${editStudent.student_id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      addToast("success", "Student Updated", "Student details have been saved.");
      setEditStudent(null);
      await load();
    } catch {
      addToast("error", "Update Failed", "Could not save student details.");
    }
    setEditSaving(false);
  };

  const pendingCount = students.filter((s) => s.status === "pending").length;
  const approvedCount = students.filter((s) => s.status === "approved").length;
  const rejectedCount = students.filter((s) => s.status === "rejected").length;

  const getClassName = (cid: number | null) => {
    if (!cid) return null;
    const c = classes.find((cl) => cl.class_id === cid);
    return c ? `${c.class_name} ${c.section}` : null;
  };

  return (
    <div className="page__content">
      <div className="page-header">
        <div>
          <h1>Student Management</h1>
          <p>Approve registrations, assign classes, and manage student details</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div
          className={`stat-card stat-card--orange${tab === "pending" ? " stat-card--selected" : ""}`}
          style={{ cursor: "pointer" }}
          onClick={() => setTab("pending")}
        >
          <div className="stat-card__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-card__info">
            <span className="stat-card__label">Pending</span>
            <span className="stat-card__value">{pendingCount}</span>
          </div>
        </div>
        <div
          className={`stat-card stat-card--green${tab === "approved" ? " stat-card--selected" : ""}`}
          style={{ cursor: "pointer" }}
          onClick={() => setTab("approved")}
        >
          <div className="stat-card__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-card__info">
            <span className="stat-card__label">Approved</span>
            <span className="stat-card__value">{approvedCount}</span>
          </div>
        </div>
        <div
          className={`stat-card stat-card--red${tab === "rejected" ? " stat-card--selected" : ""}`}
          style={{ cursor: "pointer" }}
          onClick={() => setTab("rejected")}
        >
          <div className="stat-card__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div className="stat-card__info">
            <span className="stat-card__label">Rejected</span>
            <span className="stat-card__value">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="card table-card">
        <div className="tab-bar" style={{ marginBottom: 0, padding: "0 20px" }}>
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <button
              key={t}
              className={`tab-btn${tab === t ? " tab-btn--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "pending" && pendingCount > 0 && (
                <span className="tab-btn__badge">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading students...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3>No {tab} students</h3>
            <p>{tab === "pending" ? "All registrations have been processed." : `No students with ${tab} status.`}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Contact</th>
                  <th>Registered</th>
                  {tab === "pending" && <th>Assign Class</th>}
                  {tab === "approved" && <th>Class</th>}
                  {tab === "rejected" && <th>Status</th>}
                  <th style={{ width: 60, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.student_id}>
                    <td style={{ color: "#94a3b8", fontWeight: 600 }}>{idx + 1}</td>
                    <td>
                      <div className="student-cell">
                        <div className="student-cell__avatar">
                          {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                        </div>
                        <div>
                          <div className="student-cell__name">{s.first_name} {s.last_name}</div>
                          <div className="student-cell__email">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.phone || <span style={{ color: "#cbd5e1" }}>Not provided</span>}</td>
                    <td>{new Date(s.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    {tab === "pending" && (
                      <td>
                        <select
                          className="approval-select"
                          value={assignClass[s.student_id] || ""}
                          onChange={(e) =>
                            setAssignClass((prev) => ({
                              ...prev,
                              [s.student_id]: Number(e.target.value),
                            }))
                          }
                        >
                          <option value="">Select class</option>
                          {classes.map((c) => (
                            <option key={c.class_id} value={c.class_id}>
                              {c.class_name} {c.section}{c.grade ? ` (${c.grade})` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    {tab === "approved" && (
                      <td>
                        <span className="badge badge--blue">{getClassName(s.class_id) || "Unassigned"}</span>
                      </td>
                    )}
                    {tab === "rejected" && (
                      <td><span className="badge badge--red">Rejected</span></td>
                    )}
                    <td>
                      <div className="action-row">
                        <button
                          className="action-icon-btn action-icon-btn--edit"
                          title="Edit student details"
                          onClick={() => openEdit(s)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {tab === "pending" && (
                          <>
                            <button
                              className="action-icon-btn action-icon-btn--approve"
                              title="Approve student"
                              onClick={() => handleApprove(s.student_id)}
                              disabled={actionLoading === s.student_id}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                            <button
                              className="action-icon-btn action-icon-btn--reject"
                              title="Reject student"
                              onClick={() => handleReject(s.student_id)}
                              disabled={actionLoading === s.student_id}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </>
                        )}
                        {tab === "rejected" && (
                          <button
                            className="action-icon-btn action-icon-btn--approve"
                            title="Reconsider student"
                            onClick={async () => {
                              try {
                                await apiFetch(`/api/students/${s.student_id}/approve`, {
                                  method: "PUT",
                                  body: JSON.stringify({ status: "approved", class_id: null }),
                                });
                                addToast("success", "Student Reconsidered", "Student has been moved back to approved.");
                                await load();
                              } catch {
                                addToast("error", "Failed", "Could not reconsider student.");
                              }
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="modal-overlay" onClick={() => setEditStudent(null)}>
          <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div>
                <h3>Student Details</h3>
                <small style={{ color: "#64748b" }}>
                  {editStudent.first_name} {editStudent.last_name} — Status: <span className={`badge badge--${editStudent.status === "approved" ? "green" : editStudent.status === "rejected" ? "red" : "orange"}`} style={{ marginLeft: 4 }}>{editStudent.status}</span>
                </small>
              </div>
              <button className="modal__close" onClick={() => setEditStudent(null)}>&times;</button>
            </div>
            <div className="form" style={{ padding: "20px 24px 24px" }}>
              <div className="form-row">
                <label>
                  First Name *
                  <input type="text" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                </label>
                <label>
                  Last Name *
                  <input type="text" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Email *
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </label>
                <label>
                  Phone {!editForm.phone && <span className="field-missing">Not filled</span>}
                  <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Enter phone number" />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Date of Birth {!editForm.date_of_birth && <span className="field-missing">Not filled</span>}
                  <input type="date" value={editForm.date_of_birth} onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
                </label>
                <label>
                  Gender {!editForm.gender && <span className="field-missing">Not filled</span>}
                  <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Blood Group {!editForm.blood_group && <span className="field-missing">Not filled</span>}
                  <select value={editForm.blood_group} onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}>
                    <option value="">Select blood group</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Address {!editForm.address && <span className="field-missing">Not filled</span>}
                  <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Enter address" />
                </label>
              </div>

              {/* Approve/Reject actions inside modal for pending students */}
              {editStudent.status === "pending" && (
                <div className="modal-approval">
                  <h4 className="modal-approval__title">Registration Approval</h4>
                  <div className="modal-approval__row">
                    <label style={{ flex: 1 }}>
                      Assign Class
                      <select
                        value={assignClass[editStudent.student_id] || ""}
                        onChange={(e) => setAssignClass((prev) => ({ ...prev, [editStudent.student_id]: Number(e.target.value) }))}
                      >
                        <option value="">Select class</option>
                        {classes.map((c) => (
                          <option key={c.class_id} value={c.class_id}>
                            {c.class_name} {c.section}{c.grade ? ` (${c.grade})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="modal-approval__actions">
                      <button
                        className="button button--success"
                        onClick={() => { handleApprove(editStudent.student_id); setEditStudent(null); }}
                        disabled={actionLoading === editStudent.student_id}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Approve
                      </button>
                      <button
                        className="button button--danger"
                        onClick={() => { handleReject(editStudent.student_id); setEditStudent(null); }}
                        disabled={actionLoading === editStudent.student_id}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button className="button button--secondary" onClick={() => setEditStudent(null)}>Cancel</button>
                <button className="button button--primary" onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
