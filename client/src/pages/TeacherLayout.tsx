import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";

export default function TeacherLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="layout">
      <Sidebar
        title={`Teacher: ${user?.firstName ?? ""}`}
        items={[
          { label: "Dashboard", to: "/teacher" },
          { label: "Attendance", to: "/teacher/attendance" },
        ]}
        onLogout={handleLogout}
      />

      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
}
