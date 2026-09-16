import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Building, Home, CheckCircle2 } from "lucide-react";
import api from "../services/api";

export default function HousesPage() {
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("ALL");

  useEffect(() => {
    let isMounted = true;

    const fetchProperties = async () => {
      try {
        const res = await api.get("/properties/");
        if (isMounted) {
          const rawData = Array.isArray(res.data)
            ? res.data
            : res.data?.results || [];
          setProperties(rawData);
        }
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderUniversityName = (university) => {
    if (!university) return "Near Campus";
    if (typeof university === "string") return university;
    return university.name || "Near Campus";
  };

  const filteredProperties = properties.filter((prop) => {
    const matchesSearch =
      prop.title?.toLowerCase().includes(search.toLowerCase()) ||
      prop.town?.toLowerCase().includes(search.toLowerCase()) ||
      prop.county?.toLowerCase().includes(search.toLowerCase()) ||
      renderUniversityName(prop.university).toLowerCase().includes(search.toLowerCase());

    const matchesType =
      propertyTypeFilter === "ALL" || prop.property_type === propertyTypeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Browse Housing</h1>
          <p className="mt-1 text-slate-500">
            Find verified student rentals, hostels, and apartments near your campus.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search location, university, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "APARTMENT", "HOSTEL", "BEDSITTER", "SINGLE_ROOM"].map((type) => (
              <button
                key={type}
                onClick={() => setPropertyTypeFilter(type)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                  propertyTypeFilter === type
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {type === "ALL" ? "All Types" : type.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Property Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          Loading available accommodations...
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-600">
            <Building className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No properties found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Try adjusting your search terms or clearing filters to view available housing listings.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((prop) => {
            const coverImage = prop.images && prop.images.length > 0 ? prop.images[0].image : null;

            return (
              <div
                key={prop.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Image Section */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={prop.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <Home className="h-10 w-10 stroke-[1.5]" />
                    </div>
                  )}

                  <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
                    KES {prop.monthly_rent?.toLocaleString()}/mo
                  </span>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{prop.town}, {prop.county}</span>
                    </div>

                    <h2 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition">
                      {prop.title}
                    </h2>

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-medium">
                        {prop.property_type?.replace("_", " ")}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-medium">
                        {prop.available_rooms} room(s) left
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span className="truncate">
                        {renderUniversityName(prop.university)}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/houses/${prop.id}`}
                        className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Details
                      </Link>
                      <Link
                        to={`/book/${prop.id}`}
                        className="flex-1 rounded-xl bg-slate-900 py-2 text-center text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}