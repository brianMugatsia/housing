import { ShieldCheck, GraduationCap, CalendarCheck, Users, Sparkles } from "lucide-react";
import Card from "../../../components/ui/Card";

const items = [
  {
    icon: ShieldCheck,
    title: "100% Verified Housing",
    desc: "Every property and landlord is thoroughly vetted and approved before appearing on the platform.",
  },
  {
    icon: GraduationCap,
    title: "Close to Campus",
    desc: "Find student hostels and apartments within walking distance of major universities and colleges.",
  },
  {
    icon: CalendarCheck,
    title: "Semester-Based Leases",
    desc: "Book and pay securely per semester (2 semesters per academic year) with transparent terms.",
  },
  {
    icon: Users,
    title: "Direct Landlord Approvals",
    desc: "Submit your room reservation and get approved directly by landlords or system admins.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">      
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Why Choose HomeFind
        </span>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Built for Student Peace of Mind
        </h2>
        <p className="text-base text-slate-600 font-medium">
          A seamless ecosystem designed to remove the stress and guesswork from student housing.
        </p>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">      
        {items.map((item) => (
          <div
            key={item.title}
            className="group relative rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-slate-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-xs transition-transform duration-300 group-hover:scale-110">
                <item.icon className="h-7 w-7 stroke-[2]" />
              </div>
              <h3 className="mt-6 text-xl font-black text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 font-medium">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
