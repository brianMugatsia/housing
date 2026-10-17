import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, CalendarCheck, Receipt, RefreshCw } from "lucide-react";

export default function AdminNav({ 
  onRefresh, 
  loading = false, 
  title = "Admin Console", 
  subtitle = "Manage platform operations" 
}) {
  const location = useLocation();

  const navItems = [
    { to: "/admin/dashboard", label: "Property Verification", icon: ShieldCheck },
    { to: "/admin/bookings", label: "Student Bookings & Approvals", icon: CalendarCheck },
    { to: "/admin/payments", label: "Financial Records", icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full">
            Platform Administration
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            {subtitle}
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer self-start"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        )}
      </div>

      {/* Navigation Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/80">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to === "/admin/dashboard" && location.pathname === "/admin");
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-black rounded-t-2xl border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-slate-900 text-slate-900 bg-white shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
