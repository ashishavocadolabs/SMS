import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { StudentRecord } from "../../types";

export default function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const student = await apiFetch<StudentRecord>("/api/students/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      login("student", {
        id: student.student_id,
        role: "student",
        firstName: student.first_name,
        lastName: student.last_name,
        email: student.email,
      });
      navigate("/student");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="page page--auth"> <div className="card" style={{ maxWidth: 420, width: "100%" }}> <h1>Welcome back!</h1> <p style={{ color: "#64748b", marginBottom: 24 }}>
          Sign in to your student account
        </p> <form onSubmit={handleSubmit} className="form"> <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@school.edu"
              disabled={loading}
              autoComplete="email"
            /> </label> <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your password"
              disabled={loading}
              autoComplete="current-password"
            /> </label>

          {error && <div className="form__error"> {error}</div>}

          <button className="button button--primary button--full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button> <div className="form__footer"> <span>New here?</span> <Link to="/student/register" className="link">Create an account</Link> </div> </form> </div> </main>
  );
}


