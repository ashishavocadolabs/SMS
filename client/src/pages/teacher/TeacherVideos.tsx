import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import type { VideoRecord, SubjectRecord, ChapterRecord } from "../../types";

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

export default function TeacherVideos() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VideoRecord | null>(null);
  const [form, setForm] = useState({ chapter_id: "", title: "", video_url: "", description: "", duration_minutes: "" });


  const loadVideos = (subjectId?: string, chapterId?: string) => {
    let qs = "";
    if (chapterId) qs = `?chapter_id=${chapterId}`;
    else if (subjectId) qs = `?subject_id=${subjectId}`;
    apiFetch<VideoRecord[]>(`/api/videos${qs}`).then(setVideos).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([apiFetch<SubjectRecord[]>("/api/subjects"), apiFetch<ChapterRecord[]>("/api/chapters")])
      .then(([s, ch]) => { setSubjects(s); setChapters(ch); }).catch(() => {});
    loadVideos();
  }, []);

  useEffect(() => { loadVideos(filterSubject, filterChapter); }, [filterSubject, filterChapter]);

  const filteredChapters = filterSubject ? chapters.filter(c => String(c.subject_id) === filterSubject) : chapters;

  const reset = () => { setForm({ chapter_id: "", title: "", video_url: "", description: "", duration_minutes: "" }); setEditing(null); setShowForm(false); };

  const openEdit = (v: VideoRecord) => { setEditing(v); setForm({ chapter_id: String(v.chapter_id), title: v.title, video_url: v.video_url, description: v.description ?? "", duration_minutes: String(v.duration_minutes ?? "") }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = { ...form, chapter_id: Number(form.chapter_id), duration_minutes: Number(form.duration_minutes) || 0, created_by: user?.id };
      if (editing) {
        await apiFetch(`/api/videos/${editing.video_id}`, { method: "PUT", body: JSON.stringify(body) });
        addToast("success", "Video Updated", "Video has been updated.");
      } else {
        await apiFetch("/api/videos", { method: "POST", body: JSON.stringify(body) });
        addToast("success", "Video Added", "New video has been added.");
      }
      loadVideos(filterSubject, filterChapter); reset();
    } catch (err) {
      addToast("error", "Error", err instanceof Error ? err.message : "Failed to save video.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this video?")) return;
    try {
      await apiFetch(`/api/videos/${id}`, { method: "DELETE" });
      addToast("success", "Video Deleted", "Video has been removed.");
      loadVideos(filterSubject, filterChapter);
    } catch { addToast("error", "Error", "Failed to delete video."); }
  };

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>Subject Videos</h1> <p>Add YouTube / external video links for chapter-wise learning.</p> </div> <button className="button button--primary" onClick={() => { reset(); setShowForm(true); }}>+ Add Video</button> </div>

      <div className="filter-bar card"> <label>Filter by Subject
          <select value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setFilterChapter(""); }}> <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select> </label> <label>Filter by Chapter
          <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)} disabled={!filterSubject}> <option value="">All Chapters</option>
            {filteredChapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>Ch.{c.chapter_number}: {c.chapter_title}</option>)}
          </select> </label> </div>

      {showForm && (
        <div className="modal-overlay" onClick={reset}> <div className="modal" onClick={e => e.stopPropagation()}> <div className="modal__header"> <h3>{editing ? "Edit Video" : "Add Video"}</h3> <button className="modal__close" onClick={reset}>✕</button> </div> <form className="form" onSubmit={handleSubmit}> <label>Chapter *
                <select value={form.chapter_id} onChange={e => setForm(f => ({...f, chapter_id: e.target.value}))} required> <option value="">-- Select Chapter --</option>
                  {chapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>[{c.subject_name}] Ch.{c.chapter_number}: {c.chapter_title}</option>)}
                </select> </label> <label>Video Title *
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="e.g. Algebra Basics - Part 1" /> </label> <label>Video URL *
                <input value={form.video_url} onChange={e => setForm(f => ({...f, video_url: e.target.value}))} required placeholder="https://www.youtube.com/watch?v=..." /> </label> <div className="form-row"> <label>Duration (minutes)
                  <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({...f, duration_minutes: e.target.value}))} placeholder="30" min="0" /> </label> </div> <label>Description
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief description of the video" rows={3} /> </label> <div className="form-actions"> <button type="button" className="button button--secondary" onClick={reset}>Cancel</button> <button type="submit" className="button button--primary">{editing ? "Update" : "Add"} Video</button> </div> </form> </div> </div>
      )}

      {loading ? (
        <div className="card"><p>Loading videos...</p></div>
      ) : videos.length === 0 ? (
        <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No videos yet</h3> <p>Add YouTube videos for each chapter</p> </div>
      ) : (
        <div className="video-grid">
          {videos.map(v => {
            const ytId = getYouTubeId(v.video_url);
            return (
              <div key={v.video_id} className="video-card">
                {ytId ? (
                  <div className="video-card__thumb"> <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={v.title} /> <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="video-card__play">▶</a> </div>
                ) : (
                  <div className="video-card__thumb video-card__thumb--generic"> <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="video-card__play">▶</a> </div>
                )}
                <div className="video-card__body"> <div className="video-card__tags"> <span className="badge badge--blue">{v.subject_name}</span>
                    {v.chapter_title && <span className="badge badge--purple">{v.chapter_title}</span>}
                    {v.duration_minutes && v.duration_minutes > 0 && <span className="badge">{v.duration_minutes} min</span>}
                  </div> <h4 className="video-card__title">{v.title}</h4>
                  {v.description && <p className="video-card__desc">{v.description}</p>}
                  <div className="video-card__actions"> <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="button button--primary button--sm">▶ Watch</a> <button className="button button--secondary button--sm" onClick={() => openEdit(v)}>Edit</button> <button className="button button--danger button--sm" onClick={() => handleDelete(v.video_id)}>Delete</button> </div> </div> </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


