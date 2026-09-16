import { ShieldCheck, GraduationCap, CalendarCheck, Users } from "lucide-react";
import Card from "../../../components/ui/Card";

const items = [
  {
    icon: ShieldCheck,
    title: "Verified Houses",
    desc: "Every property is reviewed before appearing on the platform.",
  },
  {
    icon: GraduationCap,
    title: "Student-Friendly",
    desc: "Find accommodation close to your university.",
  },
  {
    icon: CalendarCheck,
    title: "Easy Booking",
    desc: "Reserve your preferred accommodation with a simple process.",
  },
  {
    icon: Users,
    title: "Trusted Landlords",
    desc: "We verify landlords and property information.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Why HomeFind</span>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Built for peace of mind</h2>
        <p className="mt-3 text-slate-500">
          A platform designed to remove the guesswork from student housing.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card
            key={item.title}
            className="group text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-110">
              <item.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-5 font-semibold text-slate-800">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}