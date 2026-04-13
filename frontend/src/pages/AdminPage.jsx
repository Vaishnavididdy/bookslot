import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { getAllBookings, deleteBooking } from "../api";

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatSlot(time) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const period = hour < 12 ? "AM" : "PM";
  const display = hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${period}`;
}

export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    getAllBookings()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this booking? This cannot be undone.")) return;
    setDeletingId(id);
    await deleteBooking(id);
    setDeletingId(null);
    load();
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const filtered = bookings.filter(b => {
    if (filter === "upcoming") return b.date >= todayStr;
    if (filter === "past") return b.date < todayStr;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dc = new Date(b.date) - new Date(a.date);
    return dc !== 0 ? dc : b.time.localeCompare(a.time);
  });

  const todayCount = bookings.filter(b => b.date === todayStr).length;
  const upcoming = bookings.filter(b => b.date >= todayStr).length;
  const uniqueDates = new Set(bookings.map(b => b.date)).size;

  return (
    <Layout>
      <div className="admin-container">
        <div className="page-heading">
          <h1>Admin Dashboard</h1>
          <p>Manage all appointments from this panel.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div><div className="stat-label">Total Bookings</div><div className="stat-value">{bookings.length}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div><div className="stat-label">Today</div><div className="stat-value">{todayCount}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🕐</div>
            <div><div className="stat-label">Upcoming</div><div className="stat-value">{upcoming}</div></div>
          </div>
        </div>

        <div className="filter-bar">
          {["all", "upcoming", "past"].map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="table-card">
          <div className="table-card-header">
            <div className="table-card-title">Bookings</div>
            <div className="table-badge">{sorted.length} {sorted.length === 1 ? "record" : "records"} · latest first</div>
          </div>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>Loading...</div>
          ) : sorted.length === 0 ? (
            <div className="empty-state" style={{ padding: "3rem 1rem" }}>
              <p style={{ fontWeight: 500 }}>No bookings found</p>
              <p>Try a different filter or check back later.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr><th>Date</th><th>Time</th><th>Name</th><th>Email</th><th>Phone</th><th></th></tr>
                </thead>
                <tbody>
                  {sorted.map((b) => (
                    <tr key={b.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDate(b.date)}</td>
                      <td><span className="time-badge">{formatSlot(b.time)}</span></td>
                      <td style={{ fontWeight: 500 }}>{b.name}</td>
                      <td><a href={`mailto:${b.email}`} className="email-link">{b.email}</a></td>
                      <td>{b.phone}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="delete-btn" onClick={() => handleDelete(b.id)} disabled={deletingId === b.id}>
                          🗑 {deletingId === b.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}