import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  UserCheck, 
  LogOut, 
  ArrowRightLeft, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Building2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Phone,
  RefreshCw,
  Wrench,
  MessageSquare,
  Sparkles
} from "lucide-react";
import api from "../../services/api";
import { vacateBooking, shiftRoom, approveBooking, rejectBooking } from "../../services/properties";
import MaintenanceSection from "../../components/MaintenanceSection";
import ChatModal from "../../components/ChatModal";
import { useToast } from "../../context/ToastContext";

export default function LandlordDashboard() {
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "maintenance"
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState({ id: null, name: "" });
  const { addToast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bookingsRes, propsRes] = await Promise.all([
        api.get("/bookings/"),
        api.get("/properties/?mine=true").catch(() => ({ data: [] })),
      ]);
      const bData = bookingsRes.data.results || bookingsRes.data || [];
      const pData = propsRes.data.results || propsRes.data || [];
      setBookings(Array.isArray(bData) ? bData : []);
      setProperties(Array.isArray(pData) ? pData : []);
    } catch (err) {
      console.error("Failed to load landlord dashboard:", err);
      setError("Failed to load dashboard data. Please try again.");
      addToast("Failed to load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatKES = (amt) => `KES ${Number(amt || 0).toLocaleString("en-KE")}`;

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const activeTenants = bookings.filter((b) => ["APPROVED", "DEPOSIT_PAID", "CONFIRMED"].includes(b.status));

  const semesterRevenue = activeTenants.reduce((sum, b) => {
    const rent = Number(b.property_details?.semester_rent || b.semester_rent || 0);
    return sum + rent;
  }, 0);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await approveBooking(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "APPROVED" } : b))
      );
      addToast("Booking approved successfully!", "success");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to approve booking.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    setActionId(id);
    try {
      await rejectBooking(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "REJECTED" } : b))
      );
      addToast("Booking request rejected.", "info");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to reject booking.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setActionId(null);
    }
  };

  const handleVacate = async (id) => {
    if (!window.confirm("Are you sure you want to check out this tenant?")) return;
    try {
      await vacateBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      addToast("Tenant checked out successfully.", "success");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to check out tenant.";
      setError(msg);
      addToast(msg, "error");
    }
  };

  const handleShiftRoom = async (id, currentRoom) => {
    const newRoom = prompt("Enter new room/house number for tenant:", currentRoom || "");
    if (!newRoom) return;
    try {
      await shiftRoom(id, newRoom);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, house_number: newRoom } : b))
      );
      addToast("Tenant room reassigned successfully!", "success");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to shift room.";
      setError(msg);
      addToast(msg, "error");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-10 animate-fadeIn">
      {/* Top Glassmorphism Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3.5 py-1 rounded-full border border-amber-400/20">
              <Sparkles className="h-3.5 w-3.5" /> Landlord Portal
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Property Management & Leasing
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl font-medium">
              Monitor reservations, review pending tenant applications in real-time, and oversee occupied properties across campuses.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/landlord/properties/new"
              className="rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-slate-900 shadow-xl hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              + Add New Property
            </Link>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white shadow-lg hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "overview" 
              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-105" 
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-xs"
          }`}
        >
          <Building2 className="h-4 w-4" /> Bookings & Occupants
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "maintenance" 
              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-105" 
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-xs"
          }`}
        >
          <Wrench className="h-4 w-4" /> Maintenance Tickets
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === "maintenance" ? (
        <div className="animate-slideInUp">
          <MaintenanceSection isLandlord={true} />
        </div>
      ) : (
        <div className="space-y-8 animate-slideInUp">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Monthly Revenue</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900">{formatKES(semesterRevenue)}</div>
              <span className="mt-1.5 block text-[11px] font-semibold text-emerald-600">From active tenants</span>
            </div>

            <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Pending Approvals</span>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${pendingBookings.length > 0 ? "bg-amber-100 text-amber-700 animate-pulse" : "bg-slate-100 text-slate-400"} group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300`}>
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900">{pendingBookings.length}</div>
              <span className={`mt-1.5 block text-[11px] font-semibold ${pendingBookings.length > 0 ? "text-amber-700" : "text-slate-400"}`}>
                {pendingBookings.length > 0 ? "Immediate action required" : "All requests reviewed"}
              </span>
            </div>

            <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Occupied Units</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <UserCheck className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900">{activeTenants.length}</div>
              <span className="mt-1.5 block text-[11px] font-semibold text-indigo-600">Active student occupants</span>
            </div>

            <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Listings</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900">{properties.length}</div>
              <span className="mt-1.5 block text-[11px] font-semibold text-slate-500">Properties on platform</span>
            </div>
          </div>

          {/* SECTION 1: Pending Booking Requests */}
          {pendingBookings.length > 0 && (
            <div className="rounded-3xl border-2 border-amber-300/80 bg-amber-50/40 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-200/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-ping" />
                  <h2 className="text-xl font-black text-slate-900">
                    Action Required: Pending Booking Requests ({pendingBookings.length})
                  </h2>
                </div>
                <Link
                  to="/landlord/bookings"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline"
                >
                  View all requests <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {pendingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base">
                            {b.property_details?.title || b.property?.title || "Property Unit"}
                          </h3>
                          {b.house_number && (
                            <span className="inline-block mt-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-700">
                              Unit #{b.house_number}
                            </span>
                          )}
                        </div>
                        <span className="text-right">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Rent</span>
                          <span className="font-black text-slate-900 text-sm">
                            {formatKES(b.property_details?.semester_rent || 0)}
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">Applicant</span>
                          <span className="font-bold text-slate-900">{b.student_name || "Student"}</span>
                          {b.student_phone && <span className="block text-[11px] text-slate-500">{b.student_phone}</span>}
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">Move-In</span>
                          <span className="font-bold text-slate-900">{b.move_in_date || "Flexible"}</span>
                          <span className="block text-[11px] text-slate-500">{b.duration_months || 1} months</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleApprove(b.id)}
                        disabled={actionId === b.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {actionId === b.id ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(b.id)}
                        disabled={actionId === b.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: Active Occupants / Tenants */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-black text-slate-900">Current Active Occupants</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 self-start">
                {activeTenants.length} Occupied Units
              </span>
            </div>

            {activeTenants.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No active occupants at this moment. Approved bookings will appear here once confirmed.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase font-black text-slate-400 tracking-wider">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Tenant</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Property</th>
                      <th className="px-4 py-3">Unit #</th>
                      <th className="px-4 py-3">Rent</th>
                      <th className="px-4 py-3">Move-In</th>
                      <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeTenants.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {booking.student_name || "Student Tenant"}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">
                          {booking.student_phone || "—"}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {booking.property_details?.title || `Property #${booking.property}`}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono font-bold text-slate-800 border border-slate-200">
                            {booking.house_number || "Unassigned"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-slate-900">
                          {formatKES(booking.property_details?.semester_rent || 0)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">{booking.move_in_date || "—"}</td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => { setChatRecipient({ id: booking.student, name: booking.student_name || "Tenant" }); setChatOpen(true); }}
                              className="flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                              title="Chat Tenant"
                            >
                              <MessageSquare className="h-3 w-3" /> Chat
                            </button>
                            <button
                              onClick={() => handleShiftRoom(booking.id, booking.house_number)}
                              className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Shift Unit"
                            >
                              <ArrowRightLeft className="h-3 w-3" /> Shift
                            </button>
                            <button
                              onClick={() => handleVacate(booking.id)}
                              className="flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Checkout Tenant"
                            >
                              <LogOut className="h-3 w-3" /> Checkout
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatOpen && (
        <ChatModal
          recipientId={chatRecipient.id}
          recipientName={chatRecipient.name}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
