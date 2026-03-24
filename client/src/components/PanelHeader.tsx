import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { BellIcon, SearchIcon } from "./Icons";
import { apiFetch } from "../api";
import { useAuth } from "../contexts/AuthContext";

interface Notification {
  notification_id: number;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

interface Props {
  userName: string;
  userLastName?: string;
  portalLabel: string;
}

const pageTitles: Record<string, string> = {
  "": "Dashboard",
  attendance: "Attendance",
  subjects: "Subjects",
  chapters: "Chapters",
  notes: "Notes",
  videos: "Video Lectures",
  lectures: "Lecture Schedule",
  tests: "MCQ Tests",
  performance: "Performance",
  students: "Students",
  settings: "Settings",
  "face-register": "Face Verification",
  "face-attendance": "Face Attendance",
};

export default function PanelHeader({ userName, userLastName, portalLabel }: Props) {
  const location = useLocation();
  const { user } = useAuth();
  const segments = location.pathname.split("/").filter(Boolean);
  const lastSegment = segments.length > 1 ? segments[segments.length - 1] : "";
  const pageTitle = pageTitles[lastSegment] ?? "Dashboard";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);

  const role = user?.role || "student";
  const userId = user?.id;

  // Fetch face photo for avatar
  useEffect(() => {
    if (!userId) return;
    apiFetch<{ face_registered: boolean; face_photo: string | null }>(
      `/api/face/status?role=${role}&user_id=${userId}`
    )
      .then((data) => { if (data.face_photo) setFacePhoto(data.face_photo); })
      .catch(() => {});
  }, [userId, role]);

  const fetchNotifs = async () => {
    if (!userId) return;
    try {
      const [notifs, countRes] = await Promise.all([
        apiFetch<Notification[]>(`/api/notifications?role=${role}&user_id=${userId}`),
        apiFetch<{ count: number }>(`/api/notifications/unread-count?role=${role}&user_id=${userId}`),
      ]);
      setNotifications(notifs);
      setUnreadCount(countRes.count);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 10000);
    return () => clearInterval(iv);
  }, [userId, role]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id: number) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: "PUT" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.notification_id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await apiFetch("/api/notifications/read-all", {
      method: "PUT",
      body: JSON.stringify({ role, user_id: userId }),
    }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <header className="panel-header">
      <div className="panel-header__left">
        <div>
          <h1 className="panel-header__title">{pageTitle}</h1>
          <p className="panel-header__breadcrumb">
            {portalLabel} / {pageTitle}
          </p>
        </div>
      </div>
      <div className="panel-header__right">
        <div className="panel-header__search">
          <SearchIcon size={16} />
          <input type="text" placeholder="Search..." readOnly />
        </div>
        <div className="notif-wrapper" ref={panelRef}>
          <button
            className="panel-header__icon-btn"
            title="Notifications"
            onClick={() => setPanelOpen(!panelOpen)}
          >
            <BellIcon size={18} />
            {unreadCount > 0 && (
              <span className="panel-header__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>
          {panelOpen && (
            <div className="notif-panel">
              <div className="notif-panel__header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button className="notif-panel__mark-all" onClick={markAllRead}>Mark all read</button>
                )}
              </div>
              <div className="notif-panel__list">
                {notifications.length === 0 ? (
                  <div className="notif-panel__empty">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.notification_id}
                      className={`notif-item${n.is_read ? "" : " notif-item--unread"}`}
                      onClick={() => !n.is_read && markRead(n.notification_id)}
                    >
                      <div className={`notif-item__dot${n.is_read ? "" : " notif-item__dot--active"}`} />
                      <div className="notif-item__body">
                        <div className="notif-item__title">{n.title}</div>
                        {n.message && <div className="notif-item__msg">{n.message}</div>}
                        <div className="notif-item__time">{timeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="panel-header__user">
          <div className="panel-header__user-avatar">
            {facePhoto ? (
              <img src={facePhoto} alt="Profile" className="panel-header__user-avatar-img" />
            ) : (
              <>{userName.charAt(0).toUpperCase()}{userLastName ? userLastName.charAt(0).toUpperCase() : ""}</>
            )}
          </div>
          <div className="panel-header__user-info">
            <span className="panel-header__user-name">{userName}</span>
            <span className="panel-header__user-role">{portalLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
