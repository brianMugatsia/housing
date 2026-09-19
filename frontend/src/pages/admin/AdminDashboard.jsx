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
  Maximize2,
  RefreshCw
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const PREDEFINED_REASONS = [
  "Blurry or low-quality photographs",
  "Incomplete address / location details",
  "Inaccurate or unrealistic pricing",
  "Duplicate listing submission",
];

// Helper to determine single source of truth for status
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
  
  // Data States
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PENDING"); // 'PENDING', 'APPROVED', 'REJECTED'
  const [searchTerm, setSearchTerm] = useState("");

  // Action States
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Modal States
  const [previewImage, setPreviewImage] = useState(null);
  const [rejectingProp, setRejectingProp] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchProperties = useCallback(async () => {
    try {
      const res = await api.get("/admin/properties/");
      const rawData = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setProperties(rawData);
    } catch {
      try {
        const altRes = await api.get("/properties/?all=true");
        const rawData = Array.isArray(altRes.data) ? altRes.data : altRes.data?.results || [];
        setProperties(rawData);
      } catch (fallbackErr) {
        console.error("Failed to fetch properties:", fallbackErr);
        setActionError("Failed to load properties. Please refresh.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/properties/");
        const rawData = Array.isArray(res.data) ? res.data : res.data?.results || [];
        if (isMounted) setProperties(rawData);
      } catch {
        try {
          const altRes = await api.get("/properties/?all=true");
          const rawData = Array.isArray(altRes.data) ? altRes.data : altRes.data?.results || [];
          if (isMounted) setProperties(rawData);
        } catch (fallbackErr) {
          console.error("Failed to fetch properties:", fallbackErr);
          if (isMounted) setActionError("Failed to load properties. Please refresh.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle ESC key press for Modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
        setRejectingProp(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleManualRefresh = () => {
    setLoading(true);
    setActionError("");
    fetchProperties();
  };

  // Filtered Properties Logic
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // Tab Filter
      const status = getPropertyStatus(prop);
      if (status !== activeTab) return false;

      // Search Filter
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

  // Counts computed dynamically across dataset
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
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to approve property.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setActionError("Please select or enter a rejection reason.");
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
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to reject property.");
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
    <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Admin Verification Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{user?.full_name || user?.username || "Admin"}</span>. Review and verify property listings.
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={loading}
          className="flex items-center gap-2 self-start md:self-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-slate-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex items-center justify-between rounded-xl p-5 border text-left transition-all cursor-pointer ${
            activeTab === "PENDING"
              ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Review</span>
            <div className="text-2xl font-bold text-slate-900">{counts.pending}</div>
          </div>
          <div className="rounded-lg bg-amber-100 p-3 text-amber-700">
            <Clock className="h-6 w-6" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab("APPROVED")}
          className={`flex items-center justify-between rounded-xl p-5 border text-left transition-all cursor-pointer ${
            activeTab === "APPROVED"
              ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Approved</span>
            <div className="text-2xl font-bold text-slate-900">{counts.approved}</div>
          </div>
          <div className="rounded-lg bg-emerald-100 p-3 text-emerald-700">
            <CheckCircle className="h-6 w-6" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab("REJECTED")}
          className={`flex items-center justify-between rounded-xl p-5 border text-left transition-all cursor-pointer ${
            activeTab === "REJECTED"
              ? "border-red-500 bg-red-50/50 ring-2 ring-red-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700">Rejected</span>
            <div className="text-2xl font-bold text-slate-900">{counts.rejected}</div>
          </div>
          <div className="rounded-lg bg-red-100 p-3 text-red-700">
            <XCircle className="h-6 w-6" />
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, town, landlord..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredProperties.length}</span> properties
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Content Section */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mb-2"></div>
          <p className="text-sm">Fetching properties...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No properties found</h3>
          <p className="text-sm text-slate-500 mt-1">
            There are currently no listings matching the criteria in this section.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProperties.map((prop) => {
            const status = getPropertyStatus(prop);

            return (
              <div
                key={prop.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
              >
                <div className="p-6">
                  {/* Header Info */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">{prop.title}</h2>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                          {prop.property_type || "Apartment"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {prop.town}, {prop.county}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {renderLandlordName(prop.landlord)}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                          Near {renderUniversityName(prop.university)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`self-start px-3 py-1 text-xs font-semibold rounded-full ${
                        status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {status === "APPROVED"
                        ? "Approved"
                        : status === "REJECTED"
                        ? "Rejected"
                        : "Pending Review"}
                    </span>
                  </div>

                  {/* Photos Gallery Horizontal Scroll */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Uploaded Photos ({prop.images?.length || 0})
                      </h3>
                      <span className="text-xs text-slate-400">Click photo to enlarge</span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {prop.images && prop.images.length > 0 ? (
                        prop.images.map((img, index) => {
                          const imgSrc = typeof img === "string" ? img : img.image;
                          return (
                            <div
                              key={img.id || index}
                              onClick={() => setPreviewImage(imgSrc)}
                              className="group relative h-28 w-40 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                            >
                              <img
                                src={imgSrc}
                                alt={`Property visual ${index + 1}`}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                                <Maximize2 className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-sm text-slate-400 italic">
                          No image assets uploaded for this property.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Meta Specs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg text-sm mb-4 border border-slate-100">
                    <div>
                      <span className="block text-xs font-medium text-slate-400">Monthly Rent</span>
                      <span className="text-base font-bold text-slate-900">{formatKES(prop.monthly_rent)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-400">Available Rooms</span>
                      <span className="font-semibold text-slate-800">{prop.available_rooms || 0} Units</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-400">Total Units</span>
                      <span className="font-semibold text-slate-800">{prop.total_rooms || "N/A"}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-400">Deposit Requirement</span>
                      <span className="font-semibold text-slate-800">
                        {prop.deposit ? formatKES(prop.deposit) : "None"}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Note Display */}
                  {prop.rejection_reason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                      <strong className="font-semibold">Rejection Note: </strong> {prop.rejection_reason}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                    {status !== "REJECTED" && (
                      <button
                        onClick={() => {
                          setRejectingProp(prop);
                          setRejectReason("");
                        }}
                        disabled={processingId === prop.id}
                        className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                      >
                        Reject
                      </button>
                    )}

                    {status !== "APPROVED" && (
                      <button
                        onClick={() => handleApprove(prop.id)}
                        disabled={processingId === prop.id}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                      >
                        {processingId === prop.id ? "Processing..." : "Approve Listing"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Image Lightbox */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center cursor-default"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2 focus:outline-none cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged property preview"
              className="max-h-[85vh] w-auto object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* MODAL 2: Rejection Reason Dialog */}
      {rejectingProp && (
        <div 
          onClick={() => setRejectingProp(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white max-w-md w-full rounded-xl shadow-xl border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Reject Property Listing</h3>
              <button onClick={() => setRejectingProp(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Please state why <strong className="text-slate-800">{rejectingProp.title}</strong> is being rejected. This feedback will be sent to the landlord.
              </p>

              {/* Predefined Chips */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick Select Reasons
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectReason(reason)}
                      className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${
                        rejectReason === reason
                          ? "bg-red-50 border-red-300 text-red-700 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Reason / Notes
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide specific feedback..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setRejectingProp(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingId === rejectingProp.id}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
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