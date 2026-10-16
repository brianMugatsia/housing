import { useEffect, useState } from "react";
import { Search, Building } from "lucide-react";
import api from "../services/api";
import PropertyCard from "../components/PropertyCard";

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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Find Your Next Home
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Discover verified student accommodations, hostels, and apartments tailored for your campus lifestyle.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by location, university..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-96 rounded-2xl border border-slate-200 pl-12 pr-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {["ALL", "APARTMENT", "HOSTEL", "BEDSITTER", "SINGLE_ROOM"].map((type) => (
          <button
            key={type}
            onClick={() => setPropertyTypeFilter(type)}
            className={`whitespace-nowrap px-5 py-2.5 text-sm font-bold rounded-2xl border transition-all ${
              propertyTypeFilter === type
                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {type === "ALL" ? "All Accommodations" : type.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Property Grid */}
      {loading ? (
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="mt-16 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400">
            <Building className="h-8 w-8" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">No properties match your criteria</h3>
          <p className="mt-2 text-slate-500 max-w-sm mx-auto text-sm">
            Try adjusting your search or filters to see more results. We're constantly adding new listings!
          </p>
          <button 
            onClick={() => { setSearch(""); setPropertyTypeFilter("ALL"); }}
            className="mt-6 text-sm font-bold text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      )}
    </div>
  );
}