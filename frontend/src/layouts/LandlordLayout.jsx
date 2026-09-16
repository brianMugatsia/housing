import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, PlusCircle, Calendar, LogOut, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/landlord/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/landlord/properties", label: "My Properties", icon: Building2 },
  { to: "/landlord/properties/new", label: "Add Property", icon: PlusCircle },
  { to: "/landlord/bookings", label: "Booking Requests", icon: Calendar },
];

export default function LandlordLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 border-r border-gray-100 bg-white p-4 md:block">
        <Link to="/" className="flex items-center gap-2 px-2 py-3 text-lg font-bold text-primary">
          <Home className="h-6 w-6" /> HomeFind
        </Link>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-gray-100"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </nav>
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}