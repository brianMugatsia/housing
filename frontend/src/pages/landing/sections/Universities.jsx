import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
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
    <section className="bg-gradient-to-b from-white to-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Coverage</span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Supported Universities</h2>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {universities.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-2 rounded-full border border-slate-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/20"
            >
              <GraduationCap className="h-4 w-4 text-primary" />
              {u.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}