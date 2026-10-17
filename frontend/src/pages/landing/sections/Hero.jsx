import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldCheck, Star, Sparkles, Building2, MapPin } from "lucide-react";
import api from "../../../services/api";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "../../../components/ui/Input";

import heroImg from "../../../assets/hero-image.png";

export default function Hero() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [form, setForm] = useState({ university: "", location: "", max_rent: "" });

  useEffect(() => {
    api
      .get("/auth/universities/")
      .then((res) => setUniversities(res.data.results || res.data))
      .catch(() => setUniversities([]));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.university) params.set("university", form.university);
    if (form.location) params.set("location", form.location);
    if (form.max_rent) params.set("max_rent", form.max_rent);
    navigate(`/houses?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-slate-50/50 to-white pt-8 pb-20">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-primary border border-primary/20 shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Verified Student Housing Platform
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl leading-[1.1]">
              Find Your Perfect <br />
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Student Home
              </span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              Discover verified student hostels, bedsitters, and apartments near your university. Secure rooms per semester with transparent pricing and direct landlord approvals.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/houses")}
                className="rounded-2xl bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Browse Accommodations
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/register/landlord")}
                className="rounded-2xl border-slate-300 px-8 py-4 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
              >
                List Property as Landlord
              </Button>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>100% Verified Listings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Trusted by 5,000+ Students</span>
              </div>
            </div>
          </div>

          {/* Hero Image Card with Glassmorphic badge */}
          <div className="relative mx-auto max-w-lg lg:max-w-none w-full">
            <div className="overflow-hidden rounded-3xl border-2 border-white shadow-2xl bg-slate-900 group">
              <img
                src={heroImg}
                alt="Student Housing Accommodation"
                className="h-full w-full object-cover aspect-square sm:aspect-video lg:aspect-square transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                    Featured Residence
                  </span>
                  <h3 className="text-lg font-black">Campus View Apartments</h3>
                </div>
                <div className="rounded-2xl bg-white/20 backdrop-blur-md px-4 py-2 border border-white/20">
                  <span className="block text-[10px] uppercase font-bold opacity-80">Per Semester</span>
                  <span className="text-sm font-black">KES 25,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Search Bar Widget */}
        <form
          onSubmit={handleSearch}
          className="mt-14 grid gap-4 rounded-3xl bg-white p-6 sm:p-8 shadow-2xl shadow-slate-900/10 border border-slate-200/80 sm:grid-cols-4 items-center"
        >
          <div className="sm:col-span-4 flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Quick Student Accommodation Search</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">Semester Based Booking</span>
          </div>

          <Select
            placeholder="Select University"
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
            options={universities.map((u) => ({ value: u.name, label: u.name }))}
          />
          <Input
            placeholder="Town / Area / Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Max Rent / Semester (KES)"
            value={form.max_rent}
            onChange={(e) => setForm({ ...form, max_rent: e.target.value })}
          />
          <Button type="submit" className="w-full rounded-2xl py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black shadow-lg">
            <Search className="h-4 w-4 mr-2" />
            Search Houses
          </Button>
        </form>
      </div>
    </section>
  );
}
