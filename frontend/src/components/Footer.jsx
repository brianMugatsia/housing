import { Link } from "react-router-dom";
import { Home, Mail, Phone, Globe, ShieldCheck } from "lucide-react";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Browse Accommodations", to: "/houses" },
      { label: "Verified Hostels", to: "/houses" },
      { label: "Student Apartments", to: "/houses" },
    ],
  },
  {
    title: "Accounts",
    links: [
      { label: "Student Registration", to: "/register/student" },
      { label: "Landlord Onboarding", to: "/register/landlord" },
      { label: "Account Login", to: "/login" },
    ],
  },
  {
    title: "Security & Trust",
    links: [
      { label: "Direct Booking Approval", to: "/houses" },
      { label: "M-Pesa Escrow Protection", to: "/" },
      { label: "Terms of Service", to: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 text-xl font-black text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
                <Home className="h-5 w-5" />
              </div>
              <span>HomeFind</span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              The premier verified student accommodation portal. Connecting students with trusted landlords near major universities with direct booking approval and photo showcase carousels.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-4 w-4" /> 100% Verified Properties
              </span>
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.title} className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">{col.title}</h4>
              <ul className="space-y-2 text-xs">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-slate-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} HomeFind Student Living. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Security Standards</span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
