import { useState, useEffect } from "react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { CheckCircle, XCircle, Receipt, Clock, AlertCircle, User, Calendar, MapPin, Building2, Phone } from "lucide-react";

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

export default function LandlordBookings() {
  const [bookings, setBookings] = useState([]);
  const [paymentsByBooking, setPaymentsByBooking] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [bookingsRes, paymentsRes] = await Promise.all([
          api.get("/bookings/"),
          api.get("/payments/landlord/"),
        ]);

        if (!isMounted) return;

        const bookingsData = bookingsRes.data.results || bookingsRes.data;
        const paymentsData = paymentsRes.data.results || paymentsRes.data;

        const grouped = {};
        (Array.isArray(paymentsData) ? paymentsData : []).forEach((p) => {
          if (!grouped[p.booking]) grouped[p.booking] = {};
          if (!grouped[p.booking][p.phase]) {
            grouped[p.booking][p.phase] = p;
          }
        });

        setBookings(bookingsData);
        setPaymentsByBooking(grouped);
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
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
        {payment.mpesa_receipt_number && (
          <span className="ml-1 opacity-60 font-mono">#{payment.mpesa_receipt_number}</span>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-10 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Booking Requests</h1>
        <p className="mt-2 text-lg text-slate-500">Manage student reservations and track payment statuses.</p>
      </div>

      <div className="grid gap-6">
        {bookings.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-20 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500 font-medium">No booking requests yet. Your property listings are active!</p>
          </div>
        ) : (
          bookings.map((booking) => {
            const title = booking.property_details?.title || booking.property?.title || "Housing Unit";
            const studentName = booking.student_name || "Student";
            const payments = paymentsByBooking[booking.id] || {};

            return (
              <div key={booking.id} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-slate-300">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_VARIANTS[booking.status] || STATUS_VARIANTS.PENDING}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Student</span>
                          <span className="font-bold text-slate-900">{studentName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Move-in Date</span>
                          <span className="font-bold text-slate-900">{booking.move_in_date || "N/A"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Unit Number</span>
                          <span className="font-bold text-slate-900">#{booking.house_number || "Any"}</span>
                        </div>
                      </div>
                    </div>

                    {(payments.DEPOSIT || payments.RENT) && (
                      <div className="flex flex-wrap gap-3 pt-2">
                        {renderPaymentLine("Deposit", payments.DEPOSIT)}
                        {renderPaymentLine("Rent", payments.RENT)}
                      </div>
                    )}
                  </div>

                  {booking.status === "PENDING" && (
                    <div className="flex items-center gap-3 border-t border-slate-50 pt-4 lg:border-none lg:pt-0">
                      <Button
                        onClick={() => handleStatusUpdate(booking.id, "APPROVED")}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white shadow-lg transition-transform active:scale-95"
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

                  {booking.student_phone && (
                    <div className="lg:text-right">
                      <a 
                        href={`tel:${booking.student_phone}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {booking.student_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}