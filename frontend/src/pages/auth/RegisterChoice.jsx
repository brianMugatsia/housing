import { useNavigate } from "react-router-dom";
import { GraduationCap, Building2, ArrowRight } from "lucide-react";

export default function RegisterChoice() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-4 py-16 animate-fadeIn">
      <div className="text-center space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full">
          Get Started
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Join the HomeFind Community
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Select your account type to proceed with tailored registration.
        </p>
      </div>

      <div className="mt-10 grid w-full gap-6 sm:grid-cols-2">
        {/* Student Card */}
        <div 
          onClick={() => navigate("/register/student")}
          className="group relative flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110 shadow-xs">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-900">I'm a Student</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Find verified hostels and apartments near campus, explore photo carousels, and submit instant reservation requests.
            </p>
          </div>

          <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-black text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer">
            Continue as Student <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Landlord Card */}
        <div 
          onClick={() => navigate("/register/landlord")}
          className="group relative flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110 shadow-xs">
              <Building2 className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-900">I'm a Landlord</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Showcase student accommodations, upload photos, review and approve tenant booking requests, and manage room occupancy.
            </p>
          </div>

          <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all cursor-pointer">
            Continue as Landlord <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
