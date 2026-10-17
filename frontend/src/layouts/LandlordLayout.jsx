import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  PlusCircle, 
  Calendar, 
  LogOut, 
  Home, 
  Menu, 
  X,
  Compass
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/landlord/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/landlord/bookings", label: "Booking Requests", icon: Calendar },
  { to: "/landlord/properties", label: "My Properties", icon: Building2 },
  { to: "/landlord/properties/new", label: "Add Property", icon: PlusCircle },
];

export default function LandlordLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/60 text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white p-6 md:flex">
        <div className="space-y-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">HomeFind</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Landlord Portal</span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
                    active 
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" 
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Browse Public Site */}
          <div className="pt-2 border-t border-slate-100">
            <Link
              to="/houses"
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Compass className="h-4 w-4" />
              <span>Browse Public Listings</span>
            </Link>
          </div>
        </div>

        {/* User Profile Snippet & Logout */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-xs">
              {(user?.first_name?.[0] || user?.username?.[0] || "L").toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <span className="block truncate text-xs font-bold text-slate-900">
                {user?.full_name || user?.username || "Landlord"}
              </span>
              <span className="block truncate text-[11px] text-slate-400 font-medium">
                {user?.email || "Account verified"}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Home className="h-4 w-4" />
            </div>
            <span className="font-black text-slate-900">HomeFind</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white p-4 space-y-2 md:hidden animate-slideInDown">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold ${
                    active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}