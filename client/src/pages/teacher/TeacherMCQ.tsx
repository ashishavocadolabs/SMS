import { useEffect, useState } from "react";
import { apiFetch, buildQuery } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import type { MCQTest, MCQQuestion, SubjectRecord, ChapterRecord } from "../../types";

type View = "list" | "create-test" | "add-questions" | "view-results";

export default function TeacherMCQ() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [view, setView] = useState<View>("list");
  const [tests, setTests] = useState<MCQTest[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [selectedTest, setSelectedTest] = useState<MCQTest | null>(null);
  const [loading, setLoading] = useState(true);


  // Test form
  const [testForm, setTestForm] = useState({ subject_id: "", chapter_id: "", title: "", week_number: "1", duration_minutes: "30", is_active: true });

  // Question form
  const [qForm, setQForm] = useState({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A", marks: "1" });



  const loadTests = () => {
    const q = buildQuery({ teacher_id: user?.id });
    apiFetch<MCQTest[]>(`/api/mcq/tests${q}`)
      .then(setTests).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTests();
    Promise.all([apiFetch<SubjectRecord[]>("/api/subjects"), apiFetch<ChapterRecord[]>("/api/chapters")])
      .then(([s, ch]) => { setSubjects(s); setChapters(ch); }).catch(() => {});
  }, [user]);

  const filteredChapters = testForm.subject_id ? chapters.filter(c => String(c.subject_id) === testForm.subject_id) : chapters;

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = { ...testForm, subject_id: Number(testForm.subject_id), chapter_id: testForm.chapter_id ? Number(testForm.chapter_id) : null, week_number: Number(testForm.week_number), duration_minutes: Number(testForm.duration_minutes), teacher_id: user?.id };
      const created = await apiFetch<MCQTest>("/api/mcq/tests", { method: "POST", body: JSON.stringify(body) });
      addToast("success", "Test Created", "Now add questions to this test.");
      loadTests();
      // Fetch full test with questions
      const full = await apiFetch<MCQTest>(`/api/mcq/tests/${created.test_id}`);
      setSelectedTest(full);
      setView("add-questions");
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to create test.");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    try {
      await apiFetch("/api/mcq/questions", { method: "POST", body: JSON.stringify({ ...qForm, test_id: selectedTest.test_id, marks: Number(qForm.marks) }) });
      addToast("success", "Question Added", "Question has been added to the test.");
      setQForm({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A", marks: "1" });
      // Refresh selected test
      const full = await apiFetch<MCQTest>(`/api/mcq/tests/${selectedTest.test_id}`);
      setSelectedTest(full);
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to add question.");
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!selectedTest) return;
    await apiFetch(`/api/mcq/questions/${qId}`, { method: "DELETE" });
    const full = await apiFetch<MCQTest>(`/api/mcq/tests/${selectedTest.test_id}`);
    setSelectedTest(full);
  };

  const handleDeleteTest = async (testId: number) => {
    if (!confirm("Delete this test and all its questions?")) return;
    await apiFetch(`/api/mcq/tests/${testId}`, { method: "DELETE" });
    loadTests();
  };

  const openManage = async (test: MCQTest) => {
    const full = await apiFetch<MCQTest>(`/api/mcq/tests/${test.test_id}`);
    setSelectedTest(full);
    setView("add-questions");
  };

  const toggleActive = async (test: MCQTest) => {
    await apiFetch(`/api/mcq/tests/${test.test_id}`, { method: "PUT", body: JSON.stringify({ ...test, is_active: !test.is_active }) });
    loadTests();
  };

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>MCQ Tests</h1> <p>Create weekly chapter-wise multiple choice question tests.</p> </div>
        {view === "list" && (
          <button className="button button--primary" onClick={() => { setTestForm({ subject_id: "", chapter_id: "", title: "", week_number: "1", duration_minutes: "30", is_active: true }); setView("create-test"); }}>
            + Create Test
          </button>
        )}
        {view !== "list" && (
          <button className="button button--secondary" onClick={() => { setView("list"); setSelectedTest(null); }}>
            ← Back to Tests
          </button>
        )}
      </div>



      {view === "list" && (
        loading ? <div className="card"><p>Loading tests...</p></div> :
        tests.length === 0 ? (
          <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No tests yet</h3> <p>Create your first MCQ test</p> </div>
        ) : (
          <div className="test-list">
            {tests.map(t => (
              <div key={t.test_id} className="test-card"> <div className="test-card__left"> <div className="test-card__meta"> <span className="badge badge--blue">{t.subject_name}</span>
                    {t.chapter_title && <span className="badge badge--purple">{t.chapter_title}</span>}
                    <span className="badge badge--orange">Week {t.week_number}</span> <span className={`badge ${t.is_active ? "badge--green" : "badge--red"}`}>{t.is_active ? "Active" : "Inactive"}</span> </div> <h3 className="test-card__title">{t.title}</h3> <p className="test-card__info">{t.question_count ?? 0} questions • {t.duration_minutes} min</p> </div> <div className="test-card__actions"> <button className="button button--secondary button--sm" onClick={() => openManage(t)}>Manage Questions</button> <button className="button button--secondary button--sm" onClick={() => toggleActive(t)}>{t.is_active ? "Deactivate" : "Activate"}</button> <button className="button button--danger button--sm" onClick={() => handleDeleteTest(t.test_id)}>Delete</button> </div> </div>
            ))}
          </div>
        )
      )}

      {view === "create-test" && (
        <div className="card" style={{ maxWidth: 600 }}> <h3 style={{ marginBottom: 16 }}>Create New MCQ Test</h3> <form className="form" onSubmit={handleCreateTest}> <label>Subject *
              <select value={testForm.subject_id} onChange={e => setTestForm(f => ({...f, subject_id: e.target.value, chapter_id: ""}))} required> <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
              </select> </label> <label>Chapter
              <select value={testForm.chapter_id} onChange={e => setTestForm(f => ({...f, chapter_id: e.target.value}))} disabled={!testForm.subject_id}> <option value="">-- Select Chapter --</option>
                {filteredChapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>Ch.{c.chapter_number}: {c.chapter_title}</option>)}
              </select> </label> <label>Test Title *
              <input value={testForm.title} onChange={e => setTestForm(f => ({...f, title: e.target.value}))} required placeholder="e.g. Week 1 — Algebra MCQ" /> </label> <div className="form-row"> <label>Week Number
                <input type="number" value={testForm.week_number} onChange={e => setTestForm(f => ({...f, week_number: e.target.value}))} min="1" /> </label> <label>Duration (minutes)
                <input type="number" value={testForm.duration_minutes} onChange={e => setTestForm(f => ({...f, duration_minutes: e.target.value}))} min="5" /> </label> </div> <div className="form-actions"> <button type="button" className="button button--secondary" onClick={() => setView("list")}>Cancel</button> <button type="submit" className="button button--primary">Create Test & Add Questions →</button> </div> </form> </div>
      )}

      {view === "add-questions" && selectedTest && (
        <div className="mcq-editor"> <div className="mcq-editor__test-info card"> <h3>{selectedTest.title}</h3> <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}> <span className="badge badge--blue">{selectedTest.subject_name}</span>
              {selectedTest.chapter_title && <span className="badge badge--purple">{selectedTest.chapter_title}</span>}
              <span className="badge badge--orange">Week {selectedTest.week_number}</span> <span className="badge">{selectedTest.duration_minutes} min</span> <span className="badge badge--green">{selectedTest.questions?.length ?? 0} questions</span> </div> </div> <div className="mcq-editor__body"> <div className="card"> <h4 style={{ marginBottom: 16 }}>Add Question</h4> <form className="form" onSubmit={handleAddQuestion}> <label>Question Text *
                  <textarea value={qForm.question_text} onChange={e => setQForm(f => ({...f, question_text: e.target.value}))} required placeholder="Enter the question..." rows={3} /> </label> <div className="options-grid"> <label>Option A *<input value={qForm.option_a} onChange={e => setQForm(f => ({...f, option_a: e.target.value}))} required placeholder="Option A" /></label> <label>Option B *<input value={qForm.option_b} onChange={e => setQForm(f => ({...f, option_b: e.target.value}))} required placeholder="Option B" /></label> <label>Option C *<input value={qForm.option_c} onChange={e => setQForm(f => ({...f, option_c: e.target.value}))} required placeholder="Option C" /></label> <label>Option D *<input value={qForm.option_d} onChange={e => setQForm(f => ({...f, option_d: e.target.value}))} required placeholder="Option D" /></label> </div> <div className="form-row"> <label>Correct Answer *
                    <select value={qForm.correct_option} onChange={e => setQForm(f => ({...f, correct_option: e.target.value}))}>
                      {["A","B","C","D"].map(o => <option key={o} value={o}>{o}</option>)}
                    </select> </label> <label>Marks
                    <input type="number" value={qForm.marks} onChange={e => setQForm(f => ({...f, marks: e.target.value}))} min="1" /> </label> </div> <button type="submit" className="button button--primary">+ Add Question</button> </form> </div> <div className="card"> <h4 style={{ marginBottom: 16 }}>Questions ({selectedTest.questions?.length ?? 0})</h4>
              {!selectedTest.questions?.length ? (
                <p className="muted">No questions added yet.</p>
              ) : (
                <div className="question-list">
                  {(selectedTest.questions as MCQQuestion[]).map((q, i) => (
                    <div key={q.question_id} className="question-item"> <div className="question-item__header"> <span className="question-item__num">Q{i + 1}</span> <p className="question-item__text">{q.question_text}</p> <button className="button button--danger button--sm" onClick={() => handleDeleteQuestion(q.question_id)}>✕</button> </div> <div className="question-item__options">
                        {(["a","b","c","d"] as const).map(opt => (
                          <span key={opt} className={`option-chip ${q.correct_option.toLowerCase() === opt ? "option-chip--correct" : ""}`}>
                            {opt.toUpperCase()}: {q[`option_${opt}` as keyof MCQQuestion] as string}
                          </span>
                        ))}
                      </div> <div className="question-item__marks">{q.marks} mark{q.marks > 1 ? "s" : ""}</div> </div>
                  ))}
                </div>
              )}
            </div> </div> </div>
      )}
    </div>
  );
}


