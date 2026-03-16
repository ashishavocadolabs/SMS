import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../contexts/AuthContext";
import type { StudentRecord } from "../types";

export default function StudentRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const student = await apiFetch<StudentRecord>("/api/students", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
        }),
      });

      setTimeout(() => {
        login("student", {
          id: student.student_id,
          role: "student",
          firstName: student.first_name,
          lastName: student.last_name,
          email: student.email,
        });
        navigate("/student");
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to register at this time"
      );
      setLoading(false);
    }
  };

  return (
    <main className="page page--auth">
      <div className="card">
        <h1>Create Account</h1>
        <p style={{ color: "#666", marginBottom: "24px" }}>
          Join our school community
        </p>

        <form onSubmit={handleSubmit} className="form">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label>
              First Name
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                placeholder="Jane"
                disabled={loading}
              />
            </label>

            <label>
              Last Name
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                placeholder="Doe"
                disabled={loading}
              />
            </label>
          </div>

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

          <label>
            Phone Number (optional)
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+1 (555) 000-0000"
              disabled={loading}
            />
          </label>

          {error && <div className="form__error">⚠️ {error}</div>}

          <button
            className="button button--primary button--full"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <div className="form__footer">
            <span>Already registered?</span>
            <Link to="/student/login" className="link">
              Sign in instead
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
