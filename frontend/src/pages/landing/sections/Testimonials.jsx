import { Quote, Star } from "lucide-react";
import Card from "../../../components/ui/Card";

const testimonials = [
  {
    name: "Faith N.",
    role: "Maseno University",
    quote: "I found a clean, verified bedsitter five minutes from campus in one afternoon. The semester leasing made budgeting so easy!",
  },
  {
    name: "Brian K.",
    role: "JKUAT",
    quote: "The booking process was straightforward and the landlord approved my reservation instantly. Highly recommended!",
  },
  {
    name: "Amina O.",
    role: "University of Nairobi",
    quote: "Verification badges and photo carousels made it easy to trust listings before visiting in person.",
  },
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">      
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-primary">
          Student Feedback
        </span>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          What Students Say
        </h2>
        <p className="text-base text-slate-600 font-medium">
          Hear from students who found their ideal campus accommodation through HomeFind.
        </p>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="group relative rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-slate-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-slate-700 font-medium italic">"{t.quote}"</p>
            </div>

            <div className="mt-8 flex items-center gap-3 border-t border-slate-100 pt-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-primary text-sm font-black text-white shadow-md">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">{t.name}</p>
                <p className="text-xs font-bold text-slate-400">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
