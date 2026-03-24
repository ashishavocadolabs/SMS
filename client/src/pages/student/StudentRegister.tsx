import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";
import type { StudentRecord } from "../../types";

export default function StudentRegister() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

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
      await apiFetch<StudentRecord>("/api/students", {
        method: "POST",
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone || null,
          password: form.password,
        }),
      });

      setRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <main className="page page--auth">
        <div className="card" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1>Registration Submitted</h1>
          <p style={{ color: "#64748b", margin: "12px 0 24px" }}>
            Your account has been created and is pending approval from your teacher. 
            You will be able to log in once approved.
          </p>
          <Link to="/student/login" className="button button--primary">
            Back to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page page--auth"> <div className="card" style={{ maxWidth: 480, width: "100%" }}> <h1>Create Student Account</h1> <p style={{ color: "#64748b", marginBottom: 24 }}>
          Join the school portal — it takes less than a minute.
        </p> <form onSubmit={handleSubmit} className="form"> <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}> <label>
              First Name *
              <input value={form.firstName} onChange={set("firstName")} required placeholder="Jane" disabled={loading} /> </label> <label>
              Last Name *
              <input value={form.lastName} onChange={set("lastName")} required placeholder="Doe" disabled={loading} /> </label> </div> <label>
            Email Address *
            <input type="email" value={form.email} onChange={set("email")} required placeholder="you@school.edu" disabled={loading} /> </label> <label>
            Phone Number (optional)
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+92 300 0000000" disabled={loading} /> </label> <label>
            Password *
            <input type="password" value={form.password} onChange={set("password")} required placeholder="Min. 6 characters" disabled={loading} /> </label> <label>
            Confirm Password *
            <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required placeholder="Re-enter password" disabled={loading} /> </label>

          {error && <div className="form__error"> {error}</div>}

          <button className="button button--primary button--full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button> <div className="form__footer"> <span>Already registered?</span> <Link to="/student/login" className="link">Sign in instead</Link> </div> </form> </div> </main>
  );
}


