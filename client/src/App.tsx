import { Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import LandingPage from "./pages/LandingPage";
import StudentLogin from "./pages/student/StudentLogin";
import StudentRegister from "./pages/student/StudentRegister";
import StudentLayout from "./pages/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentFaceRegister from "./pages/student/StudentFaceRegister";
import StudentCVAttendance from "./pages/student/StudentCVAttendance";
import StudentSubjects from "./pages/student/StudentSubjects";
import StudentNotes from "./pages/student/StudentNotes";
import StudentVideos from "./pages/student/StudentVideos";
import StudentLectures from "./pages/student/StudentLectures";
import StudentTests from "./pages/student/StudentTests";
import StudentPerformance from "./pages/student/StudentPerformance";
import TeacherLogin from "./pages/teacher/TeacherLogin";
import TeacherRegister from "./pages/teacher/TeacherRegister";
import TeacherLayout from "./pages/teacher/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherCVAttendance from "./pages/teacher/TeacherCVAttendance";
import TeacherSubjects from "./pages/teacher/TeacherSubjects";
import TeacherChapters from "./pages/teacher/TeacherChapters";
import TeacherNotes from "./pages/teacher/TeacherNotes";
import TeacherVideos from "./pages/teacher/TeacherVideos";
import TeacherLectures from "./pages/teacher/TeacherLectures";
import TeacherMCQ from "./pages/teacher/TeacherMCQ";
import TeacherPerformance from "./pages/teacher/TeacherPerformance";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Footer from "./components/Footer";

function AppContent() {
  const location = useLocation();
  const isPanel = location.pathname.startsWith("/student") || location.pathname.startsWith("/teacher");
  const isLoginOrRegister = location.pathname.includes("/login") || location.pathname.includes("/register");
  const showFooter = !isPanel || isLoginOrRegister;

  return (
    <div className="app"> <main className="app__main"> <Routes> <Route path="/" element={<LandingPage />} /> <Route path="/student/login" element={<StudentLogin />} /> <Route path="/student/register" element={<StudentRegister />} /> <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student"> <StudentLayout /> </ProtectedRoute>
              }
            > <Route index element={<StudentDashboard />} /> <Route path="attendance" element={<StudentAttendance />} /> <Route path="face-register" element={<StudentFaceRegister />} /> <Route path="face-attendance" element={<StudentCVAttendance />} /> <Route path="subjects" element={<StudentSubjects />} /> <Route path="notes" element={<StudentNotes />} /> <Route path="videos" element={<StudentVideos />} /> <Route path="lectures" element={<StudentLectures />} /> <Route path="tests" element={<StudentTests />} /> <Route path="performance" element={<StudentPerformance />} /> <Route path="settings" element={<Settings />} /> </Route> <Route path="/teacher/login" element={<TeacherLogin />} /> <Route path="/teacher/register" element={<TeacherRegister />} /> <Route
              path="/teacher"
              element={
                <ProtectedRoute requiredRole="teacher"> <TeacherLayout /> </ProtectedRoute>
              }
            > <Route index element={<TeacherDashboard />} /> <Route path="attendance" element={<TeacherAttendance />} /> <Route path="face-attendance" element={<TeacherCVAttendance />} /> <Route path="subjects" element={<TeacherSubjects />} /> <Route path="chapters" element={<TeacherChapters />} /> <Route path="notes" element={<TeacherNotes />} /> <Route path="videos" element={<TeacherVideos />} /> <Route path="lectures" element={<TeacherLectures />} /> <Route path="tests" element={<TeacherMCQ />} /> <Route path="performance" element={<TeacherPerformance />} /> <Route path="students" element={<TeacherStudents />} /> <Route path="settings" element={<Settings />} /> </Route> <Route path="*" element={<NotFound />} /> </Routes> </main> {showFooter && <Footer />} </div>
  );
}

export default function App() {
  return (
    <AuthProvider> <ToastProvider> <AppContent /> </ToastProvider> </AuthProvider>
  );
}


