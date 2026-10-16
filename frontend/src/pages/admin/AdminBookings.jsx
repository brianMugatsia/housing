import { useState, useEffect } from "react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { CheckCircle, XCircle, Receipt, Clock, AlertCircle, Building2, User, RefreshCw, Calendar, Phone, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const PAYMENT_STATUS_STYLE = {
  COMPLETED: { icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  PENDING: { icon: <Clock className="h-3.5 w-3.5 text-amber-500" />, cls: "bg-amber-50 text-amber-700 border-amber-100" },
  FAILED: { icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />, cls: "bg-red-50 text-red-700 border-red-100" },
  CANCELLED: { icon: <XCircle className="h-3.5 w-3.5 text-slate-400" />, cls: "bg-slate-50 text-slate-700 border-slate-100" },
};

const STATUS_VARIANTS = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DEPOSIT_PAID: "bg-blue-50 text-blue-700 border-blue-200",
  CONFIRMED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-slate-50 text-slate-700 border-slate-200",
  VACATED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [paymentsByBooking, setPaymentsByBooking] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setActionError("");
    try {
      const [bookingsRes, paymentsRes] = await Promise.all([
        api.get("/bookings/"),
        api.get("/payments/landlord/").catch(() => ({ data: [] })),
      ]);

      const bookingsData = bookingsRes.data.results || bookingsRes.data;
      const paymentsData = paymentsRes.data.results || paymentsRes.data;

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
      console.error("Failed to load bookings", err);
      setActionError("Failed to fetch booking requests. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await api.patch(`/bookings/${id}/`, { status });
      const updatedBooking = response.data;

      setBookings((prevBookings) =>
        prevBookings.map((b) => (b.id === id ? { ...b, ...updatedBooking } : b))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update booking status");
    }
  };

  const formatKES = (amount) => `KES ${Number(amount || 0).toLocaleString("en-KE")}`;

  const renderPaymentLine = (label, payment) => {
    if (!payment) return null;
    const style = PAYMENT_STATUS_STYLE[payment.status] || {};
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${style.cls}`}>
        {style.icon}
        <span>{label}: {formatKES(payment.amount)}</span>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-full">
            Global Control
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">System Bookings</h1>
          <p className="mt-2 text-slate-500">Overview of all student reservations across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            Verification
          </Link>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 text-rose-700 text-sm font-bold flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-20 text-center">
          <Building2 className="mx-auto h-16 w-16 text-slate-200" />
          <h3 className="mt-4 text-xl font-bold text-slate-900">Zero Bookings Found</h3>
          <p className="mt-2 text-slate-500">Wait for students to start making reservations.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => {
            const title = booking.property_details?.title || booking.property?.title || "Housing Unit";
            const studentName = booking.student_name || "Student User";
            const payments = paymentsByBooking[booking.id] || {};

            return (
              <div key={booking.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
                      {booking.house_number && (
                        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          Unit #{booking.house_number}
                        </span>
                      )}
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_VARIANTS[booking.status] || STATUS_VARIANTS.PENDING}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Reserved By</span>
                          <span className="font-bold text-slate-900 leading-tight">{studentName}</span>
                          {booking.student_phone && <p className="text-[11px] font-medium text-slate-500">{booking.student_phone}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Timeline</span>
                          <span className="font-bold text-slate-900">{booking.move_in_date || "N/A"}</span>
                          <p className="text-[11px] font-medium text-slate-500">{booking.duration_months || 1} months stay</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                          <Receipt className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Payments</span>
                          <div className="flex flex-wrap gap-2">
                            {renderPaymentLine("Deposit", payments.DEPOSIT) || <span className="text-[11px] italic text-slate-400">Deposit unpaid</span>}
                            {renderPaymentLine("Rent", payments.RENT)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(booking.status === "PENDING" || booking.status === "DEPOSIT_PAID") && (
                    <div className="flex items-center gap-3 border-t border-slate-50 pt-6 lg:border-none lg:pt-0">
                      <Button
                        onClick={() => handleStatusUpdate(booking.id, "APPROVED")}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(booking.id, "REJECTED")}
                        variant="outline"
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-2xl border-rose-200 px-6 py-3 font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
