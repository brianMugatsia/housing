import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Menu, X, LogOut, LayoutDashboard, Sparkles, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";

const roleDashboard = {
  STUDENT: "/student/dashboard",
  LANDLORD: "/landlord/dashboard",
  ADMIN: "/admin/dashboard",
};

const roleBadgeLabel = {
  STUDENT: "Student Portal",
  LANDLORD: "Landlord Portal",
  ADMIN: "Admin Portal",
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  const links = [
    { to: "/", label: "Home" },
    { to: "/houses", label: "Browse Accommodations" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-slate-200/80 py-3 shadow-md shadow-slate-900/5"
          : "bg-white/80 backdrop-blur-md border-b border-slate-100 py-4"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-primary text-white shadow-lg shadow-slate-900/20 transition-transform duration-300 group-hover:scale-105">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 opacity-0 group-hover:opacity-40 transition-opacity blur-xs" />
            <Home className="relative h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight group-hover:text-primary transition-colors">
              HomeFind
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Student Living
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner md:flex">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-5 py-2.5 text-xs font-black transition-all rounded-xl cursor-pointer ${
                  active
                    ? "text-slate-900 bg-white shadow-sm scale-105" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Auth Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-700 shadow-2xs">
                {roleBadgeLabel[user.role] || user.role}
              </span>

              <button
                onClick={() => navigate(roleDashboard[user.role] || "/")}   
                className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => { logout(); navigate("/"); }}
                className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span>Exit</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate("/login")}
                className="rounded-2xl px-5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/register")}
                className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-3 text-xs font-black text-white shadow-xl shadow-slate-900/20 hover:from-slate-800 hover:to-indigo-900 active:scale-95 transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 border border-slate-200 md:hidden cursor-pointer hover:bg-slate-200 transition-colors shadow-2xs"
          onClick={() => setOpen(!open)}
          aria-label="Toggle Navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />} 
        </button>
      </nav>

      {/* Mobile Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 border-b border-slate-200 bg-white/95 p-6 backdrop-blur-2xl md:hidden shadow-2xl animate-slideInDown">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              {links.map((l) => {
                const active = location.pathname === l.to;
                return (
                  <Link
                    key={l.to} 
                    to={l.to} 
                    className={`rounded-2xl px-4 py-3 text-xs font-black transition-all ${
                      active ? "bg-slate-900 text-white shadow-sm" : "text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>

            <div className="h-px bg-slate-200/80" />

            {user ? (
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between px-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Signed in as</span>
                    <span className="text-xs font-black text-slate-900">{user.email}</span>
                  </div>
                  <span className="rounded-xl bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 border border-indigo-200">
                    {roleBadgeLabel[user.role] || user.role}
                  </span>
                </div>
                <button
                  onClick={() => navigate(roleDashboard[user.role] || "/")} 
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-black text-white shadow-lg shadow-slate-900/10 cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Access Dashboard
                </button>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/register")}
                  className="rounded-2xl bg-slate-900 py-3.5 text-xs font-black text-white shadow-lg shadow-slate-900/10 cursor-pointer"
                >
                  Join HomeFind
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-xs font-black text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Log Into Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
