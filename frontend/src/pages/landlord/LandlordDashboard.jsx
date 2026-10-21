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
import { useAuth } from "../../context/AuthContext";

const formatKES = (amount) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
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
      const [bookingsRes, propsRes, convsRes] = await Promise.all([
        api.get("/bookings/"),
        api.get("/properties/?mine=true").catch(() => ({ data: [] })),      
        api.get("/messages/conversations/").catch(() => ({ data: [] })),
      ]);
      const bData = bookingsRes.data.results || bookingsRes.data || [];
      const pData = propsRes.data.results || propsRes.data || [];
      const cData = convsRes.data || [];
      setBookings(Array.isArray(bData) ? bData : []);
      setProperties(Array.isArray(pData) ? pData : []);

      const map = {};
      cData.forEach((c) => {
        map[c.user_id] = c.has_unread;
      });
      setUnreadMap(map);
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

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await approveBooking(id);
      addToast("Booking approved successfully.", "success");
      await fetchDashboardData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to approve booking.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter rejection reason (optional):");
    setActionId(id);
    try {
      await rejectBooking(id, reason || "");
      addToast("Booking rejected.", "info");
      await fetchDashboardData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to reject booking.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleVacate = async (id) => {
    if (!window.confirm("Are you sure this tenant is vacating? This will release the unit back to available pool.")) return;
    setActionId(id);
    try {
      await vacateBooking(id);
      addToast("Tenant checked out successfully. Unit released.", "success");
      await fetchDashboardData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to process vacation.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleShift = async (id) => {
    const newUnit = prompt("Enter new room/house number:");
    if (!newUnit) return;
    setActionId(id);
    try {
      await shiftRoom(id, newUnit.trim());
      addToast("Tenant room updated successfully.", "success");
      await fetchDashboardData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to update room.", "error");
    } finally {
      setActionId(null);
    }
  };

  const activeTenants = bookings.filter(
    (b) => ["APPROVED", "CONFIRMED"].includes(b.status)
  );
  const pendingRequests = bookings.filter((b) => b.status === "PENDING");

  const totalRevenue = activeTenants.reduce((sum, b) => {
    return sum + Number(b.property_details?.semester_rent || 0);
  }, 0);

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-3.5 w-3.5" /> Landlord Portal
          </span>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Welcome back, {user?.full_name || "Landlord"}
          </h1>
          <p className="text-xs text-slate-400">
            Manage your properties, review incoming tenant bookings, and track active room occupancy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/landlord/properties/new"
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold text-slate-900 shadow-lg hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Building2 className="h-4 w-4" /> Add New Property
          </Link>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Bookings & Occupants
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer ${
            activeTab === "maintenance"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Maintenance Requests
        </button>
      </div>

      {activeTab === "maintenance" ? (
        <MaintenanceSection />
      ) : (
        <div className="space-y-8">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Listings</span>
              <span className="mt-2 block text-3xl font-black text-slate-900">{properties.length}</span>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Occupants</span>
              <span className="mt-2 block text-3xl font-black text-emerald-600">{activeTenants.length}</span>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expected Semester Revenue</span>
              <span className="mt-2 block text-3xl font-black text-slate-900">{formatKES(totalRevenue)}</span>
            </div>
          </div>

          {/* SECTION 1: Pending Approvals */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-black text-slate-900">Pending Student Bookings</h2>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                {pendingRequests.length} Pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No pending student bookings to review.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-800 border border-slate-200">
                        Unit #{booking.house_number || "Any"}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{booking.move_in_date}</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900">{booking.student_name || "Student Tenant"}</h4>
                      <p className="text-xs text-slate-600">{booking.property_details?.title || `Property #${booking.property}`}</p>
                    </div>
                    {booking.notes && (
                      <p className="text-xs italic text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                        "{booking.notes}"
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={actionId === booking.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={actionId === booking.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-500 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                              className="relative flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>Chat</span>
                              {unreadMap[booking.student] && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" title="New unread message" />
                              )}
                            </button>
                            <button
                              onClick={() => handleShift(booking.id)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Shift Room"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleVacate(booking.id)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              title="Mark as Vacated"
                            >
                              <XCircle className="h-3.5 w-3.5" />
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
