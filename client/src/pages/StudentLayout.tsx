import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import PanelHeader from "../components/PanelHeader";
import { useAuth } from "../contexts/AuthContext";
import {
  DashboardIcon, AttendanceIcon, BookIcon, NotesIcon,
  VideoIcon, LectureIcon, TestIcon, ChartIcon,
} from "../components/Icons";

export default function StudentLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const name = user?.firstName ?? "Student";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="layout">
      <Sidebar
        title={name}
        subtitle="Student Portal"
        items={[
          { label: "Dashboard", to: "/student", icon: <DashboardIcon size={18} /> },
          { label: "Attendance", to: "/student/attendance", icon: <AttendanceIcon size={18} /> },
          { label: "My Subjects", to: "/student/subjects", icon: <BookIcon size={18} /> },
          { label: "Study Notes", to: "/student/notes", icon: <NotesIcon size={18} /> },
          { label: "Video Lectures", to: "/student/videos", icon: <VideoIcon size={18} /> },
          { label: "Lecture Log", to: "/student/lectures", icon: <LectureIcon size={18} /> },
          { label: "MCQ Tests", to: "/student/tests", icon: <TestIcon size={18} /> },
          { label: "My Performance", to: "/student/performance", icon: <ChartIcon size={18} /> },
        ]}
        onLogout={handleLogout}
      />

      <div className="layout__content">
        <PanelHeader userName={name} portalLabel="Student Portal" />
        <main className="layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
