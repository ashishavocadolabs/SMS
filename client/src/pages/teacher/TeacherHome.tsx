import { useAuth } from "../../contexts/AuthContext";
import { LogoIcon, AttendanceIcon, ClassesIcon, ReportIcon } from "../../components/Icons";

export default function TeacherHome() {
  const { user } = useAuth();

  return (
    <div className="page__content"> <div style={{ display: "flex", alignItems: "center", gap: "12px" }}> <LogoIcon size={34} /> <h1>Welcome, {user?.firstName}</h1> </div> <p>Your teacher dashboard is ready to use.</p> <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "32px",
        }}
      > <div className="card card--info"> <div style={{ display: "flex", alignItems: "center", gap: "10px" }}> <AttendanceIcon size={22} /> <h3 style={{ margin: 0 }}>Record Attendance</h3> </div> <p>Mark attendance for your students in each class session.</p> <p style={{ fontSize: "12px", marginTop: "8px", color: "var(--muted)" }}>
            Navigate to the Attendance section
          </p> </div> <div className="card card--info"> <div style={{ display: "flex", alignItems: "center", gap: "10px" }}> <ClassesIcon size={22} /> <h3 style={{ margin: 0 }}>Class Management</h3> </div> <p>Manage your classes, students, and schedules.</p> <p style={{ fontSize: "12px", marginTop: "8px", color: "var(--muted)" }}>
            Coming soon
          </p> </div> <div className="card card--info"> <div style={{ display: "flex", alignItems: "center", gap: "10px" }}> <ReportIcon size={22} /> <h3 style={{ margin: 0 }}>Reports</h3> </div> <p>Generate attendance and performance reports.</p> <p style={{ fontSize: "12px", marginTop: "8px", color: "var(--muted)" }}>
            Coming soon
          </p> </div> </div> <div className="card" style={{ marginTop: "32px", maxWidth: "600px" }}> <h2>Quick Start</h2> <ol style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "12px" }}> <li>Go to the <strong>Attendance</strong> section using the sidebar</li> <li>Select a student from your class</li> <li>Choose the class and date</li> <li>Mark their attendance status (Present, Absent, or Late)</li> <li>Submit to save the record</li> </ol> </div> <div className="card card--success" style={{ marginTop: "16px" }}> <p> <strong>Need help?</strong> Contact your school administrator for support.
        </p> </div> </div>
  );
}


