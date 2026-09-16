import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Building, 
  Calendar, 
  CreditCard, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStudentData = async () => {
      try {
        const res = await api.get("/bookings/");
        if (isMounted) {
          const rawData = Array.isArray(res.data)
            ? res.data
            : res.data?.results || [];
          setBookings(rawData);
        }
      } catch (err) {
        console.error("Failed to fetch student bookings:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudentData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Confirmed
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Clock className="h-3 w-3" /> Pending Approval
          </span>
        );
      case "CANCELLED":
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            <AlertCircle className="h-3 w-3" /> {status || "Processing"}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome, {user?.first_name || user?.username || "Student"}
          </h1>
          <p className="mt-1 text-slate-500">
            Manage your housing reservations, rental payments, and saved listings.
          </p>
        </div>
        <Link
          to="/houses"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Explore Houses
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Active Bookings</p>
              <p className="text-xl font-bold text-slate-900">
                {bookings.filter((b) => b.status === "APPROVED" || b.status === "CONFIRMED").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pending Requests</p>
              <p className="text-xl font-bold text-slate-900">
                {bookings.filter((b) => b.status === "PENDING").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Requests Sent</p>
              <p className="text-xl font-bold text-slate-900">{bookings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Your Housing Applications</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading your reservations...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <Building className="mx-auto h-10 w-10 text-slate-400 stroke-[1.5]" />
            <h3 className="mt-3 text-base font-semibold text-slate-900">No housing requests yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Browse available listings near your campus and submit a booking request.
            </p>
            <Link
              to="/houses"
              className="mt-4 inline-block rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Browse Available Rooms
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((booking) => {
              // Extract property object or fallback to flat fields
              const prop = booking.property_details || (typeof booking.property === "object" ? booking.property : {});
              const propId = prop.id || (typeof booking.property !== "object" ? booking.property : null);
              
              const title = prop.title || booking.property_title || "Housing Unit";
              const town = prop.town || prop.city || booking.town || "N/A";
              const county = prop.county || prop.state || booking.county || "N/A";
              const rent = prop.monthly_rent || prop.price || booking.monthly_rent;

              return (
                <div key={booking.id} className="p-6 transition hover:bg-slate-50/50">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {title}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {town}, {county}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Move-in: {booking.move_in_date || "Flexible"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="text-right sm:text-right">
                        <p className="text-xs text-slate-400">Monthly Rent</p>
                        <p className="text-sm font-bold text-slate-900">
                          {rent ? `KES ${Number(rent).toLocaleString()}` : "KES N/A"}
                        </p>
                      </div>

                      {propId && (
                        <Link
                          to={`/houses/${propId}`}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white hover:shadow-sm"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}