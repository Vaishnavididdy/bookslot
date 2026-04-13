import { useLocation, useNavigate } from "react-router-dom";

export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname === "/admin";

  return (
    <div className="layout">
      <header className="navbar">
        <div className="navbar-brand" onClick={() => navigate("/")}>
          📅 Appointment Scheduler
        </div>
        <nav className="navbar-links">
          <button className={`nav-link${!isAdmin ? " active" : ""}`} onClick={() => navigate("/")}>
            Book
          </button>
          <button className={`nav-link${isAdmin ? " active" : ""}`} onClick={() => navigate("/admin")}>
            Admin
          </button>
        </nav>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer>
        © {new Date().getFullYear()} Appointment Scheduler · Simple booking for every business.
      </footer>
    </div>
  );
}