import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";

export default function StudentLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="layout">
      <Sidebar
        title={`Student: ${user?.firstName ?? ""}`}
        items={[
          { label: "Dashboard", to: "/student" },
          { label: "Attendance", to: "/student/attendance" },
        ]}
        onLogout={handleLogout}
      />

      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
}
