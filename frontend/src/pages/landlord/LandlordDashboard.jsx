import { useEffect, useState, useCallback } from "react";
import { UserCheck, LogOut, ArrowRightLeft, AlertCircle } from "lucide-react";
import Card from "../../components/ui/Card";
import api from "../../services/api";
import { vacateBooking, shiftRoom } from "../../services/properties";

export default function LandlordDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function for manual re-fetching (e.g. after vacating or shifting rooms)
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const bookingsRes = await api.get("/bookings/");
      const data = bookingsRes.data.results || bookingsRes.data || [];
      setBookings(data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Unable to load active bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Safe initial data load on mount (prevents synchronous state updates in effect body)
  useEffect(() => {
    let ignore = false;

    const loadInitialData = async () => {
      try {
        const bookingsRes = await api.get("/bookings/");
        if (!ignore) {
          const data = bookingsRes.data.results || bookingsRes.data || [];
          setBookings(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load dashboard data:", err);
          setError("Unable to load active bookings.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleVacate = async (bookingId) => {
    if (!window.confirm("Confirm tenant checkout? This will free up 1 available unit.")) return;
    try {
      await vacateBooking(bookingId);
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to process checkout:", err);
      alert(err.response?.data?.error || "Failed to process checkout.");
    }
  };

  const handleShiftRoom = async (bookingId, currentRoom) => {
    const newRoom = window.prompt("Enter new room/house number:", currentRoom);
    if (!newRoom || newRoom === currentRoom) return;

    try {
      await shiftRoom(bookingId, newRoom);
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to update room number:", err);
      alert(err.response?.data?.error || "Failed to update room number.");
    }
  };

  const activeTenants = bookings.filter(
    (b) => b.status === "APPROVED" || b.status === "CONFIRMED"
  );

  const semesterRevenue = activeTenants.reduce((acc, booking) => {
    return acc + Number(booking.property_details?.monthly_rent || 0);
  }, 0);

  const formatKES = (amount) => {
    return `KSh ${Number(amount).toLocaleString("en-KE")}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      <Card className="p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Active Tenants</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 border border-emerald-200">
              Total Semester Revenue:{" "}
              <span className="text-sm font-bold text-emerald-700">
                {formatKES(semesterRevenue)}
              </span>
            </div>

            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {activeTenants.length} Occupied
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading active tenants...</div>
        ) : activeTenants.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No active tenants currently assigned to your properties.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tenant Name</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">House / Unit No.</th>
                  <th className="px-4 py-3">Rent Amount</th>
                  <th className="px-4 py-3">Move-In Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTenants.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {booking.student_name || "Student Tenant"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {booking.student_phone || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      {booking.property_details?.title || `Property #${booking.property}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-mono font-bold text-slate-800 border border-slate-200">
                        {booking.house_number || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatKES(booking.property_details?.monthly_rent || 0)}
                    </td>
                    <td className="px-4 py-3">{booking.move_in_date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleShiftRoom(booking.id, booking.house_number)}
                          className="flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                          title="Shift Room"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" /> Shift
                        </button>

                        <button
                          onClick={() => handleVacate(booking.id)}
                          className="flex items-center gap-1 rounded bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                          title="Vacate Property"
                        >
                          <LogOut className="h-3.5 w-3.5" /> Vacate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}