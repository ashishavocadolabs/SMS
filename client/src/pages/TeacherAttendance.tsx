import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import type { ClassEntity, StudentRecord, AttendanceStatus } from "../types";

const statuses: AttendanceStatus[] = ["present", "absent", "late"];

export default function TeacherAttendance() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [studentsData, classesData] = await Promise.all([
          apiFetch<StudentRecord[]>("/api/students"),
          apiFetch<ClassEntity[]>("/api/classes"),
        ]);
        setStudents(studentsData);
        setClasses(classesData);
      } catch (err) {
        setFeedback("Unable to load data. Please refresh the page.");
        setFeedbackType("error");
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const canSubmit = useMemo(
    () => Boolean(studentId && classId && date),
    [studentId, classId, date]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setFeedback(null);

    try {
      await apiFetch<{ success: boolean }>("/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          student_id: studentId,
          class_id: classId,
          status,
          date,
        }),
      });

      setFeedback("✓ Attendance marked successfully!");
      setFeedbackType("success");
      setStudentId(null);
      setClassId(null);
      setStatus("present");
      
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Failed to mark attendance"
      );
      setFeedbackType("error");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="page__content">
        <h1>Mark Attendance</h1>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page__content">
      <h1>Mark Attendance</h1>
      <p>Record student attendance for a specific class and date.</p>

      <div className="card" style={{ maxWidth: "600px", marginTop: "24px" }}>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Select Student
            <select
              value={studentId ?? ""}
              onChange={(event) => setStudentId(Number(event.target.value))}
              required
              disabled={loading}
            >
              <option value="" disabled>
                -- Choose a student --
              </option>
              {students.map((student) => (
                <option key={student.student_id} value={student.student_id}>
                  {student.first_name} {student.last_name} ({student.email})
                </option>
              ))}
            </select>
          </label>

          <label>
            Select Class
            <select
              value={classId ?? ""}
              onChange={(event) => setClassId(Number(event.target.value))}
              required
              disabled={loading}
            >
              <option value="" disabled>
                -- Choose a class --
              </option>
              {classes.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name} - {c.section} (Grade {c.grade})
                </option>
              ))}
            </select>
          </label>

          <label>
            Attendance Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as AttendanceStatus)
              }
              disabled={loading}
            >
              {statuses.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              disabled={loading}
            />
          </label>

          {feedback && (
            <div
              className={
                feedbackType === "success"
                  ? "form__success"
                  : "form__error"
              }
            >
              {feedback}
            </div>
          )}

          <button
            className="button button--primary button--full"
            disabled={!canSubmit || loading}
          >
            {loading ? "Saving..." : "Mark Attendance"}
          </button>
        </form>
      </div>
    </div>
  );
}
