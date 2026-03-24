import { useEffect, useState } from "react";
import { apiFetch, buildQuery } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import type { MCQTest, MCQQuestion, SubjectRecord, TestResult } from "../../types";

type View = "list" | "taking" | "result";

export default function StudentTests() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tests, setTests] = useState<MCQTest[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [myResults, setMyResults] = useState<TestResult[]>([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [activeTest, setActiveTest] = useState<MCQTest | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    const qs = filterSubject ? `?subject_id=${filterSubject}` : "";
    const rq = buildQuery({ student_id: user?.id });
    Promise.all([
      apiFetch<MCQTest[]>(`/api/mcq/tests${qs}`),
      apiFetch<SubjectRecord[]>("/api/subjects"),
      apiFetch<TestResult[]>(`/api/mcq/results${rq}`),
    ]).then(([t, s, r]) => { setTests(t); setSubjects(s); setMyResults(r); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [filterSubject, user]);

  const hasAttempted = (testId: number) => myResults.some(r => r.test_id === testId);
  const getResult = (testId: number) => myResults.find(r => r.test_id === testId);

  const startTest = async (test: MCQTest) => {
    const full = await apiFetch<MCQTest>(`/api/mcq/tests/${test.test_id}`);
    setActiveTest(full);
    setAnswers({});
    setView("taking");
  };

  const handleSubmit = async () => {
    if (!activeTest || !user) return;
    setSubmitting(true);
    try {
      const result = await apiFetch<TestResult>("/api/mcq/results", {
        method: "POST",
        body: JSON.stringify({ test_id: activeTest.test_id, student_id: user.id, answers }),
      });
      setLastResult(result);
      setView("result");
      loadData();
    } catch (err) {
      addToast("error", "Submission Failed", err instanceof Error ? err.message : "Failed to submit test.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeTests = tests.filter(t => t.is_active);

  if (view === "taking" && activeTest) {
    const questions = activeTest.questions as MCQQuestion[];
    const answered = Object.keys(answers).length;
    return (
      <div className="page__content"> <div className="page-header"> <div> <h1>{activeTest.title}</h1> <p>{activeTest.subject_name} — Duration: {activeTest.duration_minutes} min</p> </div> <div style={{ textAlign: "right" }}> <span className="badge badge--blue">{answered}/{questions.length} answered</span> </div> </div>

        <div className="quiz-container">
          {questions.map((q, i) => (
            <div key={q.question_id} className="quiz-question"> <div className="quiz-question__header"> <span className="quiz-question__num">Q{i + 1}</span> <p className="quiz-question__text">{q.question_text}</p> <span className="badge">{q.marks} mark{q.marks > 1 ? "s" : ""}</span> </div> <div className="quiz-options">
                {(["A","B","C","D"] as const).map(opt => (
                  <label
                    key={opt}
                    className={`quiz-option${answers[q.question_id] === opt ? " quiz-option--selected" : ""}`}
                  > <input
                      type="radio"
                      name={`q-${q.question_id}`}
                      value={opt}
                      checked={answers[q.question_id] === opt}
                      onChange={() => setAnswers(a => ({ ...a, [q.question_id]: opt }))}
                    /> <span className="quiz-option__letter">{opt}</span> <span>{q[`option_${opt.toLowerCase()}` as keyof MCQQuestion] as string}</span> </label>
                ))}
              </div> </div>
          ))}
        </div> <div className="quiz-footer"> <button className="button button--secondary" onClick={() => { setView("list"); setActiveTest(null); }}>Cancel</button> <button
            className="button button--primary"
            onClick={handleSubmit}
            disabled={submitting || answered < questions.length}
          >
            {submitting ? "Submitting..." : `Submit Test (${answered}/${questions.length} answered)`}
          </button> </div> </div>
    );
  }

  if (view === "result" && lastResult && activeTest) {
    const pct = lastResult.total_marks > 0 ? Math.round((lastResult.score / lastResult.total_marks) * 100) : 0;
    const grade = pct >= 85 ? "A+" : pct >= 70 ? "A" : pct >= 55 ? "B" : pct >= 40 ? "C" : "F";
    return (
      <div className="page__content"> <div className="result-page"> <div className="result-page__card card"> <div className="result-page__icon">{pct >= 70 ? "🎉" : pct >= 40 ? "👍" : "😟"}</div> <h2>{pct >= 70 ? "Excellent work!" : pct >= 40 ? "Good effort!" : "Keep practicing!"}</h2> <div className="result-page__score"> <span className="result-page__points">{lastResult.score}/{lastResult.total_marks}</span> <span className="result-page__pct">{pct}%</span> </div> <div className={`result-page__grade badge badge--${pct >= 70 ? "green" : pct >= 40 ? "orange" : "red"}`} style={{ fontSize: 16, padding: "6px 16px" }}>
              Grade: {grade}
            </div> <p className="muted">{activeTest.title} — {activeTest.subject_name}</p> <button className="button button--primary" onClick={() => { setView("list"); setActiveTest(null); setLastResult(null); }}>
              Back to Tests
            </button> </div> </div> </div>
    );
  }

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>MCQ Tests</h1> <p>Take weekly chapter-wise multiple choice tests.</p> </div> </div> <div className="filter-bar card"> <label>Filter by Subject
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}> <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select> </label> </div>

      {loading ? (
        <div className="card"><p>Loading tests...</p></div>
      ) : activeTests.length === 0 ? (
        <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No active tests</h3> <p>Your teacher hasn't published any tests yet.</p> </div>
      ) : (
        <div className="test-list">
          {activeTests.map(t => {
            const attempted = hasAttempted(t.test_id);
            const result = getResult(t.test_id);
            const pct = result && result.total_marks > 0 ? Math.round((result.score / result.total_marks) * 100) : 0;
            return (
              <div key={t.test_id} className="test-card"> <div className="test-card__left"> <div className="test-card__meta"> <span className="badge badge--blue">{t.subject_name}</span>
                    {t.chapter_title && <span className="badge badge--purple">{t.chapter_title}</span>}
                    <span className="badge badge--orange">Week {t.week_number}</span> </div> <h3 className="test-card__title">{t.title}</h3> <p className="test-card__info">{t.question_count ?? 0} questions • {t.duration_minutes} min</p> </div> <div className="test-card__actions">
                  {attempted ? (
                    <> <span className={`badge badge--${pct >= 70 ? "green" : pct >= 40 ? "orange" : "red"}`}>
                        Score: {result?.score}/{result?.total_marks} ({pct}%)
                      </span> <span className="badge">Completed</span> </>
                  ) : (
                    <button className="button button--primary button--sm" onClick={() => startTest(t)}>
                      Start Test →
                    </button>
                  )}
                </div> </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


