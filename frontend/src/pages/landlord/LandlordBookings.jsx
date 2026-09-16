import { useState, useEffect } from "react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { CheckCircle, XCircle } from "lucide-react";

export default function LandlordBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchBookings = async () => {
      try {
        const { data } = await api.get("/bookings/");
        if (isMounted) {
          setBookings(data.results || data);
        }
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await api.patch(`/bookings/${id}/`, { status });
      const updatedBooking = response.data;

      // Update local state immediately so UI refreshes without waiting for a re-fetch
      setBookings((prevBookings) =>
        prevBookings.map((b) => (b.id === id ? { ...b, ...updatedBooking } : b))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update booking status");
    }
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
            // Read title from nested property_details, property object, or flat field
            const title =
              booking.property_details?.title ||
              booking.property?.title ||
              booking.property_title ||
              "Housing Unit";

            // Read student name from student_name, nested student object, or user object
            const studentName =
              booking.student_name ||
              booking.student?.full_name ||
              (booking.student?.first_name
                ? `${booking.student.first_name} ${booking.student.last_name || ""}`
                : null) ||
              booking.user?.full_name ||
              "N/A";

            return (
              <Card
                key={booking.id}
                className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        booking.status === "APPROVED"
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
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}