import { useState, useEffect } from "react";
import { Wrench, Plus, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import api from "../services/api";

const PRIORITY_STYLE = {
  URGENT: "bg-rose-100 text-rose-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-blue-100 text-blue-800",
};

const STATUS_STYLE = {
  SUBMITTED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-gray-100 text-gray-600",
};

export default function MaintenanceSection({ isLandlord = false }) {
  const [tickets, setTickets] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PLUMBING");
  const [priority, setPriority] = useState("MEDIUM");
  const [propertyId, setPropertyId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [ticketsRes, propsRes] = await Promise.all([
        api.get("/maintenance/"),
        !isLandlord ? api.get("/properties/") : Promise.resolve({ data: [] }),
      ]);
      setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : ticketsRes.data.results || []);
      const propData = propsRes.data.results || propsRes.data || [];
      setProperties(Array.isArray(propData) ? propData : []);
      if (propData.length > 0 && !propertyId) setPropertyId(propData[0].id);
    } catch (err) {
      console.error("Failed to fetch maintenance tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    setSubmitting(true);
    try {
      await api.post("/maintenance/", {
        title,
        description,
        category,
        priority,
        property: propertyId,
      });
      setShowModal(false);
      setTitle("");
      setDescription("");
      fetchData();
    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/maintenance/${id}/`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Failed to update ticket status:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Maintenance & Repair Tickets</h2>
          <p className="text-xs text-slate-500">Report plumbing, electrical, or structural issues and track resolution status.</p>
        </div>
        {!isLandlord && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-bold">Loading maintenance tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
          <Wrench className="mx-auto h-12 w-12 text-slate-300 mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-800">No repair tickets</h3>
          <p className="text-xs text-slate-500 mt-1">All systems operating normally.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t.property_title}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{t.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${PRIORITY_STYLE[t.priority]}`}>
                    {t.priority}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[t.status]}`}>
                    {t.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">{t.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                <span>Category: <strong className="text-slate-800">{t.category}</strong></span>
                <span>Submitted by: <strong className="text-slate-800">{t.student_name || "Tenant"}</strong></span>
              </div>

              {isLandlord && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-700">Update Status:</span>
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold bg-white text-slate-700 outline-none focus:border-slate-900 cursor-pointer"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 border border-slate-200 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Submit Maintenance Ticket</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Property / House</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold bg-slate-50 outline-none focus:border-slate-900"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} ({p.town})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Title</label>
                <input
                  type="text"
                  placeholder="e.g. Leaking kitchen sink pipe"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold bg-slate-50 outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-slate-50 outline-none focus:border-slate-900"
                  >
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="WIFI">Wi-Fi / Internet</option>
                    <option value="SECURITY">Security</option>
                    <option value="STRUCTURAL">Structural</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-semibold bg-slate-50 outline-none focus:border-slate-900"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  placeholder="Provide detailed description of the problem..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold bg-slate-50 outline-none focus:border-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
