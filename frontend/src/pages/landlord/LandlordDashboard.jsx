import { useEffect, useState } from "react";
import { UserCheck, LogOut, ArrowRightLeft } from "lucide-react";
import Card from "../../components/ui/Card";
import api from "../../services/api";

export default function LandlordDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const bookingsRes = await api.get("/bookings/");
        if (isMounted) {
          setBookings(bookingsRes.data.results || bookingsRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Case 1: Handle complete checkout/vacate
  const handleVacate = async (bookingId) => {
    if (!window.confirm("Confirm tenant checkout? This will free up 1 available unit.")) return;
    try {
      await api.post(`/bookings/${bookingId}/vacate/`);
      const bookingsRes = await api.get("/bookings/");
      setBookings(bookingsRes.data.results || bookingsRes.data || []);
    } catch (err) {
      console.error("Failed to process checkout:", err);
      alert("Failed to process checkout.");
    }
  };

  // Case 2: Handle room shift
  const handleShiftRoom = async (bookingId, currentRoom) => {
    const newRoom = window.prompt("Enter new room/house number:", currentRoom);
    if (!newRoom || newRoom === currentRoom) return;

    try {
      await api.patch(`/bookings/${bookingId}/shift-room/`, {
        new_house_number: newRoom,
      });
      const bookingsRes = await api.get("/bookings/");
      setBookings(bookingsRes.data.results || bookingsRes.data || []);
    } catch (err) {
      console.error("Failed to update room number:", err);
      alert("Failed to update room number.");
    }
  };

  const activeTenants = bookings.filter(
    (b) => b.status === "APPROVED" || b.status === "CONFIRMED"
  );

  const monthlyRevenue = activeTenants.reduce((acc, booking) => {
    return acc + Number(booking.property_details?.monthly_rent || 0);
  }, 0);

  // Helper function to format currency in Kenya Shillings (KES)
  const formatKES = (amount) => {
    return `KSh ${Number(amount).toLocaleString("en-KE")}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      {/* Active Tenants Section */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Active Tenants</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Total Monthly Revenue Card / Badge */}
            <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 border border-emerald-200">
              Total Monthly Revenue: <span className="text-sm font-bold text-emerald-700">{formatKES(monthlyRevenue)}</span>
            </div>

            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {activeTenants.length} Occupied
            </span>
          </div>
        </div>

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
                      {booking.student_name || booking.student_details?.full_name || "Student Tenant"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {booking.student_phone || booking.student_details?.phone_number || "N/A"}
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
                        {/* Shift Room Action */}
                        <button
                          onClick={() => handleShiftRoom(booking.id, booking.house_number)}
                          className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                          title="Shift Room"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" /> Shift
                        </button>

                        {/* Vacate/Checkout Action */}
                        <button
                          onClick={() => handleVacate(booking.id)}
                          className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
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