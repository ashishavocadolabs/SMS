import React, { useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function Settings() {
  const { user, login } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const isStudent = user.role === "student";
  const endpoint = isStudent
    ? `/api/students/${user.id}/settings`
    : `/api/teachers/${user.id}/settings`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      addToast("error", "Validation Error", "New passwords do not match.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      addToast("error", "Validation Error", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword && !currentPassword) {
      addToast("error", "Validation Error", "Enter your current password to change it.");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = { email };
      if (phone) body.phone = phone;
      if (currentPassword) body.current_password = currentPassword;
      if (newPassword) body.new_password = newPassword;

      const updated = await apiFetch<any>(endpoint, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      // update auth context
      login(user.role, {
        ...user,
        email: updated.email ?? user.email,
      });

      addToast("success", "Settings Saved", "Your settings have been updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to save settings.");
    }
    setSaving(false);
  };

  return (
    <div className="page__content">
      <div className="page-header">
        <div>
          <h1>Account Settings</h1>
          <p>Update your profile and security</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card settings-card">
          <h3 className="settings-card__title">Profile Information</h3>
          <form onSubmit={handleSubmit} className="form">
            <div className="settings-row">
              <label>
                Full Name
                <input
                  type="text"
                  value={`${user.firstName} ${user.lastName}`}
                  disabled
                  style={{ opacity: 0.6 }}
                />
                <span>Name cannot be changed. Contact admin.</span>
              </label>
            </div>

            <div className="settings-row">
              <label>
                Email Address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={saving}
                />
              </label>
            </div>

            <div className="settings-row">
              <label>
                Phone Number
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  disabled={saving}
                />
              </label>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "8px 0" }} />

            <h3 className="settings-card__title">Change Password</h3>

            <div className="settings-row">
              <label>
                Current Password
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={saving}
                  autoComplete="current-password"
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <label>
                New Password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  disabled={saving}
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirm New Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  disabled={saving}
                  autoComplete="new-password"
                />
              </label>
            </div>

            <button
              className="button button--primary"
              disabled={saving}
              style={{ alignSelf: "flex-start" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
