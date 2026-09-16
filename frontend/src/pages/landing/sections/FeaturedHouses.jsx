import { useEffect, useState } from "react";
import { MapPin, ShieldCheck, Building2, ArrowRight } from "lucide-react";
import api from "../../../services/api";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function FeaturedHouses() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/properties/?page_size=4")
      .then((res) => setHouses(res.data.results || []))
      .catch(() => setHouses([]))
      .finally(() => setLoading(false));
  }, []);

  // Resolves primary or first image URL from nested array or single string field
  const getImageUrl = (house) => {
    const primaryImgObj = house.images?.find((img) => img.is_primary) || house.images?.[0];
    let url = primaryImgObj?.image || house.image;

    if (url && typeof url === "string" && !url.startsWith("http")) {
      url = `http://127.0.0.1:8000${url}`;
    }

    return url;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Handpicked</span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Featured Houses</h2>
        </div>
        <Button variant="ghost" onClick={() => navigate("/houses")} className="group">
          View all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>

      {loading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : houses.length === 0 ? (
        <Card className="mt-10 text-center text-slate-500">
          Verified listings will appear here once landlords start submitting properties.
        </Card>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {houses.map((house) => {
            const imageUrl = getImageUrl(house);

            return (
              <Card
                key={house.id}
                className="group cursor-pointer overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70"
                onClick={() => navigate(`/houses/${house.id}`)}
              >
                {/* Image Container */}
                <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={house.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Building2 className="mx-auto h-8 w-8 stroke-[1.5]" />
                      <span className="text-[10px] font-medium">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                {/* Info Container */}
                <div className="p-4">
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </div>
                  <h3 className="mt-2 truncate font-semibold text-slate-800">{house.title}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {house.area || house.town}, {house.county || house.town}
                    </span>
                  </div>
                  <p className="mt-2.5 font-bold text-primary">
                    KES {house.monthly_rent ? Number(house.monthly_rent).toLocaleString() : "N/A"}
                    <span className="ml-1 text-xs font-medium text-slate-400">/mo</span>
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}