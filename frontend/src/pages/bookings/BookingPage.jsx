import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  ShieldCheck
} from "lucide-react";
import api from "../../services/api";

const DURATION_OPTIONS = [
  { value: "1", label: "1 Semester", semesters: 1 },
  { value: "2", label: "2 Semesters", semesters: 2 },
  { value: "3", label: "3 Semesters", semesters: 3 },
];

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
    duration_semesters: "1",
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
        console.error("Failed to fetch property details:", err);
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

  const getAvailableRooms = () => {
    if (!property) return [];

    let raw = property.available_room_numbers || property.room_numbers || [];

    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        raw = raw.split(",").map((s) => s.trim());
      }
    }

    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((room) => {
        const strVal = String(room).trim();
        const hasPrefix = /^(room|house|unit|apt|apartment|flat)\b/i.test(strVal);
        return {
          value: strVal,
          label: hasPrefix ? strVal : `Room ${strVal}`,
        };
      });
    }

    return [];
  };

  const availableRoomsList = getAvailableRooms();

  const selectedDuration = DURATION_OPTIONS.find(
    (d) => d.value === formData.duration_semesters
  ) || DURATION_OPTIONS[0];

  const semesterRent = Number(property?.semester_rent) || 0;
  const totalRentDue = semesterRent * selectedDuration.semesters;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/bookings/", {
        property: parseInt(houseId, 10),
        house_number: formData.house_number,
        move_in_date: formData.move_in_date,
        duration_semesters: parseInt(formData.duration_semesters, 10),
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
        setError(msg || "Failed to submit booking request.");
      } else {
        setError("Failed to submit booking request.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading property details...
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
                  Your request was sent. Redirecting...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Select House / Room Number
                  </label>
                  {availableRoomsList.length > 0 ? (
                    <select
                      required
                      value={formData.house_number}
                      onChange={(e) =>
                        setFormData({ ...formData, house_number: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white"
                    >
                      <option value="">-- Choose an available unit --</option>
                      {availableRoomsList.map((room) => (
                        <option key={room.value} value={room.value}>
                          {room.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g., Room 26"
                      value={formData.house_number}
                      onChange={(e) =>
                        setFormData({ ...formData, house_number: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                    />
                  )}
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Lease Duration (Semesters)
                  </label>
                  <select
                    value={formData.duration_semesters}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_semesters: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {selectedDuration.semesters} semester{selectedDuration.semesters > 1 ? "s" : ""} at KES{" "}
                    {semesterRent.toLocaleString()} each ={" "}
                    <span className="font-semibold text-slate-700">
                      KES {totalRentDue.toLocaleString()} total
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Notes for Landlord (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mention specific room requests or questions..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-900"
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

            {property && (
              <div className="space-y-4">
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
                    <span className="font-semibold text-slate-800">
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
                    <span className="text-slate-500">Rent / Semester</span>
                    <span className="font-semibold text-slate-800">
                      KES {semesterRent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-600 font-semibold">Total Due</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      KES {totalRentDue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>No payment required until approval.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
