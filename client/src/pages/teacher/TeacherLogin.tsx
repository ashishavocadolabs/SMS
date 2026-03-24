import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { TeacherRecord } from "../../types";

export default function TeacherLogin() {
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
      const teacher = await apiFetch<TeacherRecord>("/api/teachers/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      login("teacher", {
        id: teacher.teacher_id,
        role: "teacher",
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        email: teacher.email,
      });
      navigate("/teacher");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="page page--auth"> <div className="card" style={{ maxWidth: 420, width: "100%" }}> <h1>Teacher Portal</h1> <p style={{ color: "#64748b", marginBottom: 24 }}>
          Access your classroom management tools
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
          </button> <div className="form__footer"> <span>New teacher?</span> <Link to="/teacher/register" className="link">Create teacher account</Link> </div> </form> </div> </main>
  );
}


