
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, 
  ArrowLeft, 
  Building2, 
  ShieldCheck, 
  Bed, 
  Wifi, 
  Droplets 
} from "lucide-react";
import api from "../../services/api";

export default function HouseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Form State
  const [moveInDate, setMoveInDate] = useState("");
  const [durationMonths, setDurationMonths] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
  const fetchHouseDetails = async () => {
    try {
      const response = await api.get(`/properties/${id}/`);
      setHouse(response.data);
    } catch (err) {
      console.error("Error fetching house details:", err);
      setError(err.response?.data?.detail || "Unable to load property details.");
    } finally {
      setLoading(false);
    }
  };

  fetchHouseDetails();
}, [id]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await api.post("/bookings/", {
        property: house.id,
        move_in_date: moveInDate,
        duration_months: Number(durationMonths),
        notes: notes,
      });

      setMessage({ type: "success", text: "Booking request submitted successfully!" });
      setTimeout(() => navigate("/student/dashboard"), 1500);
    } catch (err) {
      console.error("Booking submission error:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Failed to submit booking. Ensure you are logged in as a student.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Property Not Found</h2>
        <button
          onClick={() => navigate("/houses")}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="h-4 w-4" /> Return to House Listings
        </button>
      </div>
    );
  }

  // Safely extract primary/first image from nested images array or single field
  const primaryImageObj = house.images?.find((img) => img.is_primary) || house.images?.[0];
  let imageUrl = primaryImageObj?.image || house.image;

  // Fallback prepend if backend sends a relative URL string
  if (imageUrl && typeof imageUrl === "string" && !imageUrl.startsWith("http")) {
    imageUrl = `${import.meta.env.VITE_MEDIA_URL ?? "http://127.0.0.1:8000"}${imageUrl}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Listings
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Details Section */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Image View */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 h-80 flex items-center justify-center shadow-sm">
            {imageUrl ? (
              <img src={imageUrl} alt={house.title} className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-slate-400 space-y-2">
                <Building2 className="mx-auto h-16 w-16 stroke-[1.5]" />
                <p className="text-xs font-medium">No Image Uploaded</p>
              </div>
            )}
          </div>

          {/* Header Info */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold capitalize text-slate-900">{house.title}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Listing
              </span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600 capitalize">
              <MapPin className="h-4 w-4 text-slate-400" />
              {house.town || "N/A"}, {house.county || "N/A"}
            </p>
          </div>

          {/* Key Amenities */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Key Features & Amenities</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                <Wifi className="h-4 w-4 text-indigo-600" /> High-speed Wi-Fi
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                <Droplets className="h-4 w-4 text-blue-600" /> 24/7 Water Supply
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                <Bed className="h-4 w-4 text-amber-600" /> Fully Furnished Room
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">About this Property</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {house.description || "No specific details provided by landlord for this accommodation option."}
            </p>
          </div>
        </div>

        {/* Sidebar / Inline Booking Form */}
        <div>
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <p className="text-xs font-medium text-slate-400">semester Rent</p>
              <p className="text-3xl font-bold text-slate-900">
                KES {house.monthly_rent ? Number(house.monthly_rent).toLocaleString() : "5,000"}
              </p>
            </div>

            {message.text && (
              <div
                className={`rounded-xl p-3 text-xs font-semibold ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expected Move-in Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duration (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Special requests or questions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? "Submitting Request..." : "Request to Book"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}