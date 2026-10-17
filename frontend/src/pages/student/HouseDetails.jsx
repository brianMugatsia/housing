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
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Layers,
  KeyRound,
  ShieldAlert,
  GraduationCap
} from "lucide-react";
import api from "../../services/api";
import ImageCarousel, { resolveImageUrl } from "../../components/ImageCarousel";

export default function HouseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lightbox Modal State
  const [previewIndex, setPreviewIndex] = useState(null);

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

  const rawImages = house?.images || (house?.image ? [{ image: house.image }] : []);
  const resolvedImages = (Array.isArray(rawImages) ? rawImages : [rawImages])
    .map(resolveImageUrl)
    .filter(Boolean);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setPreviewIndex(null);
      if (previewIndex !== null && resolvedImages.length > 1) {
        if (e.key === "ArrowLeft") {
          setPreviewIndex((prev) => (prev === 0 ? resolvedImages.length - 1 : prev - 1));
        }
        if (e.key === "ArrowRight") {
          setPreviewIndex((prev) => (prev === resolvedImages.length - 1 ? 0 : prev + 1));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, resolvedImages.length]);

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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
          <p className="text-sm font-bold text-slate-600">Loading accommodation details...</p>
        </div>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="mx-auto max-w-xl py-24 text-center px-4">
        <Building2 className="mx-auto h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900">Property Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">{error || "The property you are looking for might have been removed or is unavailable."}</p>
        <button
          onClick={() => navigate("/houses")}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Return to House Listings
        </button>
      </div>
    );
  }

  const availableRoomsList = house.available_room_numbers || [];
  const universityName = house.university?.name || (typeof house.university === "string" ? house.university : null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Listings
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-4 w-4" /> Verified Student Housing
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Showcase Section */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Visuals Carousel Showcase */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-xl">
            <div className="h-[380px] sm:h-[480px]">
              <ImageCarousel 
                images={house.images || house.image} 
                title={house.title} 
                showThumbnails={true}
                rounded="rounded-3xl"
                onImageClick={(_, idx) => setPreviewIndex(idx)} 
              />
            </div>
          </div>

          {/* Primary Info Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-block rounded-lg bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-700">
                  {house.property_type?.replace(/_/g, " ") || "Apartment"} • {house.room_type?.replace(/_/g, " ") || "Single"}
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {house.title}
                </h1>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  {house.address || house.area || "Area unspecified"}, {house.town}, {house.county}
                </p>
                {universityName && (
                  <p className="flex items-center gap-2 text-xs font-bold text-primary">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    Proximity: Near {universityName} {house.distance_from_university ? `(${house.distance_from_university} km)` : ""}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 text-left sm:text-right shrink-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Semester Rent</span>
                <div className="flex items-baseline sm:justify-end gap-1">  
                  <span className="text-3xl font-black text-slate-900">     
                    KES {Number(house.semester_rent || 0).toLocaleString()}  
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ sem</span>
                </div>
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[10px]">Available Units</span>
                <span className="text-slate-900 font-extrabold text-sm">{house.available_rooms || 0} Units</span>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[10px]">Total Capacity</span>
                <span className="text-slate-900 font-extrabold text-sm">{house.total_rooms || "—"} Units</span>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[10px]">Restrictions</span>
                <span className="text-slate-900 font-extrabold text-sm">{house.gender_restriction?.replace(/_/g, " ") || "None"}</span>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[10px]">Host</span>
                <span className="text-slate-900 font-extrabold text-sm truncate block">{house.landlord?.full_name || "Verified Landlord"}</span>
              </div>
            </div>
          </div>

          {/* Key Amenities */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-black text-slate-900">Amenities & Living Standards</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs font-bold text-slate-700">
              {Array.isArray(house.amenities) && house.amenities.length > 0 ? (
                house.amenities.map((amenity) => (
                  <div key={amenity.id || amenity.name || amenity} className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{amenity.name || amenity}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                    <Wifi className="h-4 w-4 text-indigo-600 shrink-0" /> High-speed Wi-Fi
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                    <Droplets className="h-4 w-4 text-blue-600 shrink-0" /> 24/7 Clean Water
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                    <Bed className="h-4 w-4 text-amber-600 shrink-0" /> Spacious Rooms
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-3">
            <h2 className="text-xl font-black text-slate-900">About this Accommodation</h2>
            <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
              {house.description || "No specific details provided for this accommodation."}
            </p>
          </div>
        </div>

        {/* Sidebar / Reservation Booking Card */}
        <div>
          <div className="sticky top-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reserve Unit</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-black text-slate-900">       
                  KES {Number(house.semester_rent || 0).toLocaleString()}    
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  house.available_rooms > 0 
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-200" 
                    : "text-rose-700 bg-rose-50 border border-rose-200"
                }`}>
                  {house.available_rooms > 0 ? `${house.available_rooms} units left` : "Fully booked"}
                </span>
              </div>
            </div>

            {message.text && (
              <div
                className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-bold ${
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Select Specific Room / Unit
                  </label>
                  <select
                    required
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm cursor-pointer"
                  >
                    <option value="">-- Choose available unit --</option>
                    {availableRoomsList.map((roomNum) => (
                      <option key={roomNum} value={roomNum}>
                        Unit #{roomNum}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Expected Move-in Date
                </label>
                <input
                  type="date"
                  required
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Duration (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  required
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Special requests or inquiries for landlord..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm font-medium text-slate-900 bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || house.available_rooms === 0}
                className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-black text-white shadow-xl transition-all hover:bg-slate-800 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {submitting ? "Submitting Request..." : "Request to Book Room"}
              </button>
            </form>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-500 space-y-1.5">
              <p className="flex items-center gap-1.5 font-bold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                No immediate payment required
              </p>
              <p className="text-[11px]">
                Your booking request is sent to the landlord and system admin for review. Once approved, you can complete the full rent payment securely via M-Pesa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Lightbox Modal with Next/Prev Arrows */}
      {previewIndex !== null && resolvedImages[previewIndex] && (
        <div
          onClick={() => setPreviewIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center cursor-default"
          >
            {/* Top Bar with Counter and Close Button */}
            <div className="absolute -top-12 inset-x-0 flex items-center justify-between text-white px-2">
              <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                {previewIndex + 1} / {resolvedImages.length}
              </span>
              <button
                onClick={() => setPreviewIndex(null)}
                className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-all cursor-pointer"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Arrows */}
            {resolvedImages.length > 1 && (
              <>
                <button
                  onClick={() => setPreviewIndex((prev) => (prev === 0 ? resolvedImages.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white border border-white/20 backdrop-blur-md hover:bg-black/80 transition-all cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setPreviewIndex((prev) => (prev === resolvedImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white border border-white/20 backdrop-blur-md hover:bg-black/80 transition-all cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <img
              src={resolvedImages[previewIndex]}
              alt={`Full view ${previewIndex + 1}`}
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
