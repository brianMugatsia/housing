import { useEffect, useState } from "react";
import { GraduationCap, Building2 } from "lucide-react";
import api from "../../../services/api";

export default function Universities() {
  const [universities, setUniversities] = useState([]);

  useEffect(() => {
    api
      .get("/auth/universities/")
      .then((res) => setUniversities(res.data.results || res.data))
      .catch(() => setUniversities([]));
  }, []);

  if (universities.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-24">     
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-primary">
            Campuses & Institutions
          </span>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Supported Universities
          </h2>
          <p className="text-base text-slate-600 font-medium">
            Find accommodation located near premier universities across the country.
          </p>
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-4">
          {universities.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-slate-900"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-4 w-4" />
              </div>
              {u.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
