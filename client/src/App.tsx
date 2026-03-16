import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import StudentLayout from "./pages/StudentLayout";
import StudentHome from "./pages/StudentHome";
import StudentAttendance from "./pages/StudentAttendance";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherLayout from "./pages/TeacherLayout";
import TeacherHome from "./pages/TeacherHome";
import TeacherAttendance from "./pages/TeacherAttendance";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Footer from "./components/Footer";

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <main className="app__main">
          <Routes>
            <Route path="/" element={<LandingPage />} />

          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/register" element={<StudentRegister />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentHome />} />
            <Route path="attendance" element={<StudentAttendance />} />
          </Route>

          <Route path="/teacher/login" element={<TeacherLogin />} />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherHome />} />
            <Route path="attendance" element={<TeacherAttendance />} />
          </Route>

          <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}
