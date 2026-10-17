import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import { Sparkles, ArrowRight } from "lucide-react";

export default function CTA() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary to-indigo-900 py-24 my-12 rounded-3xl mx-4 sm:mx-6 lg:mx-8 shadow-2xl">
      {/* Decorative glow elements */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 space-y-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md border border-white/20">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Start Your Search Today
        </span>

        <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight leading-tight">
          Ready to Find Your Next Student Home?
        </h2>

        <p className="mx-auto max-w-xl text-slate-300 text-sm sm:text-base font-medium">
          Join thousands of students who secure verified campus accommodation with transparent semester-based pricing.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            size="lg"
            className="rounded-2xl bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 font-black shadow-xl transition-all cursor-pointer"
            onClick={() => navigate("/houses")}
          >
            Browse Accommodations <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-2xl border-white/30 text-white hover:bg-white/10 px-8 py-4 font-black transition-all cursor-pointer backdrop-blur-md"
            onClick={() => navigate("/register/landlord")}
          >
            List Your Property
          </Button>
        </div>
      </div>
    </section>
  );
}
