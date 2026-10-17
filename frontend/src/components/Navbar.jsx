import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Menu, X, LogOut, LayoutDashboard, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";

const roleDashboard = {
  STUDENT: "/student/dashboard",
  LANDLORD: "/landlord/dashboard",
  ADMIN: "/admin/dashboard",
};

const roleBadgeLabel = {
  STUDENT: "Student",
  LANDLORD: "Landlord",
  ADMIN: "Admin",
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
          ? "bg-white/90 backdrop-blur-xl border-b border-slate-200/80 py-3 shadow-xs" 
          : "bg-white border-b border-transparent py-4"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md transition-transform group-hover:scale-105">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">HomeFind</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Student Living</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link 
                key={l.to} 
                to={l.to} 
                className={`px-4 py-2 text-xs font-bold transition-all rounded-2xl ${
                  active 
                    ? "text-slate-900 bg-slate-100 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
              <span className="inline-block rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-700">
                {roleBadgeLabel[user.role] || user.role}
              </span>

              <button
                onClick={() => navigate(roleDashboard[user.role] || "/")}
                className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span>Exit</span>
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => navigate("/login")}
                className="rounded-2xl px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Sign in
              </button>
              <button 
                onClick={() => navigate("/register")}
                className="rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 md:hidden cursor-pointer" 
          onClick={() => setOpen(!open)}
          aria-label="Toggle Navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Dropdown */}
      {open && (
        <div className="border-b border-slate-200 bg-white/95 p-6 backdrop-blur-xl md:hidden animate-slideInDown">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <Link 
                  key={l.to} 
                  to={l.to} 
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            
            <div className="h-px bg-slate-100" />
            
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-medium text-slate-500">{user.email}</span>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">
                    {roleBadgeLabel[user.role] || user.role}
                  </span>
                </div>
                <button
                  onClick={() => navigate(roleDashboard[user.role] || "/")}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Access Dashboard
                </button>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => navigate("/register")}
                  className="rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md shadow-slate-900/10"
                >
                  Join HomeFind
                </button>
                <button 
                  onClick={() => navigate("/login")}
                  className="rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700"
                >
                  Log into Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
