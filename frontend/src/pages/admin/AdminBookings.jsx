import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../services/api";
import AdminNav from "../../components/AdminNav";
import { 
  CheckCircle, 
  XCircle, 
  Receipt, 
  Clock, 
  AlertCircle, 
  Building2, 
  User, 
  Calendar, 
  Phone, 
  Search,
  CheckCircle2,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

const PAYMENT_STATUS_STYLE = {
  COMPLETED: { icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  PENDING: { icon: <Clock className="h-3.5 w-3.5 text-amber-500" />, cls: "bg-amber-50 text-amber-700 border-amber-100" },
  FAILED: { icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />, cls: "bg-red-50 text-red-700 border-red-100" },
  CANCELLED: { icon: <XCircle className="h-3.5 w-3.5 text-slate-400" />, cls: "bg-slate-50 text-slate-700 border-slate-100" },
};

const STATUS_VARIANTS = {
  PENDING: { label: "Pending Approval", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approved (Awaiting Payment)", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DEPOSIT_PAID: { label: "Payment In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  CONFIRMED: { label: "Confirmed Tenant", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  REJECTED: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-50 text-slate-700 border-slate-200" },
  VACATED: { label: "Vacated", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [paymentsByBooking, setPaymentsByBooking] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Reject modal state
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setActionError("");
    try {
      const [bookingsRes, paymentsRes] = await Promise.all([
        api.get("/bookings/"),
        api.get("/payments/landlord/").catch(() => ({ data: [] })),
      ]);

      const bookingsData = bookingsRes.data.results || bookingsRes.data || [];
      const paymentsData = paymentsRes.data.results || paymentsRes.data || [];

      const grouped = {};
      (Array.isArray(paymentsData) ? paymentsData : []).forEach((p) => {
        if (!grouped[p.booking]) grouped[p.booking] = {};
        if (!grouped[p.booking][p.phase]) {
          grouped[p.booking][p.phase] = p;
        }
      });

      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setPaymentsByBooking(grouped);
    } catch (err) {
      console.error("Failed to load admin bookings", err);
      setActionError("Failed to fetch system bookings. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (id, status, reason = "") => {
    setProcessingId(id);
    setActionError("");
    try {
      const payload = { status };
      if (reason) payload.reason = reason;

      const response = await api.patch(`/bookings/${id}/`, payload);
      const updatedBooking = response.data;

      setBookings((prevBookings) =>
        prevBookings.map((b) => (b.id === id ? { ...b, ...updatedBooking } : b))
      );
      if (rejectingBooking) setRejectingBooking(null);
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to update booking status");
    } finally {
      setProcessingId(null);
    }
  };

  const formatKES = (amount) => `KES ${Number(amount || 0).toLocaleString("en-KE")}`;

  const renderPaymentLine = (label, payment) => {
    if (!payment) return null;
    const style = PAYMENT_STATUS_STYLE[payment.status] || {};
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold ${style.cls}`}>
        {style.icon}
        <span>{label}: {formatKES(payment.amount)}</span>
        {payment.mpesa_receipt_number && (
          <span className="opacity-60 font-mono text-[10px]">#{payment.mpesa_receipt_number}</span>
        )}
      </div>
    );
  };

  const counts = useMemo(() => {
    return bookings.reduce(
      (acc, b) => {
        acc.total += 1;
        if (b.status === "PENDING") acc.pending += 1;
        if (b.status === "APPROVED") acc.approved += 1;
        if (b.status === "DEPOSIT_PAID") acc.depositPaid += 1;
        if (b.status === "CONFIRMED") acc.confirmed += 1;
        if (b.status === "REJECTED" || b.status === "CANCELLED") acc.rejected += 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, depositPaid: 0, confirmed: 0, rejected: 0 }
    );
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const title = (b.property_details?.title || b.property?.title || "").toLowerCase();
      const studentName = (b.student_name || "").toLowerCase();
      const phone = (b.student_phone || "").toLowerCase();
      const unit = String(b.house_number || "").toLowerCase();
      const landlord = String(b.property_details?.landlord?.full_name || "").toLowerCase();

      return title.includes(term) || studentName.includes(term) || phone.includes(term) || unit.includes(term) || landlord.includes(term);
    });
  }, [bookings, statusFilter, searchTerm]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-10 animate-fadeIn">
      {/* Shared Admin Navigation Header */}
      <AdminNav 
        title="Student Bookings & Approvals" 
        subtitle="Full administrative control to approve, reject, and monitor room reservations across all properties."
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
          <div className="mt-2 text-2xl font-black text-slate-900">{counts.total}</div>
          <span className="text-[11px] font-semibold text-slate-500">Across entire platform</span>
        </div>

        <div className="rounded-3xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Approvals</span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-900">{counts.pending}</div>
          <span className="text-[11px] font-semibold text-amber-800">Awaiting landlord/admin action</span>
        </div>

        <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Awaiting Payment</span>
          <div className="mt-2 text-2xl font-black text-blue-900">{counts.approved}</div>
          <span className="text-[11px] font-semibold text-blue-700">Approved, pending student checkout</span>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Confirmed Occupants</span>
          <div className="mt-2 text-2xl font-black text-emerald-900">{counts.confirmed}</div>
          <span className="text-[11px] font-semibold text-emerald-700">Active students in housing</span>
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 text-rose-700 text-xs font-bold flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "ALL", label: `All (${counts.total})` },
            { id: "PENDING", label: `Pending Approval (${counts.pending})` },
            { id: "APPROVED", label: `Approved (${counts.approved})` },
            ...(counts.depositPaid > 0 ? [{ id: "DEPOSIT_PAID", label: `Payment In Progress (${counts.depositPaid})` }] : []),
            { id: "CONFIRMED", label: `Confirmed (${counts.confirmed})` },
            { id: "REJECTED", label: `Rejected (${counts.rejected})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-black rounded-2xl border transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, landlord, unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-20 text-center">
          <Building2 className="mx-auto h-16 w-16 text-slate-200 stroke-[1.5]" />
          <h3 className="mt-4 text-xl font-bold text-slate-900">Zero Bookings Found</h3>
          <p className="mt-2 text-slate-500 text-sm">
            {statusFilter !== "ALL" ? "No applications found under this filter." : "Student reservations will display here as they are submitted."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBookings.map((booking) => {
            const title = booking.property_details?.title || booking.property?.title || "Housing Unit";
            const studentName = booking.student_name || "Student User";
            const payments = paymentsByBooking[booking.id] || {};
            const statusConfig = STATUS_VARIANTS[booking.status] || { label: booking.status, cls: "bg-slate-50 text-slate-700 border-slate-200" };
            const isProcessing = processingId === booking.id;
            const landlordInfo = booking.property_details?.landlord?.full_name || "Assigned Landlord";

            return (
              <div 
                key={booking.id} 
                className={`group overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all hover:shadow-xl ${
                  booking.status === "PENDING" ? "border-amber-300 ring-2 ring-amber-500/10" : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-black text-slate-900">{title}</h3>
                      {booking.house_number && (
                        <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 border border-slate-200">
                          Unit #{booking.house_number}
                        </span>
                      )}
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusConfig.cls}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {/* Student Info */}
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-slate-600">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Student Applicant</span>
                          <span className="font-extrabold text-slate-900 text-sm">{studentName}</span>
                          {booking.student_phone && (
                            <a href={`tel:${booking.student_phone}`} className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline">
                              <Phone className="h-3 w-3" /> {booking.student_phone}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Landlord Info */}
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-slate-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Property Host</span>
                          <span className="font-extrabold text-slate-900 text-sm">{landlordInfo}</span>
                          {booking.landlord_phone && (
                            <a href={`tel:${booking.landlord_phone}`} className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline">
                              <Phone className="h-3 w-3" /> {booking.landlord_phone}
                            </a>
                          )}
                          <span className="block text-[11px] text-slate-400 font-medium">Rent: {formatKES(booking.property_details?.semester_rent || 0)}</span>
                        </div>
                      </div>

                      {/* Timeline & Payments */}
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-slate-600">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Timeline & Stay</span>
                          <span className="font-extrabold text-slate-900 text-sm">{booking.move_in_date || "Flexible"}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{booking.duration_semesters || 1} semester{booking.duration_semesters > 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Indicators */}
                    {(payments.DEPOSIT || payments.RENT) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {renderPaymentLine("Deposit", payments.DEPOSIT)}
                        {renderPaymentLine("Rent", payments.RENT)}
                      </div>
                    )}
                  </div>

                  {/* Admin Direct Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-4 lg:pt-0 border-t border-slate-100 lg:border-none">
                    {booking.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, "APPROVED")}
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {isProcessing ? "Approving..." : "Approve Booking"}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingBooking(booking);
                            setRejectReason("");
                          }}
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-5 py-3 font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}

                    {booking.status === "APPROVED" && (
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Awaiting deposit</span>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, "CONFIRMED")}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Confirm Tenant
                        </button>
                        <button
                          onClick={() => {
                            setRejectingBooking(booking);
                            setRejectReason("");
                          }}
                          disabled={isProcessing}
                          className="text-xs font-bold text-rose-600 hover:underline px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {booking.status === "DEPOSIT_PAID" && (
                      <button
                        onClick={() => handleStatusUpdate(booking.id, "CONFIRMED")}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isProcessing ? "Confirming..." : "Confirm Tenant"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingBooking && (
        <div 
          onClick={() => setRejectingBooking(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Admin Rejection Note</h3>
              <button onClick={() => setRejectingBooking(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Reject booking for <strong className="text-slate-900">{rejectingBooking.student_name || "this student"}</strong> on property <strong className="text-slate-900">{rejectingBooking.property_details?.title || "this unit"}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Administrative Reason / Note
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Unit mismatch, invalid contact details..."
                  className="w-full p-3 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setRejectingBooking(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(rejectingBooking.id, "REJECTED", rejectReason)}
                disabled={processingId === rejectingBooking.id}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
