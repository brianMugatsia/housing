import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Loader2,
} from "lucide-react";
import api from "../../services/api";
import { initiateSTKPush, getPaymentStatus } from "../../services/payments";

// Mirrors the DURATION_TO_SEMESTERS mapping used on the backend
// (apps/payments/utils.py) so the displayed amount matches what
// the server will actually charge.
const DURATION_TO_SEMESTERS = { 3: 1, 6: 2, 12: 3 };

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000; // give up after 90s if callback never arrives

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("254708374149"); // sandbox test MSISDN default
  const [phase, setPhase] = useState(null); // "DEPOSIT" | "RENT" | null (nothing due)

  // "idle" -> "sending" -> "waiting" -> "success" | "failed" | "timeout"
  const [stage, setStage] = useState("idle");
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

        if (b.status === "APPROVED") {
          setPhase("DEPOSIT");
        } else if (b.status === "DEPOSIT_PAID") {
          setPhase("RENT");
        } else {
          setPhase(null); // nothing payable right now (PENDING, CONFIRMED, etc.)
        }
      } catch (err) {
        console.error("Failed to load booking:", err);
        if (isMounted) setLoadError("Could not load this booking. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBooking();
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  // Clean up any in-flight poll timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const propertyDetails = booking?.property_details;
  const semesterRent = Number(propertyDetails?.monthly_rent) || 0;
  const deposit = Number(propertyDetails?.deposit) || 0;
  const semesters = DURATION_TO_SEMESTERS[booking?.duration_months] || 1;
  const rentTotal = semesterRent * semesters;

  const amountDue = phase === "DEPOSIT" ? deposit : phase === "RENT" ? rentTotal : 0;
  const phaseLabel = phase === "DEPOSIT" ? "Deposit" : phase === "RENT" ? "Rent" : null;

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
          setError(data.result_desc || "Payment was not completed.");
          return;
        }

        // still PENDING
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
      setError("Please enter a phone number.");
      return;
    }

    setError("");
    setStage("sending");

    try {
      const res = await initiateSTKPush({
        bookingId: booking.id,
        phase,
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
      setError(detail || "Failed to start payment. Please try again.");
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
      <div className="py-20 text-center text-slate-500">Loading booking details...</div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-3" />
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {!phase ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
            <h2 className="text-lg font-bold text-slate-900">Nothing to pay right now</h2>
            <p className="mt-1 text-sm text-slate-500">
              {booking?.status === "PENDING" &&
                "This booking is still awaiting landlord approval."}
              {booking?.status === "CONFIRMED" &&
                "This booking is already fully paid and confirmed."}
              {!["PENDING", "CONFIRMED"].includes(booking?.status) &&
                `Current booking status: ${booking?.status}`}
            </p>
          </div>
        ) : stage === "success" ? (
          <div className="text-center py-8">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600 mb-3" />
            <h2 className="text-xl font-bold text-slate-900">
              {phaseLabel} Payment Successful
            </h2>
            {receipt && (
              <p className="mt-2 text-sm text-slate-500">
                M-Pesa Receipt: <span className="font-mono font-semibold text-slate-700">{receipt}</span>
              </p>
            )}
            <p className="mt-1 text-sm text-slate-500">
              KES {amountDue.toLocaleString()} received.
            </p>
            <button
              onClick={() => navigate("/student/dashboard")}
              className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900">Pay {phaseLabel}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {phase === "DEPOSIT"
                ? "Secure your room by paying the deposit via M-Pesa."
                : "Complete your booking by paying the full rent for your selected duration."}
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Property</span>
                <span className="font-semibold text-slate-800">{propertyDetails?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room</span>
                <span className="font-semibold text-slate-800">{booking?.house_number}</span>
              </div>
              {phase === "RENT" && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-semibold text-slate-800">
                    {semesters} semester{semesters > 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-semibold">Amount Due</span>
                <span className="font-bold text-emerald-600">
                  KES {amountDue.toLocaleString()}
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {(stage === "idle" || stage === "sending") && (
              <>
                <div className="mt-5">
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="2547XXXXXXXX"
                      disabled={stage === "sending"}
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Sandbox mode: only 254708374149 will trigger a simulated payment.
                  </p>
                </div>

                <button
                  onClick={handlePay}
                  disabled={stage === "sending"}
                  className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {stage === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending request...
                    </>
                  ) : (
                    `Pay KES ${amountDue.toLocaleString()} via M-Pesa`
                  )}
                </button>
              </>
            )}

            {stage === "waiting" && (
              <div className="mt-6 text-center py-4">
                <Loader2 className="mx-auto h-10 w-10 text-slate-700 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-800">Check your phone</p>
                <p className="mt-1 text-xs text-slate-500">
                  Enter your M-Pesa PIN on the prompt sent to {phoneNumber} to complete this
                  payment.
                </p>
              </div>
            )}

            {(stage === "failed" || stage === "timeout") && (
              <div className="mt-6 text-center py-4">
                <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-3" />
                <p className="text-sm font-semibold text-slate-800">
                  {stage === "timeout" ? "No confirmation received" : "Payment failed"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {stage === "timeout"
                    ? "We didn't hear back in time. If you completed the M-Pesa prompt, it may still process — otherwise, try again."
                    : error}
                </p>
                <button
                  onClick={handleRetry}
                  className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
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