import { useState, useEffect } from "react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { CheckCircle, XCircle, Receipt, Clock, AlertCircle } from "lucide-react";

const PAYMENT_STATUS_STYLE = {
  COMPLETED: { icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />, cls: "text-emerald-700" },
  PENDING: { icon: <Clock className="h-3.5 w-3.5 text-amber-500" />, cls: "text-amber-600" },
  FAILED: { icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />, cls: "text-red-600" },
  CANCELLED: { icon: <XCircle className="h-3.5 w-3.5 text-slate-400" />, cls: "text-slate-500" },
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

        // Group payments by booking ID and phase (DEPOSIT / RENT),
        // keeping only the most recent attempt per phase.
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
    if (!payment) {
      return (
        <span className="text-slate-400">
          {label}: <span className="italic">not initiated</span>
        </span>
      );
    }
    const style = PAYMENT_STATUS_STYLE[payment.status] || {};
    return (
      <span className={`flex items-center gap-1 ${style.cls || "text-slate-500"}`}>
        {style.icon} {label}: {formatKES(payment.amount)}
        {payment.status === "COMPLETED" && payment.mpesa_receipt_number && (
          <span className="ml-1 font-mono text-slate-400">#{payment.mpesa_receipt_number}</span>
        )}
        {payment.status !== "COMPLETED" && (
          <span className="ml-1 text-slate-400">({payment.status.toLowerCase()})</span>
        )}
      </span>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading requests...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Booking Requests</h1>
        <p className="mt-1 text-slate-500">Approve or reject incoming student room reservations.</p>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">No booking requests found.</Card>
        ) : (
          bookings.map((booking) => {
            const title =
              booking.property_details?.title ||
              booking.property?.title ||
              booking.property_title ||
              "Housing Unit";

            const studentName =
              booking.student_name ||
              booking.student?.full_name ||
              (booking.student?.first_name
                ? `${booking.student.first_name} ${booking.student.last_name || ""}`
                : null) ||
              booking.user?.full_name ||
              "N/A";

            const payments = paymentsByBooking[booking.id] || {};

            return (
              <Card key={booking.id} className="flex flex-col gap-4 p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{title}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          booking.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : booking.status === "DEPOSIT_PAID"
                            ? "bg-blue-100 text-blue-800"
                            : booking.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : booking.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Student: {studentName}</p>
                    <p className="text-xs text-slate-500">
                      Move-in Date: {booking.move_in_date || "N/A"}
                    </p>
                  </div>

                  {booking.status === "PENDING" && (
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => handleStatusUpdate(booking.id, "APPROVED")}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(booking.id, "REJECTED")}
                        variant="outline"
                        className="flex items-center gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Payment status only makes sense once a booking has progressed past PENDING */}
                {booking.status !== "PENDING" && booking.status !== "REJECTED" && (
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs">
                    <Receipt className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                      {renderPaymentLine("Deposit", payments.DEPOSIT)}
                      {renderPaymentLine("Rent", payments.RENT)}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}