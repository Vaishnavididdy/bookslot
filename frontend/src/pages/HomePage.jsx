import { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { getSlotStatus, createBooking, getAllBookings } from "../api";

function formatSlot(slot) {
  const [h, m] = slot.split(":");
  const hour = parseInt(h, 10);
  const period = hour < 12 ? "AM" : "PM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${period}`;
}

function formatDate(dateStr) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatDateShort(dateStr) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export default function HomePage() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const fetchSlots = (d) => {
    setLoadingSlots(true);
    setSlotsError(null);
    getSlotStatus(d)
      .then(setSlots)
      .catch(() => setSlotsError("Could not load slots. Is the backend running?"))
      .finally(() => setLoadingSlots(false));
  };

  const fetchAllBookings = () => {
    setLoadingBookings(true);
    getAllBookings()
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          const dc = new Date(b.date) - new Date(a.date);
          return dc !== 0 ? dc : b.time.localeCompare(a.time);
        });
        setAllBookings(sorted);
      })
      .catch(() => setAllBookings([]))
      .finally(() => setLoadingBookings(false));
  };

  useEffect(() => {
    if (!date) return;
    fetchSlots(date);
  }, [date]);

  const openDialog = (slot) => {
    setSelectedSlot(slot);
    setForm({ name: "", email: "", phone: "" });
    setErrors({});
    setSubmitError(null);
    setDialogOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    else if (form.phone.replace(/\D/g, "").length < 7) e.phone = "Phone must be at least 7 digits.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await createBooking({
      date, time: selectedSlot,
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
    });
    setSubmitting(false);
    if (result.ok) {
      setDialogOpen(false);
      setConfirmed({ date, slot: selectedSlot, name: form.name.trim(), id: result.id });
      fetchSlots(date);
      fetchAllBookings();
      setSelectedSlot(null);
    } else {
      setSubmitError(result.err);
    }
  };

  // ── POST-BOOKING: success banner + read-only table ──
  if (confirmed) {
    return (
      <Layout>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "2.5rem 1rem" }}>

          {/* Success banner */}
          <div className="card" style={{ marginBottom: "1.5rem", borderColor: "#bbf7d0", background: "#f0fdf4" }}>
            <div className="card-content" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2rem", lineHeight: 1 }}>✅</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#15803d", marginBottom: "0.25rem" }}>
                  Booking Confirmed!
                </h2>
                <p style={{ color: "#166534", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                  Hi <strong>{confirmed.name}</strong> — your appointment on <strong>{formatDate(confirmed.date)}</strong> at <strong>{formatSlot(confirmed.slot)}</strong> is booked.
                </p>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: "0.85rem", padding: "0.4rem 0.875rem" }}
                  onClick={() => { setConfirmed(null); setDate(""); setAllBookings([]); }}
                >
                  ← Book Another Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Read-only all bookings table */}
          <div className="table-card">
            <div className="table-card-header">
              <div className="table-card-title">All Booked Appointments</div>
              {!loadingBookings && (
                <div className="table-badge">{allBookings.length} {allBookings.length === 1 ? "booking" : "bookings"} · latest first</div>
              )}
            </div>

            {loadingBookings ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
                Loading all bookings...
              </div>
            ) : allBookings.length === 0 ? (
              <div className="empty-state" style={{ padding: "3rem 1rem" }}>
                <p style={{ fontWeight: 500 }}>No bookings yet</p>
                <p>Your booking will appear here once confirmed.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map((b) => {
                      const isNew = String(b.id) === String(confirmed.id);
                      return (
                        <tr key={b.id} style={isNew ? { background: "#f0f9ff" } : {}}>
                          <td style={{ whiteSpace: "nowrap" }}>{formatDateShort(b.date)}</td>
                          <td><span className="time-badge">{formatSlot(b.time)}</span></td>
                          <td style={{ fontWeight: isNew ? 600 : 400 }}>{b.name}</td>
                          <td><a href={`mailto:${b.email}`} className="email-link">{b.email}</a></td>
                          <td>{b.phone}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </Layout>
    );
  }

  // ── DEFAULT: booking form ──
  return (
    <Layout>
      <div className="page-container">
        <div className="page-heading">
          <h1>Book an Appointment</h1>
          <p>Select a date and an available time slot to schedule your visit.</p>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">📅 Select a Date</div></div>
          <div className="card-content">
            <input
              type="date" value={date} min={today()}
              onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }}
              className="form-input"
            />
            {date && <p className="date-hint">{formatDate(date)}</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">🕐 Available Time Slots</div></div>
          <div className="card-content">
            {!date ? (
              <div className="empty-state"><p>Please select a date above to view available slots.</p></div>
            ) : loadingSlots ? (
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Loading slots...</p>
            ) : slotsError ? (
              <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{slotsError}</p>
            ) : (
              <>
                <div className="slot-grid">
                  {slots.map(({ slot, booked }) => {
                    const selected = selectedSlot === slot;
                    const cls = `slot-button${selected ? " selected" : booked ? " booked" : ""}`;
                    return (
                      <button
                        key={slot} type="button" className={cls}
                        disabled={booked}
                        onClick={() => !booked && openDialog(slot)}
                      >
                        <span>{formatSlot(slot)}</span>
                        {booked && <span className="slot-sub">Booked</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="slot-legend">
                  <div className="legend-item"><div className="legend-dot" style={{ background: "#fff", border: "1px solid #d1d5db" }}></div> Available</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: "#0284c7" }}></div> Selected</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: "#f3f4f6", border: "1px solid #e5e7eb" }}></div> Booked</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {dialogOpen && (
        <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && setDialogOpen(false)}>
          <div className="dialog-box">
            <div className="dialog-title">Book Your Appointment</div>
            <div className="dialog-desc">Fill in your details to confirm.</div>
            <div className="dialog-summary">
              <span>Date:</span> {date} &nbsp; <span>Time:</span> {formatSlot(selectedSlot)}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Sarah Johnson" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="sarah@example.com" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" placeholder="+1 (555) 123-4567" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>
              {submitError && <div className="submit-error">{submitError}</div>}
              <div className="dialog-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setDialogOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Confirming..." : "Confirm Booking"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}