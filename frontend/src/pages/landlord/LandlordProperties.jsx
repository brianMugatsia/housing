import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, AlertCircle, RefreshCw, Send, CheckCircle2, Clock, XCircle } from "lucide-react";
import { listMyProperties, submitProperty } from "../../services/properties";
import PropertyCard from "../../components/PropertyCard";

const STATUS_BADGE = {
  APPROVED: { label: "Approved & Live", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  PENDING_VERIFICATION: { label: "Pending Admin Review", cls: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", cls: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
  DRAFT: { label: "Draft (Unsubmitted)", cls: "bg-slate-100 text-slate-700 border-slate-200", icon: Building2 },
  REJECTED: { label: "Rejected", cls: "bg-rose-100 text-rose-800 border-rose-200", icon: XCircle },
};

export default function LandlordProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listMyProperties();
      const propertyList = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response?.data?.results)
        ? response.data.results
        : Array.isArray(response?.data)
        ? response.data
        : [];

      setProperties(propertyList);
    } catch (err) {
      console.error("Failed to load landlord properties:", err);
      setError(
        err.response?.status === 401
          ? "Authentication required. Please log in again."
          : "Failed to load properties. Please try again."
      );
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleSubmitForReview = async (id) => {
    setSubmittingId(id);
    try {
      await submitProperty(id);
      await fetchProperties();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit property for verification. Ensure you have uploaded at least one photo.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-8 animate-fadeIn">
      {/* Header Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full">
            Listings Management & Verification
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            My Accommodations
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Submit draft properties for admin verification, track review statuses, and manage units.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProperties}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Reload
          </button>
          <Link
            to="/landlord/properties/new"
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Property
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchProperties}
            className="font-bold underline hover:text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid State */}
      {loading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[380px] animate-pulse rounded-3xl bg-slate-200/70"
            />
          ))}
        </div>
      ) : properties.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 sm:p-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Building2 className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="mt-4 text-xl font-black text-slate-900">
            No properties listed yet
          </h3>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
            Get started by adding your first student accommodation. Once verified by admins, students can browse and book units.
          </p>
          <Link
            to="/landlord/properties/new"
            className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Property Listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.isArray(properties) &&
            properties.map((p) => {
              const statusInfo = STATUS_BADGE[p.verification_status] || {
                label: p.verification_status,
                cls: "bg-slate-100 text-slate-700 border-slate-200",
                icon: Building2,
              };
              const StatusIcon = statusInfo.icon;
              const canSubmit = ["DRAFT", "REJECTED"].includes(p.verification_status);

              return (
                <div key={p.id} className="flex flex-col justify-between bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-3 space-y-4">
                  <PropertyCard property={p} variant="landlord" />

                  <div className="px-3 pb-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.cls}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusInfo.label}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {p.available_rooms}/{p.total_rooms} rooms left
                      </span>
                    </div>

                    {p.rejection_reason && (
                      <p className="text-[11px] text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        <strong>Rejection Reason:</strong> {p.rejection_reason}
                      </p>
                    )}

                    {canSubmit && (
                      <button
                        onClick={() => handleSubmitForReview(p.id)}
                        disabled={submittingId === p.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {submittingId === p.id ? "Submitting..." : "Submit for Admin Review"}
                      </button>
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
