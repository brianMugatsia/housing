import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Building, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  ShieldCheck,
  
} from "lucide-react";
import api from "../../services/api";

export default function BookingPage() {
  const { houseId } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const todayStr = new Date().toLocaleDateString("en-CA");

  const [formData, setFormData] = useState({
    house_number: "",
    move_in_date: "",
    duration_months: "12",
    notes: "",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${houseId}/`);
        if (isMounted) {
          setProperty(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch house details:", err);
        setError("Could not load property details. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (houseId) {
      fetchProperty();
    }

    return () => {
      isMounted = false;
    };
  }, [houseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/bookings/", {
        property: parseInt(houseId, 10),
        house_number: formData.house_number,
        move_in_date: formData.move_in_date,
        duration_months: parseInt(formData.duration_months, 10),
        notes: formData.notes,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/student/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Booking error:", err);
      
      const serverError = err.response?.data;
      if (typeof serverError === "object" && serverError !== null) {
        const firstKey = Object.keys(serverError)[0];
        const msg = Array.isArray(serverError[firstKey])
          ? serverError[firstKey][0]
          : serverError[firstKey];
        setError(msg || "Failed to submit booking request. Please check your inputs.");
      } else {
        setError("Failed to submit booking request. Please check your inputs.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading booking details...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900">Reserve Accommodation</h1>
            <p className="mt-1 text-sm text-slate-500">
              Submit your move-in request to the landlord for approval.
            </p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="mt-6 rounded-xl bg-emerald-50 p-6 text-center border border-emerald-200">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                <h3 className="mt-2 text-lg font-bold text-emerald-900">Request Submitted!</h3>
                <p className="mt-1 text-sm text-emerald-700">
                  Your booking request has been sent. Redirecting to your dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {/* House / Room Number Field */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    House / Room Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g., House 4B, Room 12, or Door A"
                      value={formData.house_number}
                      onChange={(e) =>
                        setFormData({ ...formData, house_number: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Expected Move-in Date
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={formData.move_in_date}
                    onChange={(e) =>
                      setFormData({ ...formData, move_in_date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Lease Duration
                  </label>
                  <select
                    value={formData.duration_months}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_months: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="3">3 Months (Semester)</option>
                    <option value="6">6 Months (Half Year)</option>
                    <option value="12">12 Months (Full Academic Year)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Additional Notes for Landlord (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mention any specific room requests, roommate choices, or queries..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {submitting ? "Submitting Application..." : "Confirm & Send Request"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Property Summary</h2>
            
            {property ? (
              <div className="space-y-4">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0].image}
                    alt={property.title}
                    className="h-40 w-full object-cover rounded-xl border border-slate-100"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <Building className="h-8 w-8" />
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{property.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {property.town}, {property.county}
                  </p>
                </div>

                <div className="border-t border-b border-slate-100 py-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Property Type</span>
                    <span className="font-semibold text-slate-800 uppercase">
                      {property.property_type?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available Units</span>
                    <span className="font-semibold text-slate-800">
                      {property.available_rooms}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Rent</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      KES {property.monthly_rent?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>No payment required until landlord approves your request.</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Property information unavailable.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}