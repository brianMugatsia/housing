import { ShieldCheck, Lock, Headphones, FileText, CheckCircle2, HelpCircle } from "lucide-react";

export default function PoliciesAndSupport() {
  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full">
            Trust & Security
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Policies, Security & Support Standards
          </h2>
          <p className="text-sm text-slate-500">
            We are committed to providing a secure, transparent, and reliable housing ecosystem for students and verified landlords.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Security Standards */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Security Standards</h3>
            <ul className="space-y-3 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>End-to-end data encryption for all personal and financial transactions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Secure M-Pesa Daraja API integration with direct confirmation callbacks and strict ledger tracking.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Mandatory landlord verification (National ID and property ownership documents review).</span>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Housing Policies</h3>
            <ul className="space-y-3 text-xs text-slate-600 font-medium"> 
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>95% Refund & 5% Retention Policy:</strong> Approved cancellations and refund requests on completed payments receive a 95% instant refund via M-Pesa B2C payout, with a 5% administrative fee retained.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Fair Booking Policy:</strong> Pending requests allow room exploration without locking units until landlord confirmation and full payment.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Lease E-Signing:</strong> Digital lease agreements are securely bound upon booking approval and payment completion.</span> 
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">24/7 Student Support</h3>
            <ul className="space-y-3 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Dedicated helpdesk for emergency maintenance ticketing and priority repair dispatch.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>In-app secure messaging allowing instant direct inquiries with landlords and hosts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Rapid dispute resolution team operating across all major university campuses.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}
