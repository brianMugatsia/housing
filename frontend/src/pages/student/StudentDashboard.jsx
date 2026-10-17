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
  Building2
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Approved: Pay Full Amount
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800 border border-indigo-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" /> Confirmed (Paid in Full)
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Pending Approval
          </span>
        );
      case "CANCELLED":
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">
            <XCircle className="h-3.5 w-3.5 text-rose-600" /> {status === "REJECTED" ? "Rejected" : "Cancelled"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
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
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all"
        >
          Pay Full Amount <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      );
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full">
            Student Portal
          </span>
          <h1 className="mt-3 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Welcome, {user?.first_name || user?.username || "Student"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your housing reservations, track landlord approvals, and submit maintenance tickets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/houses"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            Explore More Houses
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "bookings" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building className="h-4 w-4" /> Housing Applications ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "maintenance" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Wrench className="h-4 w-4" /> Maintenance & Repairs
        </button>
      </div>

      {activeTab === "maintenance" ? (
        <MaintenanceSection isLandlord={false} />
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Housing</p>
                  <p className="text-2xl font-black text-slate-900">
                    {bookings.filter((b) => ["APPROVED", "DEPOSIT_PAID", "CONFIRMED"].includes(b.status)).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Review</p>
                  <p className="text-2xl font-black text-slate-900">
                    {bookings.filter((b) => b.status === "PENDING").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Requests</p>
                  <p className="text-2xl font-black text-slate-900">{bookings.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Your Housing Applications</h2>
              <span className="text-xs font-bold text-slate-400">{bookings.length} submissions</span>
            </div>

            {loading ? (
              <div className="p-16 text-center text-slate-500">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent mb-2"></div>
                <p className="text-xs font-bold">Loading your applications...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-16 text-center">
                <Building2 className="mx-auto h-12 w-12 text-slate-300 stroke-[1.5]" />
                <h3 className="mt-4 text-base font-black text-slate-900">No applications submitted yet</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Find verified student houses and submit booking requests directly to landlords.
                </p>
                <Link
                  to="/houses"
                  className="mt-5 inline-block rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer"
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
                    <div key={booking.id} className="p-6 transition hover:bg-slate-50/60">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-black text-slate-900">
                              {title}
                            </h3>
                            {booking.house_number && (
                              <span className="rounded-xl bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-700 border border-slate-200">
                                Unit #{booking.house_number}
                              </span>
                            )}
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {town}{county ? `, ${county}` : ""}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              Move-in: {booking.move_in_date || "Flexible"}
                            </span>
                            <span className="text-slate-400">
                              ({booking.duration_months || 1} months stay)
                            </span>
                          </div>

                          {booking.notes && (
                            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-xl">
                              <strong className="text-slate-700">Notes:</strong> {booking.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:justify-end shrink-0 flex-wrap">
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Semester Rent</p>
                            <p className="text-base font-black text-slate-900">
                              {rent ? `KES ${Number(rent).toLocaleString()}` : "KES N/A"}
                            </p>
                          </div>

                          {renderPaymentButton(booking)}

                          {landlordId && (
                            <button
                              onClick={() => { setChatRecipient({ id: landlordId, name: landlordName }); setChatOpen(true); }}
                              className="flex items-center gap-1.5 rounded-2xl bg-indigo-50 border border-indigo-200 px-4 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 cursor-pointer shadow-xs"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Chat
                            </button>
                          )}

                          {propId && (
                            <Link
                              to={`/houses/${propId}`}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:shadow-xs shadow-xs"
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
        </>
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
