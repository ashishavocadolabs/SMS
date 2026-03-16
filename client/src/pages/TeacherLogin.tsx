import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../contexts/AuthContext";
import type { TeacherRecord } from "../types";

export default function TeacherLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const teachers = await apiFetch<TeacherRecord[]>("/api/teachers");
      const found = teachers.find(
        (t) => t.email.toLowerCase() === email.toLowerCase()
      );

      if (!found) {
        setError(
          "Teacher account not found. Please contact your administrator."
        );
        setLoading(false);
        return;
      }

      setSuccess("Welcome! Redirecting to dashboard...");
      setTimeout(() => {
        login("teacher", {
          id: found.teacher_id,
          role: "teacher",
          firstName: found.first_name,
          lastName: found.last_name,
          email: found.email,
        });
        navigate("/teacher");
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to connect to server"
      );
      setLoading(false);
    }
  };

  return (
    <main className="page page--auth">
      <div className="card">
        <h1>Teacher Portal</h1>
        <p style={{ color: "#666", marginBottom: "24px" }}>
          Access your classroom management tools
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@school.edu"
              disabled={loading}
            />
          </label>

          {error && <div className="form__error">⚠️ {error}</div>}
          {success && <div className="form__success">✓ {success}</div>}

          <button
            className="button button--primary button--full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="form__help">
            If you don't have a teacher account, please contact your school
            administrator to request access.
          </p>
        </form>
      </div>
    </main>
  );
}
