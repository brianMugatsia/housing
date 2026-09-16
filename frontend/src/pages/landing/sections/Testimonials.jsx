import { Quote } from "lucide-react";
import Card from "../../../components/ui/Card";

const testimonials = [
  {
    name: "Faith N.",
    role: "Maseno University",
    quote: "I found a clean, verified bedsitter five minutes from campus in one afternoon.",
  },
  {
    name: "Brian K.",
    role: "JKUAT",
    quote: "The booking process was straightforward and the landlord responded fast.",
  },
  {
    name: "Amina O.",
    role: "University of Nairobi",
    quote: "Verification badges made it easy to trust listings before visiting.",
  },
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Testimonials</span>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">What Students Say</h2>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {testimonials.map((t) => (
          <Card
            key={t.name}
            className="relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70"
          >
            <Quote className="h-7 w-7 text-primary/15" fill="currentColor" />
            <p className="mt-3 text-sm leading-relaxed text-slate-600">"{t.quote}"</p>
            <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-500 text-xs font-bold text-white">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}