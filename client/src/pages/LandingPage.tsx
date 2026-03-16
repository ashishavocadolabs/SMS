import { Link } from "react-router-dom";
import { ClassesIcon, AttendanceIcon, UsersIcon, ReportIcon, SecurityIcon, SpeedIcon } from "../components/Icons";
import Header from "../components/Header";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="page page--landing">
      <header className="hero">
        <div className="hero__copy">
          <h1 className="hero__title">Digital Pdhai</h1>
          <p className="hero__subtitle">
            A modern school management system for seamless student and teacher
            collaboration. Manage attendance, classes, and communications all in
            one place.
          </p>

          <div className="hero__actions">
            <Link className="button button--primary button--lg" to="/student/login">
              Student Login
            </Link>
            <Link className="button button--secondary button--lg" to="/teacher/login">
              Teacher Portal
            </Link>
          </div>
        </div>

        <div className="hero__stats">
          <div className="stat">
            <strong>500+</strong>
            <span>Students Enrolled</span>
          </div>
          <div className="stat">
            <strong>50+</strong>
            <span>Teachers</span>
          </div>
          <div className="stat">
            <strong>20+</strong>
            <span>Classes</span>
          </div>
          <div className="stat">
            <strong>99%</strong>
            <span>Uptime</span>
          </div>
        </div>
      </header>

      <section className="feature">
        <h2>Powerful Features for Educational Excellence</h2>
        <p>
          Everything you need to streamline school operations and improve student
          outcomes.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
            marginTop: "32px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <ClassesIcon size={20} />
              <h4 style={{ margin: 0 }}>Class Management</h4>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>
              Organize classes and manage student enrollment easily.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <AttendanceIcon size={20} />
              <h4 style={{ margin: 0 }}>Attendance Tracking</h4>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>
              Record and monitor student attendance automatically.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <UsersIcon size={20} />
              <h4 style={{ margin: 0 }}>User Management</h4>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>
              Create and manage student and teacher accounts.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <ReportIcon size={20} />
              <h4 style={{ margin: 0 }}>Reporting</h4>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>
              Generate detailed attendance and performance reports.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <SecurityIcon size={20} />
              <h4 style={{ margin: 0 }}>Secure</h4>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>
              Built with security and privacy at its core.
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: "var(--radius)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <SpeedIcon size={20} />
              <h4 style={{ margin: 0 }}>Fast & Reliable</h4>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>
              Lightning-fast performance with 99% uptime guarantee.
            </p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Get Started?</h2>
        <p>Sign in to your account or create a new one.</p>
        <div className="cta__actions">
          <Link className="button button--primary button--lg" to="/student/login">
            Student Login
          </Link>
          <Link className="button button--secondary button--lg" to="/teacher/login">
            Teacher Login
          </Link>
        </div>
      </section>
    </main>
    </>
  );
}
