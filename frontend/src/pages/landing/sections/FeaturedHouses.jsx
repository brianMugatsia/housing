import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import api from "../../../services/api";
import Button from "../../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import PropertyCard from "../../../components/PropertyCard";

export default function FeaturedHouses() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/properties/?page_size=3")
      .then((res) => setHouses(res.data.results || []))
      .catch(() => setHouses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-xl">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-full">
            Premium Picks
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Featured Student Homes
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Carefully selected properties offering the best amenities and locations near major universities.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/houses")} 
          className="group rounded-2xl border-slate-200 px-6 py-3 font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm"
        >
          View all properties
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {loading ? (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : houses.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-slate-100 bg-slate-50/50 p-16 text-center">
          <p className="text-slate-500 font-medium italic">
            Newly verified listings will appear here soon. Stay tuned!
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <PropertyCard key={house.id} property={house} />
          ))}
        </div>
      )}
    </section>
  );
}