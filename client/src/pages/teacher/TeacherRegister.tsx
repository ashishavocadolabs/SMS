import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { TeacherRecord } from "../../types";

export default function TeacherRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialization: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const teacher = await apiFetch<TeacherRecord>("/api/teachers", {
        method: "POST",
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone || null,
          specialization: form.specialization || null,
          password: form.password,
        }),
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
      setError(err instanceof Error ? err.message : "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <main className="page page--auth"> <div className="card" style={{ maxWidth: 480, width: "100%" }}> <h1>Create Teacher Account</h1> <p style={{ color: "#64748b", marginBottom: 24 }}>
          Register as a teacher to manage your classes.
        </p> <form onSubmit={handleSubmit} className="form"> <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}> <label>
              First Name *
              <input value={form.firstName} onChange={set("firstName")} required placeholder="Ahmed" disabled={loading} /> </label> <label>
              Last Name *
              <input value={form.lastName} onChange={set("lastName")} required placeholder="Khan" disabled={loading} /> </label> </div> <label>
            Email Address *
            <input type="email" value={form.email} onChange={set("email")} required placeholder="teacher@school.edu" disabled={loading} autoComplete="email" /> </label> <label>
            Phone Number (optional)
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+92 300 0000000" disabled={loading} /> </label> <label>
            Specialization (optional)
            <input value={form.specialization} onChange={set("specialization")} placeholder="e.g. Mathematics, Physics" disabled={loading} /> </label> <label>
            Password *
            <input type="password" value={form.password} onChange={set("password")} required placeholder="Min. 6 characters" disabled={loading} autoComplete="new-password" /> </label> <label>
            Confirm Password *
            <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required placeholder="Re-enter password" disabled={loading} autoComplete="new-password" /> </label>

          {error && <div className="form__error"> {error}</div>}

          <button className="button button--primary button--full" disabled={loading}>
            {loading ? "Creating account..." : "Create Teacher Account"}
          </button> <div className="form__footer"> <span>Already have an account?</span> <Link to="/teacher/login" className="link">Sign in instead</Link> </div> </form> </div> </main>
  );
}


