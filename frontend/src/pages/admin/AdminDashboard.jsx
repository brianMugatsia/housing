import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  X, 
  AlertTriangle,
  User,
  MapPin,
  GraduationCap,
  CalendarCheck,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import AdminNav from "../../components/AdminNav";
import ImageCarousel from "../../components/ImageCarousel";

const PREDEFINED_REASONS = [
  "Blurry or low-quality photographs",
  "Incomplete address / location details",
  "Inaccurate or unrealistic pricing",
  "Duplicate listing submission",
];

const getPropertyStatus = (prop) => {
  if (prop.verification_status === "APPROVED" || prop.is_verified) {
    return "APPROVED";
  }
  if (prop.verification_status === "REJECTED") {
    return "REJECTED";
  }
  return "PENDING";
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Data States
  const [properties, setProperties] = useState([]);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);    
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [searchTerm, setSearchTerm] = useState("");

  // Action States
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Modal States
  const [rejectingProp, setRejectingProp] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setActionError("");
    try {
      const [propsRes, bookingsRes] = await Promise.all([
        api.get("/admin/properties/").catch(() => api.get("/properties/?all=true")),
        api.get("/bookings/").catch(() => ({ data: [] })),
      ]);

      const rawProps = Array.isArray(propsRes.data) ? propsRes.data : propsRes.data?.results || [];
      const rawBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data?.results || [];

      setProperties(rawProps);
      setPendingBookingsCount(rawBookings.filter((b) => b.status === "PENDING").length);
    } catch (fallbackErr) {
      console.error("Failed to fetch properties:", fallbackErr);
      setActionError("Failed to load listings. Please refresh.");
      addToast("Failed to load listings. Please refresh.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const status = getPropertyStatus(prop);
      if (status !== activeTab) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const titleMatch = prop.title?.toLowerCase().includes(term);        
      const townMatch = prop.town?.toLowerCase().includes(term);
      const countyMatch = prop.county?.toLowerCase().includes(term);      
      const typeMatch = prop.property_type?.toLowerCase().includes(term); 

      const landlordMatch =
        typeof prop.landlord === "object"
          ? prop.landlord?.full_name?.toLowerCase().includes(term) || prop.landlord?.email?.toLowerCase().includes(term)
          : String(prop.landlord || "").toLowerCase().includes(term);     

      return titleMatch || townMatch || countyMatch || typeMatch || landlordMatch;
    });
  }, [properties, activeTab, searchTerm]);

  const counts = useMemo(() => {
    return properties.reduce(
      (acc, prop) => {
        const status = getPropertyStatus(prop);
        if (status === "APPROVED") acc.approved += 1;
        else if (status === "REJECTED") acc.rejected += 1;
        else acc.pending += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  }, [properties]);

  const handleApprove = async (id) => {
    setActionError("");
    setProcessingId(id);
    try {
      await api.post(`/admin/properties/${id}/approve/`);
      setProperties((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, verification_status: "APPROVED", is_verified: true } : item
        )
      );
      addToast("Property successfully approved!", "success");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to approve property.";
      setActionError(msg);
      addToast(msg, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setActionError("Please select or enter a rejection reason.");
      addToast("Please select or enter a rejection reason.", "warning");
      return;
    }
    setActionError("");
    setProcessingId(rejectingProp.id);
    try {
      await api.post(`/admin/properties/${rejectingProp.id}/reject/`, { reason: rejectReason });
      setProperties((prev) =>
        prev.map((item) =>
          item.id === rejectingProp.id
            ? { ...item, verification_status: "REJECTED", rejection_reason: rejectReason, is_verified: false }
            : item
        )
      );
      setRejectingProp(null);
      setRejectReason("");
      addToast("Property listing rejected.", "info");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to reject property.";
      setActionError(msg);
      addToast(msg, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const formatKES = (amount) => `KES ${Number(amount || 0).toLocaleString("en-KE")}`;

  const renderLandlordName = (landlord) => {
    if (!landlord) return "Unknown Landlord";
    if (typeof landlord === "string") return landlord;
    return landlord.full_name || landlord.email || landlord.username || `ID: ${landlord.id}`;
  };

  const renderUniversityName = (university) => {
    if (!university) return "N/A";
    if (typeof university === "string") return university;
    return university.name || "N/A";
  };

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-8 animate-fadeIn">
      {/* Navigation & Header */}
      <AdminNav 
        title="Property Listings Verification"
        subtitle={`Welcome, ${user?.full_name || user?.username || "Admin"}. Review, verify, and moderate landlord submissions.`}
        onRefresh={fetchProperties}
        loading={loading}
      />

      {/* Pending Student Bookings Notification Banner */}
      {pendingBookingsCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border-2 border-amber-300 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-ping" />
            <div>
              <h4 className="text-sm font-black text-amber-950">
                Action Required: {pendingBookingsCount} Pending Student Bookings
              </h4>
              <p className="text-xs text-amber-800">
                Students are awaiting approval for house reservations. As an admin, you can approve or reject these bookings.
              </p>
            </div>
          </div>
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-amber-700 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
          >
            Review Bookings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex items-center justify-between rounded-3xl p-6 border text-left transition-all cursor-pointer ${
            activeTab === "PENDING"
              ? "border-amber-400 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-md"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Review</span>
            <div className="text-3xl font-black text-slate-900">{counts.pending}</div>
            <span className="text-[11px] font-semibold text-slate-400">Awaiting verification</span>
          </div>
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <Clock className="h-6 w-6" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab("APPROVED")}
          className={`flex items-center justify-between rounded-3xl p-6 border text-left transition-all cursor-pointer ${
            activeTab === "APPROVED"
              ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-md"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Verified & Active</span>
            <div className="text-3xl font-black text-slate-900">{counts.approved}</div>
            <span className="text-[11px] font-semibold text-slate-400">Live for student bookings</span>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <CheckCircle className="h-6 w-6" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab("REJECTED")}
          className={`flex items-center justify-between rounded-3xl p-6 border text-left transition-all cursor-pointer ${
            activeTab === "REJECTED"
              ? "border-rose-400 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-md"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Rejected Listings</span>
            <div className="text-3xl font-black text-slate-900">{counts.rejected}</div>
            <span className="text-[11px] font-semibold text-slate-400">Required edits</span>
          </div>
          <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
            <XCircle className="h-6 w-6" />
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, town, landlord..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-slate-900"
          />
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-slate-900">{filteredProperties.length}</span> properties
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs font-bold">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Content Section */}
      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3 stroke-[1.5]" />
          <h3 className="text-base font-extrabold text-slate-800">No properties in this category</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are currently no listings matching the selected status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProperties.map((prop) => {
            const status = getPropertyStatus(prop);
            const images = prop.images || (prop.image ? [{ image: prop.image }] : []);

            return (
              <div
                key={prop.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:border-slate-300 transition-all p-6 sm:p-8 space-y-6"
              >
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-black text-slate-900">{prop.title}</h2>
                      <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 border border-slate-200">
                        {prop.property_type || "Apartment"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {prop.town}, {prop.county}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        Host: {renderLandlordName(prop.landlord)}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                        Campus: {renderUniversityName(prop.university)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`self-start px-3.5 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                      status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {status === "APPROVED"
                      ? "Verified"
                      : status === "REJECTED"
                      ? "Rejected"
                      : "Pending Review"}
                  </span>
                </div>

                {/* Photo Carousel Showcase */}
                <div className="overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 h-64 sm:h-80">
                  <ImageCarousel 
                    images={images} 
                    title={prop.title} 
                    rounded="rounded-2xl"
                  />
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-100">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Semester Rent</span>
                    <span className="text-sm font-black text-slate-900">{formatKES(prop.semester_rent)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Available Units</span>
                    <span className="text-sm font-bold text-slate-800">{prop.available_rooms || 0} Units</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Capacity</span>
                    <span className="text-sm font-bold text-slate-800">{prop.total_rooms || "N/A"} Units</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Deposit</span>
                    <span className="text-sm font-bold text-slate-800">
                      {prop.deposit ? formatKES(prop.deposit) : "None"}
                    </span>
                  </div>
                </div>

                {prop.rejection_reason && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-medium">
                    <strong className="font-bold">Rejection Note: </strong> {prop.rejection_reason}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  {status !== "REJECTED" && (
                    <button
                      onClick={() => {
                        setRejectingProp(prop);
                        setRejectReason("");
                      }}
                      disabled={processingId === prop.id}
                      className="px-5 py-2.5 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject Listing
                    </button>
                  )}

                  {status !== "APPROVED" && (
                    <button
                      onClick={() => handleApprove(prop.id)}
                      disabled={processingId === prop.id}
                      className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {processingId === prop.id ? "Approving..." : "Approve Listing"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingProp && (
        <div 
          onClick={() => setRejectingProp(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Reject Property Listing</h3>
              <button onClick={() => setRejectingProp(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Specify why <strong className="text-slate-900">{rejectingProp.title}</strong> is being rejected. Feedback will be sent to the landlord.
              </p>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Select Reasons
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectReason(reason)}
                      className={`text-[11px] px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        rejectReason === reason
                          ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Reason / Notes
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide specific feedback..."
                  className="w-full p-3 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setRejectingProp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingId === rejectingProp.id}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {processingId === rejectingProp.id ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}