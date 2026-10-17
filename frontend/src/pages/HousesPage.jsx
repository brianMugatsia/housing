import { useEffect, useState, useMemo } from "react";
import { Search, Building, SlidersHorizontal, ArrowUpDown, MapPin, LayoutGrid, Map as MapIcon } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import api from "../services/api";
import PropertyCard from "../components/PropertyCard";

export default function HousesPage() {
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "map"

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
    if (!university) return "";
    if (typeof university === "string") return university;
    return university.name || "";
  };

  const filteredProperties = useMemo(() => {
    return properties
      .filter((prop) => {
        const matchesSearch =
          !search.trim() ||
          prop.title?.toLowerCase().includes(search.toLowerCase()) ||
          prop.town?.toLowerCase().includes(search.toLowerCase()) ||
          prop.county?.toLowerCase().includes(search.toLowerCase()) ||
          prop.area?.toLowerCase().includes(search.toLowerCase()) ||
          renderUniversityName(prop.university).toLowerCase().includes(search.toLowerCase());

        const matchesType =
          propertyTypeFilter === "ALL" || prop.property_type === propertyTypeFilter;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") {
          return Number(a.semester_rent || 0) - Number(b.semester_rent || 0);
        }
        if (sortBy === "price_desc") {
          return Number(b.semester_rent || 0) - Number(a.semester_rent || 0);
        }
        return 0;
      });
  }, [properties, search, propertyTypeFilter, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-primary">
            Student Living Marketplace
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Find Your Next Student Home
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            Browse verified hostels, bedsitters, and student apartments with photo carousels and direct landlord booking.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "grid" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="h-4 w-4" /> Grid View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "map" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapIcon className="h-4 w-4" /> Campus Map
          </button>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by campus, town, area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-slate-900"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-slate-900 cursor-pointer"
        >
          <option value="default">Sort: Default</option>
          <option value="price_asc">Rent: Low to High</option>
          <option value="price_desc">Rent: High to Low</option>
        </select>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "ALL", label: "All Accommodations" },
          { id: "BEDSITTER", label: "Bedsitters" },
          { id: "HOSTEL", label: "Hostels" },
          { id: "SINGLE_ROOM", label: "Single Rooms" },
          { id: "ONE_BEDROOM", label: "1 Bedroom" },
          { id: "TWO_BEDROOM", label: "2 Bedroom" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPropertyTypeFilter(tab.id)}
            className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
              propertyTypeFilter === tab.id
                ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10 scale-105"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-2">
        <span>Showing <strong className="text-slate-900">{filteredProperties.length}</strong> available listings</span>
        {(search || propertyTypeFilter !== "ALL") && (
          <button
            onClick={() => { setSearch(""); setPropertyTypeFilter("ALL"); setSortBy("default"); }}
            className="text-primary hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Grid View or Map View */}
      {loading ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[380px] animate-pulse rounded-3xl bg-slate-200/70" />
          ))}
        </div>
      ) : viewMode === "map" ? (
        <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-0">
          <MapContainer center={[-0.0917, 34.7680]} zoom={12} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredProperties.map((p) => {
              const lat = p.latitude ? parseFloat(p.latitude) : -0.0917 + (Math.random() - 0.5) * 0.05;
              const lng = p.longitude ? parseFloat(p.longitude) : 34.7680 + (Math.random() - 0.5) * 0.05;
              return (
                <Marker key={p.id} position={[lat, lng]}>
                  <Popup>
                    <div className="p-1 space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs">{p.title}</h4>
                      <p className="text-[11px] text-slate-600 font-semibold">KES {Number(p.semester_rent || 0).toLocaleString()}</p>
                      <a href={`/houses/${p.id}`} className="text-blue-600 font-bold text-[10px] hover:underline block pt-1">View Details &rarr;</a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 sm:p-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 shadow-sm text-slate-400">
            <Building className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="mt-4 text-xl font-black text-slate-900">No properties match your search</h3>
          <p className="mt-2 text-slate-500 max-w-sm mx-auto text-sm">
            Try adjusting your search terms or filter options to discover more student rooms.
          </p>
          <button
            onClick={() => { setSearch(""); setPropertyTypeFilter("ALL"); }}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      )}
    </div>
  );
}
