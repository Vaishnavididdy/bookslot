import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import contextmanager

DB_PATH = "bookings.db"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                UNIQUE(date, time)
            )
        """)
        conn.commit()

init_db()

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

class BookingIn(BaseModel):
    name: str
    email: str
    phone: str
    date: str
    time: str

@app.get("/bookings")
def get_bookings():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM bookings ORDER BY date DESC, time DESC").fetchall()
        return [dict(r) for r in rows]

@app.post("/bookings", status_code=201)
def create_booking(booking: BookingIn):
    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM bookings WHERE date = ? AND time = ?",
            (booking.date, booking.time)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="This slot is already booked.")
        cursor = conn.execute(
            "INSERT INTO bookings (name, email, phone, date, time) VALUES (?, ?, ?, ?, ?)",
            (booking.name, booking.email, booking.phone, booking.date, booking.time)
        )
        conn.commit()
        return {"id": cursor.lastrowid, **booking.dict()}

@app.delete("/bookings/{booking_id}")
def delete_booking(booking_id: int):
    with get_db() as conn:
        result = conn.execute("DELETE FROM bookings WHERE id = ?", (booking_id,))
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Booking not found.")
        return {"ok": True}