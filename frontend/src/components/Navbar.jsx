import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";

const roleDashboard = {
  STUDENT: "/student/dashboard",
  LANDLORD: "/landlord/dashboard",
  ADMIN: "/admin/dashboard",
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Home" },
    { to: "/houses", label: "Browse Houses" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <Home className="h-6 w-6" />
          HomeFind
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-600 hover:text-primary">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(roleDashboard[user.role] || "/")}>
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Get Started
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-600" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <hr />
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate(roleDashboard[user.role] || "/");
                    setOpen(false);
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    navigate("/");
                    setOpen(false);
                  }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => { navigate("/login"); setOpen(false); }}>
                  Log in
                </Button>
                <Button onClick={() => { navigate("/register"); setOpen(false); }}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
