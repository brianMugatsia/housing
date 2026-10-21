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
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Wrench,
  Building2,
  Sparkles
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import MaintenanceSection from "../../components/MaintenanceSection";
import ChatModal from "../../components/ChatModal";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings"); // "bookings" | "maintenance"
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState({ id: null, name: "" });

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
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-xs animate-pulse">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Approved: Pay Full Amount
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-800 border border-indigo-200 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" /> Confirmed (Paid in Full)
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 border border-amber-200 shadow-xs">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Pending Approval
          </span>
        );
      case "CANCELLED":
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800 border border-rose-200 shadow-xs">
            <XCircle className="h-3.5 w-3.5 text-rose-600" /> {status === "REJECTED" ? "Rejected" : "Cancelled"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 border border-slate-200 shadow-xs">
            <AlertCircle className="h-3.5 w-3.5" /> {status || "Processing"}
          </span>
        );
    }
  };

  const renderPaymentButton = (booking) => {
    if (booking.status === "APPROVED") {
      return (
        <Link
          to={`/pay/${booking.id}`}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all cursor-pointer"
        >
          Pay Full Amount <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      );
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Header with Glassmorphism Effect */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3.5 py-1 rounded-full border border-amber-400/20">
              <Sparkles className="h-3.5 w-3.5" /> Student Living Portal
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Welcome back, {user?.first_name || user?.username || "Student"}!
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl font-medium">
              Manage your verified student housing reservations, track landlord approvals in real-time, and submit maintenance tickets seamlessly.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/houses"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-slate-900 shadow-xl hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              Explore More Houses
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "bookings" 
              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-105" 
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-xs"
          }`}
        >
          <Building className="h-4 w-4" /> Housing Applications ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "maintenance" 
              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-105" 
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-xs"
          }`}
        >
          <Wrench className="h-4 w-4" /> Maintenance & Repairs
        </button>
      </div>

      {activeTab === "maintenance" ? (
        <div className="animate-slideInUp">
          <MaintenanceSection isLandlord={false} />
        </div>
      ) : (
        <div className="space-y-8 animate-slideInUp">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                  <Building className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Active Housing</p>
                  <p className="text-3xl font-black text-slate-900 mt-0.5">
                    {bookings.filter((b) => ["APPROVED", "DEPOSIT_PAID", "CONFIRMED"].includes(b.status)).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                  <Clock className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Pending Review</p>
                  <p className="text-3xl font-black text-slate-900 mt-0.5">
                    {bookings.filter((b) => b.status === "PENDING").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                  <CreditCard className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Requests</p>
                  <p className="text-3xl font-black text-slate-900 mt-0.5">{bookings.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-900">Your Housing Applications</h2>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
                {bookings.length} total submissions
              </span>
            </div>

            {loading ? (
              <div className="p-20 text-center text-slate-500">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent mb-3"></div>
                <p className="text-xs font-black">Loading your applications...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-20 text-center space-y-3">
                <Building2 className="mx-auto h-16 w-16 text-slate-300 stroke-[1.5]" />
                <h3 className="text-lg font-black text-slate-900">No applications submitted yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Find verified student houses near your campus and submit booking requests directly to landlords.
                </p>
                <Link
                  to="/houses"
                  className="mt-4 inline-block rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Browse Available Rooms
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {bookings.map((booking) => {
                  const prop = booking.property_details || (typeof booking.property === "object" ? booking.property : {});
                  const propId = prop.id || (typeof booking.property !== "object" ? booking.property : null);
                  const landlordId = prop.landlord?.id || prop.landlord;
                  const landlordName = prop.landlord?.full_name || "Landlord";

                  const title = prop.title || booking.property_title || "Housing Unit";
                  const town = prop.town || prop.city || booking.town || "Campus area";
                  const county = prop.county || prop.state || booking.county || "";
                  const rent = prop.semester_rent || prop.price || booking.semester_rent;

                  return (
                    <div key={booking.id} className="p-6 transition-all duration-200 hover:bg-slate-50/80">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">
                              {title}
                            </h3>
                            {booking.house_number && (
                              <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 border border-slate-200 shadow-xs">
                                Unit #{booking.house_number}
                              </span>
                            )}
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              {town}{county ? `, ${county}` : ""}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              Move-in: <strong className="text-slate-700">{booking.move_in_date || "Flexible"}</strong>
                            </span>
                            <span className="text-slate-400">
                              ({booking.duration_semesters || 1} semester{booking.duration_semesters > 1 ? "s" : ""})
                            </span>
                          </div>

                          {booking.notes && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 max-w-xl">
                              <strong className="text-slate-900">Applicant Notes:</strong> {booking.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3 lg:justify-end shrink-0 flex-wrap pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          <div className="text-left lg:text-right">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Semester Rent</p>
                            <p className="text-lg font-black text-slate-900 mt-0.5">
                              {rent ? `KES ${Number(rent).toLocaleString()}` : "KES N/A"}
                            </p>
                          </div>

                          {renderPaymentButton(booking)}

                          {landlordId && (
                            <button
                              onClick={() => { setChatRecipient({ id: landlordId, name: landlordName }); setChatOpen(true); }}
                              className="flex items-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-200 px-5 py-2.5 text-xs font-black text-indigo-700 transition hover:bg-indigo-100 active:scale-95 cursor-pointer shadow-xs"
                            >
                              <MessageSquare className="h-4 w-4" /> Chat Host
                            </button>
                          )}

                          {propId && (
                            <Link
                              to={`/houses/${propId}`}
                              className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-95 shadow-xs"
                            >
                              View Listing
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
