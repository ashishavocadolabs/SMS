import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import type { VideoRecord, SubjectRecord, ChapterRecord } from "../../types";

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

export default function StudentVideos() {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="page__content"> <div className="page-header"> <div> <h1>Video Lectures</h1> <p>Watch chapter-wise video lessons uploaded by your teachers.</p> </div> </div> <div className="filter-bar card"> <label>Subject
          <select value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setFilterChapter(""); }}> <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
          </select> </label> <label>Chapter
          <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)} disabled={!filterSubject}> <option value="">All Chapters</option>
            {filteredChapters.map(c => <option key={c.chapter_id} value={c.chapter_id}>Ch.{c.chapter_number}: {c.chapter_title}</option>)}
          </select> </label> </div>

      {loading ? (
        <div className="card"><p>Loading videos...</p></div>
      ) : videos.length === 0 ? (
        <div className="empty-state card"> <div className="empty-state__icon"></div> <h3>No videos available</h3> <p>Your teacher hasn't added any videos yet.</p> </div>
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
                  {v.teacher_name && <p className="muted" style={{ fontSize: 12 }}>👤 {v.teacher_name}</p>}
                  <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="button button--primary button--sm" style={{ marginTop: 8 }}>▶ Watch Now</a> </div> </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


