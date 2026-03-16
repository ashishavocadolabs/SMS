import { useAuth } from "../contexts/AuthContext";
import { LogoIcon, ClassesIcon, AttendanceIcon, MessagesIcon } from "../components/Icons";

export default function StudentHome() {
  const { user } = useAuth();

  return (
    <div className="page__content">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <LogoIcon size={34} />
        <h1>Welcome, {user?.firstName}</h1>
      </div>
      <p>Your student dashboard is ready.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "32px",
        }}
      >
        <div className="card card--info">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ClassesIcon size={22} />
            <h3 style={{ margin: 0 }}>Classes</h3>
          </div>
          <p>View your enrolled classes and class schedules.</p>
        </div>

        <div className="card card--info">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AttendanceIcon size={22} />
            <h3 style={{ margin: 0 }}>Attendance</h3>
          </div>
          <p>Track your attendance record and class participation.</p>
        </div>

        <div className="card card--info">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MessagesIcon size={22} />
            <h3 style={{ margin: 0 }}>Messages</h3>
          </div>
          <p>Communicate with your teachers and classmates.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "32px", maxWidth: "600px" }}>
        <h2>Quick Facts</h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <li style={{ paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
            <strong>Email:</strong> {user?.email}
          </li>
          <li>Use the sidebar to navigate to different sections of your dashboard.</li>
        </ul>
      </div>
    </div>
  );
}
