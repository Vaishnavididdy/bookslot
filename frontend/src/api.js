const BASE = "http://localhost:8000";

const ALL_SLOTS = [
  "09:00","10:00","11:00","12:00","13:00",
  "14:00","15:00","16:00","17:00","18:00",
];

export async function getSlotStatus(date) {
  const res = await fetch(`${BASE}/bookings`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  const bookings = await res.json();
  const booked = bookings.filter(b => b.date === date).map(b => b.time);
  return ALL_SLOTS.map(slot => ({ slot, booked: booked.includes(slot) }));
}

export async function getAllBookings() {
  const res = await fetch(`${BASE}/bookings`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

export async function createBooking({ date, time, name, email, phone }) {
  const res = await fetch(`${BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, time, name, email, phone }),
  });
  if (res.status === 409) {
    return { ok: false, err: "This slot is already taken. Please pick another time." };
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, err: data.detail || "Failed to book appointment." };
  }
  const data = await res.json();
  return { ok: true, id: String(data.id) };
}

export async function deleteBooking(id) {
  const res = await fetch(`${BASE}/bookings/${id}`, { method: "DELETE" });
  if (!res.ok) return { ok: false, err: "Failed to delete booking." };
  return { ok: true };
}