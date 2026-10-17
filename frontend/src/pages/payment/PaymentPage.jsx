import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Loader2,
  ShieldCheck,
  Building2,
  Calendar,
  Lock
} from "lucide-react";
import api from "../../services/api";
import { initiateSTKPush, getPaymentStatus } from "../../services/payments";

const DURATION_TO_SEMESTERS = { 3: 1, 6: 2, 12: 3 };

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000; // 90 seconds timeout

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [stage, setStage] = useState("idle"); // "idle" | "sending" | "waiting" | "success" | "failed" | "timeout"
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const pollTimer = useRef(null);
  const pollDeadline = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}/`);
        if (!isMounted) return;

        const b = res.data;
        setBooking(b);
        if (b.student_phone) {
          setPhoneNumber(b.student_phone);
        }
      } catch (err) {
        console.error("Failed to load booking:", err);
        if (isMounted) setLoadError("Could not load booking details. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBooking();
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const propertyDetails = booking?.property_details;
  const semesterRent = Number(propertyDetails?.semester_rent) || 0;
  const semesters = DURATION_TO_SEMESTERS[booking?.duration_months] || booking?.duration_months || 1;
  const fullAmountDue = semesterRent * semesters;

  const isPayable = booking?.status === "APPROVED";

  const pollPaymentStatus = (checkoutRequestId) => {
    pollDeadline.current = Date.now() + POLL_TIMEOUT_MS;

    const poll = async () => {
      try {
        const data = await getPaymentStatus(checkoutRequestId);

        if (data.status === "COMPLETED") {
          setStage("success");
          setReceipt(data.mpesa_receipt_number);
          return;
        }

        if (data.status === "FAILED" || data.status === "CANCELLED") {
          setStage("failed");
          setError(data.result_desc || "Payment was not completed. Please try again.");
          return;
        }

        if (Date.now() >= pollDeadline.current) {
          setStage("timeout");
          return;
        }

        pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        console.error("Polling error:", err);
        if (Date.now() >= pollDeadline.current) {
          setStage("timeout");
        } else {
          pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    poll();
  };

  const handlePay = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your M-Pesa phone number.");
      return;
    }

    setError("");
    setStage("sending");

    try {
      const res = await initiateSTKPush({
        bookingId: booking.id,
        phase: "RENT",
        phoneNumber: phoneNumber.trim(),
      });

      setStage("waiting");
      pollPaymentStatus(res.checkout_request_id);
    } catch (err) {
      console.error("STK push error:", err);
      const detail =
        err.response?.data?.detail ||
        (typeof err.response?.data === "object"
          ? Object.values(err.response.data)[0]
          : null);
      setError(detail || "Failed to start M-Pesa payment. Please verify phone number and try again.");
      setStage("idle");
    }
  };

  const handleRetry = () => {
    setStage("idle");
    setError("");
    setReceipt(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading payment checkout...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-3 stroke-[1.5]" />
        <h2 className="text-lg font-black text-slate-900">Unable to load booking</h2>
        <p className="text-xs text-rose-600 mt-1">{loadError}</p>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="mt-6 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl space-y-6">
        {!isPayable ? (
          <div className="text-center py-8 space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Payment Not Due</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {booking?.status === "PENDING" &&
                "Your booking request is currently pending landlord/admin approval. Once approved, you can complete the full payment here."}
              {booking?.status === "CONFIRMED" &&
                "This booking has already been paid in full and confirmed. Your room is secured!"}
              {!["PENDING", "CONFIRMED"].includes(booking?.status) &&
                `Current booking status is "${booking?.status}".`}
            </p>
            <button
              onClick={() => navigate("/student/dashboard")}
              className="mt-4 inline-flex items-center rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        ) : stage === "success" ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-xs">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Payment Successful!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Your full accommodation payment has been verified and confirmed.
              </p>
            </div>

            {receipt && (
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 font-mono text-xs text-slate-700">
                <span className="block text-[10px] text-slate-400 uppercase font-sans font-bold">M-Pesa Confirmation</span>
                <strong>Receipt #{receipt}</strong>
              </div>
            )}

            <p className="text-sm font-black text-emerald-700">
              Total Paid: KES {fullAmountDue.toLocaleString()}
            </p>

            <button
              onClick={() => navigate("/student/dashboard")}
              className="w-full rounded-2xl bg-slate-900 py-3.5 text-xs font-black text-white hover:bg-slate-800 transition-all cursor-pointer shadow-lg"
            >
              Go to Student Dashboard
            </button>
          </div>
        ) : (
          <>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Approved by Landlord
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                Pay Full Accommodation Amount
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Complete your room booking by paying the full rent securely via Safaricom M-Pesa.
              </p>
            </div>

            {/* Price Breakdown Card */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Accommodation</span>
                <span className="font-extrabold text-slate-900">{propertyDetails?.title || "Student Residence"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Allocated Room</span>
                <span className="font-extrabold text-slate-900">#{booking?.house_number || "Unassigned"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Lease Duration</span>
                <span className="font-extrabold text-slate-900">
                  {semesters} {semesters > 1 ? "Semesters" : "Semester"} ({booking?.duration_months} Months)
                </span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/80">
                <span className="text-slate-700 font-black uppercase text-[11px]">Total Full Amount Due</span>
                <span className="text-lg font-black text-slate-900">
                  KES {fullAmountDue.toLocaleString()}
                </span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-xs font-bold text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {(stage === "idle" || stage === "sending") && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0712345678 or 254712345678"
                      disabled={stage === "sending"}
                      className="w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 shadow-xs"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Enter the Safaricom M-Pesa mobile number to receive the payment PIN prompt.
                  </p>
                </div>

                <button
                  onClick={handlePay}
                  disabled={stage === "sending" || !fullAmountDue}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-black text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {stage === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending M-Pesa STK Push...
                    </>
                  ) : (
                    `Pay Full Amount KES ${fullAmountDue.toLocaleString()} via M-Pesa`
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <Lock className="h-3 w-3" />
                  <span>Secured by Safaricom Daraja M-Pesa Gateway</span>
                </div>
              </div>
            )}

            {stage === "waiting" && (
              <div className="text-center py-6 space-y-3">
                <Loader2 className="mx-auto h-12 w-12 text-slate-900 animate-spin" />
                <h3 className="text-base font-black text-slate-900">Check Your Phone</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  A payment prompt for <strong>KES {fullAmountDue.toLocaleString()}</strong> has been sent to <strong>{phoneNumber}</strong>. Please enter your M-Pesa PIN on your phone now.
                </p>
              </div>
            )}

            {(stage === "failed" || stage === "timeout") && (
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {stage === "timeout" ? "Verification Timed Out" : "Payment Incomplete"}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {stage === "timeout"
                    ? "We didn't receive confirmation from Safaricom. If you already entered your PIN, please wait a moment and refresh your dashboard."
                    : error}
                </p>
                <button
                  onClick={handleRetry}
                  className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}