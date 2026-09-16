import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../../../services/api";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "../../../components/ui/Input";

// Import your image from assets (adjust filename/extension as needed)
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
    <section className="bg-gradient-to-b from-primary/5 to-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              Find Your Perfect <span className="text-primary">Student Home</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-500">
              Discover verified student accommodation near your university, compare prices, and book your next home with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate("/houses")}>
                Find a House
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/register/landlord")}>
                List Your Property
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-xl">
            <img
              src={heroImg}
              alt="Student Housing Accommodation"
              className="h-full w-full object-cover aspect-square sm:aspect-video lg:aspect-square"
            />
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-12 grid gap-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100 sm:grid-cols-4"
        >
          <div className="sm:col-span-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">Where do you want to live?</p>
          </div>
          <Select
            placeholder="University"
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
            options={universities.map((u) => ({ value: u.name, label: u.name }))}
          />
          <Input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Maximum rent (KES)"
            value={form.max_rent}
            onChange={(e) => setForm({ ...form, max_rent: e.target.value })}
          />
          <Button type="submit" className="w-full">
            <Search className="h-4 w-4" />
            Search Houses
          </Button>
        </form>
      </div>
    </section>
  );
}