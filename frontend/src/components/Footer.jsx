import { Link } from "react-router-dom";
import { Home, Mail, Phone, Globe } from "lucide-react";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About", to: "/" },
      { label: "Contact", to: "/" },
      { label: "Help Center", to: "/" },
    ],
  },
  {
    title: "For Users",
    links: [
      { label: "For Students", to: "/register/student" },
      { label: "For Landlords", to: "/register/landlord" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/" },
      { label: "Terms", to: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2 text-lg font-bold text-primary">
              <Home className="h-6 w-6" />
              HomeFind
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Find a place you can call home. Verified student accommodation near your university.
            </p>
            <div className="mt-4 flex gap-3 text-slate-400">
              <Mail className="h-5 w-5 hover:text-primary" />
              <Phone className="h-5 w-5 hover:text-primary" />
              <Globe className="h-5 w-5 hover:text-primary" />
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-800">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-slate-500 hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} HomeFind. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
