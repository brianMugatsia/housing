import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, 
  ArrowLeft, 
  Building2, 
  ShieldCheck, 
  Bed, 
  Wifi, 
  Droplets,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import api from "../../services/api";
import ImageCarousel from "../../components/ImageCarousel";

export default function HouseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lightbox Modal State
  const [previewImage, setPreviewImage] = useState(null);

  // Booking Form State
  const [moveInDate, setMoveInDate] = useState("");
  const [durationMonths, setDurationMonths] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let isMounted = true;
    const fetchHouseDetails = async () => {
      try {
        const response = await api.get(`/properties/${id}/`);
        if (isMounted) setHouse(response.data);
      } catch (err) {
        console.error("Error fetching house details:", err);
        if (isMounted) setError(err.response?.data?.detail || "Unable to load property details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHouseDetails();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await api.post("/bookings/", {
        property: house.id,
        house_number: selectedRoom,
        move_in_date: moveInDate,
        duration_months: Number(durationMonths),
        notes: notes,
      });

      setMessage({ type: "success", text: "Booking request submitted successfully! Redirecting..." });
      setTimeout(() => navigate("/student/dashboard"), 1500);
    } catch (err) {
      console.error("Booking submission error:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.house_number?.[0] || err.response?.data?.detail || "Failed to submit booking. Ensure you are logged in as a student.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading property showcase...</p>
        </div>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center px-4">
        <Building2 className="mx-auto h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Property Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">{error || "The property you are looking for might have been removed or is unavailable."}</p>
        <button
          onClick={() => navigate("/houses")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Return to House Listings
        </button>
      </div>
    );
  }

  const images = house.images || (house.image ? [{ image: house.image }] : []);
  const availableRoomsList = house.available_room_numbers || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Listings
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Details Section */}
        <div className="space-y-6 lg:col-span-2">
          {/* Carousel View */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 h-[400px] sm:h-[450px] shadow-lg">
            <ImageCarousel 
              images={images} 
              title={house.title} 
              onImageClick={(img) => setPreviewImage(img)} 
            />
          </div>

          {/* Header Info */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{house.title}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Listing
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  {house.address || house.area}, {house.town}, {house.county}
                </p>
              </div>

              <div className="text-right sm:text-right bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Rent</span>
                <span className="text-2xl font-extrabold text-primary">
                  KES {house.monthly_rent ? Number(house.monthly_rent).toLocaleString() : "0"}
                </span>
              </div>
            </div>
          </div>

          {/* Key Amenities */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Key Features & Amenities</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <Wifi className="h-4 w-4 text-indigo-600" /> High-speed Wi-Fi
              </div>
              <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <Droplets className="h-4 w-4 text-blue-600" /> 24/7 Water Supply
              </div>
              <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <Bed className="h-4 w-4 text-amber-600" /> Fully Furnished Room
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-slate-900">About this Property</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {house.description || "No specific details provided by landlord for this accommodation option."}
            </p>
          </div>
        </div>

        {/* Sidebar / Inline Booking Form */}
        <div>
          <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reserve Unit</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  KES {house.monthly_rent ? Number(house.monthly_rent).toLocaleString() : "0"}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {house.available_rooms || 0} units left
                </span>
              </div>
            </div>

            {message.text && (
              <div
                className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-semibold ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {message.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              {availableRoomsList.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Select Specific Room / Unit
                  </label>
                  <select
                    required
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm"
                  >
                    <option value="">-- Choose available unit --</option>
                    {availableRoomsList.map((roomNum) => (
                      <option key={roomNum} value={roomNum}>
                        Unit {roomNum}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Expected Move-in Date
                </label>
                <input
                  type="date"
                  required
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Duration (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Special requests or questions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 p-4 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Submitting Request..." : "Request to Book Room"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center cursor-default"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2 focus:outline-none cursor-pointer bg-white/10 rounded-full"
              aria-label="Close preview"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged property view"
              className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
