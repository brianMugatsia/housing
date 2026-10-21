import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../services/api";
import Button from "../../components/ui/Button";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar, 
  Building2, 
  Phone, 
  Search, 
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Receipt
} from "lucide-react";

const PAYMENT_STATUS_STYLE = {
  COMPLETED: { icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  PENDING: { icon: <Clock className="h-3.5 w-3.5 text-amber-500" />, cls: "bg-amber-50 text-amber-700 border-amber-100" },
  FAILED: { icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />, cls: "bg-red-50 text-red-700 border-red-100" },
  CANCELLED: { icon: <XCircle className="h-3.5 w-3.5 text-slate-400" />, cls: "bg-slate-50 text-slate-700 border-slate-100" },
};

const STATUS_CONFIG = {
  PENDING: { label: "Pending Approval", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approved (Awaiting Payment)", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DEPOSIT_PAID: { label: "Payment In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  CONFIRMED: { label: "Confirmed Tenant", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  REJECTED: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-50 text-slate-700 border-slate-200" },
  VACATED: { label: "Vacated", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function LandlordBookings() {
  const [bookings, setBookings] = useState([]);
  const [paymentsByBooking, setPaymentsByBooking] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
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
      console.error("Failed to load landlord bookings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (id, status, reason = "") => {
    setProcessingId(id);
    try {
      const payload = { status };
      if (reason) payload.reason = reason;

      const response = await api.patch(`/bookings/${id}/`, payload);
      const updated = response.data;

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
      );
      if (rejectingBooking) setRejectingBooking(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update booking status");
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
        return acc;
      },
      { total: 0, pending: 0, approved: 0, depositPaid: 0, confirmed: 0 }
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

      return title.includes(term) || studentName.includes(term) || phone.includes(term) || unit.includes(term);
    });
  }, [bookings, statusFilter, searchTerm]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full">
            Landlord Operations
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Booking Requests & Approvals
          </h1>
          <p className="mt-2 text-slate-500">
            Review incoming student applications, approve or reject bookings, and track payments.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex h-11 items-center gap-2 rounded-2xl bg-white px-5 py-2 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 transition-all cursor-pointer self-start"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Requests
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "ALL", label: `All (${counts.total})` },
            { id: "PENDING", label: `Pending Approval (${counts.pending})`, badge: counts.pending > 0 },
            { id: "APPROVED", label: `Approved (${counts.approved})` },
            ...(counts.depositPaid > 0 ? [{ id: "DEPOSIT_PAID", label: `Payment In Progress (${counts.depositPaid})` }] : []),
            { id: "CONFIRMED", label: `Confirmed (${counts.confirmed})` },
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
            placeholder="Search student, unit, property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
          <Calendar className="mx-auto h-12 w-12 text-slate-300 stroke-[1.5]" />
          <h3 className="mt-3 text-lg font-bold text-slate-900">No booking requests found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {statusFilter !== "ALL" ? "No applications match this filter." : "Student bookings will appear here as soon as they submit applications."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBookings.map((booking) => {
            const title = booking.property_details?.title || booking.property?.title || "Housing Unit";
            const studentName = booking.student_name || "Student Applicant";
            const payments = paymentsByBooking[booking.id] || {};
            const statusConfig = STATUS_CONFIG[booking.status] || { label: booking.status, cls: "bg-slate-50 text-slate-700 border-slate-200" };
            const isProcessing = processingId === booking.id;

            return (
              <div 
                key={booking.id} 
                className={`group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all hover:shadow-xl ${
                  booking.status === "PENDING" ? "border-amber-200 ring-2 ring-amber-500/10" : "border-slate-200"
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
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${statusConfig.cls}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-slate-600">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Student</span>
                          <span className="font-extrabold text-slate-900 text-sm">{studentName}</span>
                          {booking.student_phone && (
                            <a href={`tel:${booking.student_phone}`} className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline">
                              <Phone className="h-3 w-3" /> {booking.student_phone}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-slate-600">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Move-in Date</span>
                          <span className="font-extrabold text-slate-900 text-sm">{booking.move_in_date || "Flexible"}</span>
                          <span className="block text-[11px] text-slate-500 font-medium">{booking.duration_semesters || 1} semester{booking.duration_semesters > 1 ? "s" : ""}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-slate-600">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Semester Rent</span>
                          <span className="text-sm font-black text-slate-900">
                            KES {Number(booking.property_details?.semester_rent || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {booking.notes && (
                      <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
                        <strong className="text-slate-800">Student Notes:</strong> {booking.notes}
                      </p>
                    )}

                    {/* Payment Indicators */}
                    {(payments.DEPOSIT || payments.RENT || payments.FULL) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {renderPaymentLine("Deposit", payments.DEPOSIT)}
                        {renderPaymentLine("Rent", payments.RENT)}
                        {renderPaymentLine("Full Payment", payments.FULL)}
                      </div>
                    )}
                  </div>

                  {/* Landlord Action Buttons */}
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
                        <span className="text-xs font-bold text-slate-400">Awaiting student payment</span>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, "CONFIRMED")}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Manual Confirm
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
              <h3 className="text-lg font-black text-slate-900">Reject Booking Request</h3>
              <button onClick={() => setRejectingBooking(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to reject the reservation from <strong className="text-slate-900">{rejectingBooking.student_name || "this student"}</strong> for <strong className="text-slate-900">{rejectingBooking.property_details?.title || "this unit"}</strong>?
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Unit already filled, maintenance ongoing..."
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