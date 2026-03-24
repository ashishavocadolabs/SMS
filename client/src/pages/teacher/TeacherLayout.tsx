import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/Sidebar";
import PanelHeader from "../../components/PanelHeader";
import { useAuth } from "../../contexts/AuthContext";
import {
  DashboardIcon, AttendanceIcon, BookIcon, ChaptersIcon,
  NotesIcon, VideoIcon, LectureIcon, TestIcon, ChartIcon,
  StudentsIcon, SettingsIcon, CameraIcon,
} from "../../components/Icons";

export default function TeacherLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const name = user?.firstName ?? "Teacher";
  const lastName = user?.lastName ?? "";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="layout">
      <Sidebar
        title={name}
        subtitle="Teacher Portal"
        items={[
          { label: "Dashboard", to: "/teacher", icon: <DashboardIcon size={18} /> },
          { label: "Students", to: "/teacher/students", icon: <StudentsIcon size={18} /> },
          { label: "Attendance", to: "/teacher/attendance", icon: <AttendanceIcon size={18} /> },
          { label: "Face Attendance", to: "/teacher/face-attendance", icon: <CameraIcon size={18} /> },
          { label: "Subjects", to: "/teacher/subjects", icon: <BookIcon size={18} /> },
          { label: "Chapters", to: "/teacher/chapters", icon: <ChaptersIcon size={18} /> },
          { label: "Notes", to: "/teacher/notes", icon: <NotesIcon size={18} /> },
          { label: "Videos", to: "/teacher/videos", icon: <VideoIcon size={18} /> },
          { label: "Lectures", to: "/teacher/lectures", icon: <LectureIcon size={18} /> },
          { label: "MCQ Tests", to: "/teacher/tests", icon: <TestIcon size={18} /> },
          { label: "Performance", to: "/teacher/performance", icon: <ChartIcon size={18} /> },
          { label: "Settings", to: "/teacher/settings", icon: <SettingsIcon size={18} /> },
        ]}
        onLogout={handleLogout}
      />

      <div className="layout__content">
        <PanelHeader userName={name} userLastName={lastName} portalLabel="Teacher Portal" />
        <main className="layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


