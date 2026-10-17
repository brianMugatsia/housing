import { Search, Bed, CheckCircle, Wallet, Home, Building2, UserCheck, ShieldCheck } from "lucide-react";

const studentSteps = [
  { title: "Search & Filter", desc: "Find rooms near your campus" },
  { title: "Choose Unit", desc: "Pick specific room number" },
  { title: "Request Booking", desc: "Submit your semester stay" },
  { title: "Landlord Approval", desc: "Get approved quickly" },
  { title: "M-Pesa Payment", desc: "Pay semester rent securely" },
  { title: "Move In", desc: "Settle into your new home" },
];

const landlordSteps = [
  { title: "Register Account", desc: "Sign up as verified landlord" },
  { title: "List Property", desc: "Add photos and room units" },
  { title: "Admin Review", desc: "Get verified & published" },
  { title: "Receive Requests", desc: "Review student applications" },
  { title: "Approve Booking", desc: "Accept tenant reservations" },
  { title: "Collect Rent", desc: "Receive semester disbursements" },
];

function StepColumn({ title, subtitle, steps, badgeColor }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm space-y-6">
      <div className="space-y-1">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badgeColor}`}>
          {subtitle}
        </span>
        <h3 className="text-2xl font-black text-slate-900">{title}</h3>
      </div>

      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-xs shadow-md">
              0{i + 1}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">{s.title}</h4>
              <p className="text-xs text-slate-500 font-medium">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-24">     
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">   
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-primary">
            Simple Process
          </span>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            How HomeFind Works
          </h2>
          <p className="text-base text-slate-600 font-medium">
            Transparent and structured leasing for both students and property owners.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <StepColumn
            title="For Students"
            subtitle="Secure Your Accommodation"
            steps={studentSteps}
            badgeColor="bg-primary/10 text-primary border border-primary/20"
          />
          <StepColumn
            title="For Landlords"
            subtitle="Manage & Monetize Property"
            steps={landlordSteps}
            badgeColor="bg-emerald-50 text-emerald-700 border border-emerald-200"
          />
        </div>
      </div>
    </section>
  );
}
