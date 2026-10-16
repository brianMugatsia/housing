import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Menu, X, User, LogOut, LayoutDashboard, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";

const roleDashboard = {
  STUDENT: "/student/dashboard",
  LANDLORD: "/landlord/dashboard",
  ADMIN: "/admin/dashboard",
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location]);

  const links = [
    { to: "/", label: "Home" },
    { to: "/houses", label: "Browse" },
  ];

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3 shadow-sm" 
          : "bg-white border-b border-transparent py-5"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 text-xl font-black tracking-tight text-slate-900 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition-transform group-hover:rotate-6">
            <Home className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">HomeFind</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link 
                key={l.to} 
                to={l.to} 
                className={`px-4 py-2 text-sm font-bold transition-all rounded-xl ${
                  active ? "text-slate-900 bg-slate-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Auth Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(roleDashboard[user.role] || "/")}
                className="rounded-xl font-bold text-slate-700 hover:bg-slate-100 px-4 py-2"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              
              <div className="h-8 w-px bg-slate-100" />
              
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-rose-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Exit
              </button>
            </div>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/login")}
                className="font-bold text-slate-600"
              >
                Sign in
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate("/register")}
                className="rounded-xl bg-slate-900 px-6 py-2.5 font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-900 md:hidden" 
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-slate-100 bg-white/95 p-6 backdrop-blur-xl md:hidden animate-slideInDown">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              {links.map((l) => (
                <Link 
                  key={l.to} 
                  to={l.to} 
                  className="rounded-xl px-4 py-3 text-lg font-bold text-slate-900 hover:bg-slate-50"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="h-px bg-slate-100" />
            {user ? (
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => navigate(roleDashboard[user.role] || "/")}
                  className="rounded-xl bg-slate-900 py-4 font-bold"
                >
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  Access Dashboard
                </Button>
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => navigate("/register")}
                  className="rounded-xl bg-slate-900 py-4 font-bold shadow-lg shadow-slate-200"
                >
                  Join HomeFind
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="rounded-xl py-4 font-bold text-slate-600"
                >
                  Log into Account
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
