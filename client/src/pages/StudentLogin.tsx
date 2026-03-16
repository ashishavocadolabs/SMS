import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../contexts/AuthContext";
import type { StudentRecord } from "../types";

export default function StudentLogin() {
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
      const students = await apiFetch<StudentRecord[]>("/api/students");
      const found = students.find(
        (s) => s.email.toLowerCase() === email.toLowerCase()
      );

      if (!found) {
        setError("Student not found. Please register first.");
        setLoading(false);
        return;
      }

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        login("student", {
          id: found.student_id,
          role: "student",
          firstName: found.first_name,
          lastName: found.last_name,
          email: found.email,
        });
        navigate("/student");
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
        <h1>Welcome back!</h1>
        <p style={{ color: "#666", marginBottom: "24px" }}>
          Sign in to your student account
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

          <div className="form__footer">
            <span>New here?</span>
            <Link to="/student/register" className="link">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
