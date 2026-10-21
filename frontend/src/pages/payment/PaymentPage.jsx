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

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000; // 90 seconds timeout

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
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
        const prop = b.property_details;
        const semRent = Number(prop?.semester_rent) || 0;
        const sems = Number(b.duration_semesters) || 1;
        const pct = Number(prop?.deposit_percentage) || 100;
        const minDue = (semRent * sems * pct) / 100;
        setPaymentAmount(minDue.toFixed(0));
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
  const semesters = Number(booking?.duration_semesters) || 1;
  const fullAmountDue = semesterRent * semesters;
  const depositPercentage = Number(propertyDetails?.deposit_percentage) || 100;
  const minAmountDue = (fullAmountDue * depositPercentage) / 100;

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
        pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");

    const amt = Number(paymentAmount);
    if (amt < minAmountDue) {
      setError(`Amount cannot be less than the required minimum (${depositPercentage}% deposit: KES ${minAmountDue.toLocaleString()}). You may pay more up to full rent.`);
      return;
    }

    setStage("sending");

    try {
      const res = await initiateSTKPush({
        booking_id: Number(bookingId),
        phone_number: phoneNumber,
        amount: amt,
        phase: depositPercentage < 100 ? "DEPOSIT" : "RENT",
      });

      setStage("waiting");
      pollPaymentStatus(res.checkout_request_id);
    } catch (err) {
      console.error("Payment initiation error:", err);
      setStage("idle");
      setError(err.response?.data?.detail || "Failed to initiate M-Pesa STK push. Please verify your phone number.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to load payment</h2>
        <p className="text-xs text-slate-500">{loadError || "Booking not found."}</p>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" /> M-Pesa Secure Checkout
          </span>
          <h1 className="mt-3 text-2xl font-black text-slate-900">Complete Rent Payment</h1>
          <p className="text-xs text-slate-500 mt-1">
            {propertyDetails?.title} {booking.house_number ? `(Unit #${booking.house_number})` : ""}
          </p>
        </div>

        {/* Amount Summary */}
        <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Full Semester Rent ({semesters} Semester{semesters > 1 ? "s" : ""})</span>
            <span className="font-bold text-slate-800">KES {fullAmountDue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Required Minimum ({depositPercentage}% Deposit)</span>
            <span className="font-bold text-indigo-700">KES {minAmountDue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black">
            <span className="text-slate-900">Amount Due Now</span>
            <span className="text-emerald-600">KES {Number(paymentAmount || minAmountDue).toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {!isPayable && booking.status !== "CONFIRMED" ? (
          <div className="rounded-2xl bg-amber-50 p-6 text-center border border-amber-200 space-y-2">
            <AlertCircle className="mx-auto h-8 w-8 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">Awaiting Landlord Approval</h3>
            <p className="text-xs text-amber-700">
              You can proceed with M-Pesa payment once the landlord approves your booking request.
            </p>
          </div>
        ) : stage === "success" ? (
          <div className="rounded-2xl bg-emerald-50 p-8 text-center border border-emerald-200 space-y-3">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h3 className="text-lg font-black text-emerald-900">Payment Successful!</h3>
            <p className="text-xs text-emerald-700">
              Your M-Pesa receipt number is <strong className="font-mono">{receipt || "CONFIRMED"}</strong>. Your booking is now fully confirmed!
            </p>
            <button
              onClick={() => navigate("/student/dashboard")}
              className="mt-4 rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        ) : stage === "waiting" ? (
          <div className="rounded-2xl bg-indigo-50 p-8 text-center border border-indigo-100 space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-indigo-950">Check your phone for M-Pesa STK Push</h3>
              <p className="text-xs text-indigo-700 max-w-xs mx-auto">
                We've sent a payment prompt to <strong className="font-mono">{phoneNumber}</strong>. Enter your PIN to complete transaction.
              </p>
            </div>
            <div className="text-[11px] font-bold text-indigo-500 animate-pulse">
              Waiting for confirmation callback...
            </div>
          </div>
        ) : stage === "timeout" ? (
          <div className="rounded-2xl bg-amber-50 p-6 text-center border border-amber-200 space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">Payment Request Timed Out</h3>
            <p className="text-xs text-amber-700">
              We did not receive a confirmation from M-Pesa in time. If you completed the payment, please refresh your status.
            </p>
            <button
              onClick={() => setStage("idle")}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="0712345678 or 254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-xs font-mono font-semibold text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Payment Amount (KES)
              </label>
              <input
                type="number"
                required
                min={minAmountDue}
                max={fullAmountDue}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all"
              />
              <p className="mt-1 text-[11px] text-slate-500 font-medium">
                Minimum required deposit: KES {minAmountDue.toLocaleString()} ({depositPercentage}%). You may pay up to full rent (KES {fullAmountDue.toLocaleString()}).
              </p>
            </div>

            <button
              type="submit"
              disabled={stage === "sending"}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {stage === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending STK Push...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Pay KES {Number(paymentAmount || minAmountDue).toLocaleString()} via M-Pesa</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
