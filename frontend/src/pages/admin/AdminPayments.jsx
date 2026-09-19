import { useEffect, useState, useCallback } from "react";
import {
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import api from "../../services/api";

const STATUS_STYLE = {
  COMPLETED: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: "bg-emerald-100 text-emerald-800" },
  PENDING: { icon: <Clock className="h-3.5 w-3.5" />, cls: "bg-amber-100 text-amber-800" },
  FAILED: { icon: <XCircle className="h-3.5 w-3.5" />, cls: "bg-red-100 text-red-800" },
  CANCELLED: { icon: <XCircle className="h-3.5 w-3.5" />, cls: "bg-slate-100 text-slate-600" },
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (phaseFilter) params.phase = phaseFilter;

      const res = await api.get("/payments/admin/", { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setPayments(data);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, phaseFilter]);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (phaseFilter) params.phase = phaseFilter;

        const res = await api.get("/payments/admin/", { params });
        if (!ignore) {
          const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
          setPayments(data);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch payments:", err);
          setError("Failed to load payments. Please try again.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [statusFilter, phaseFilter]);

  const formatKES = (amount) => `KES ${Number(amount || 0).toLocaleString("en-KE")}`;

  const filteredPayments = payments.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.property_title?.toLowerCase().includes(term) ||
      p.landlord_name?.toLowerCase().includes(term) ||
      p.student_name?.toLowerCase().includes(term) ||
      p.mpesa_receipt_number?.toLowerCase().includes(term)
    );
  });

  const totals = filteredPayments.reduce(
    (acc, p) => {
      if (p.status === "COMPLETED") {
        acc.completedCount += 1;
        acc.completedAmount += Number(p.amount) || 0;
      }
      return acc;
    },
    { completedCount: 0, completedAmount: 0 }
  );

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Platform-wide view of deposit and rent payments across all landlords.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center gap-2 self-start px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Completed Payments
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totals.completedCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Collected
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatKES(totals.completedAmount)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search property, landlord, student, receipt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">All Phases</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="RENT">Rent</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mb-2"></div>
            <p className="text-sm">Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No payments found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your filters or search term.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Property</th>
                  <th className="px-4 py-3 text-left font-semibold">Landlord</th>
                  <th className="px-4 py-3 text-left font-semibold">Student</th>
                  <th className="px-4 py-3 text-left font-semibold">Phase</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Receipt</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const style = STATUS_STYLE[p.status] || {
                    icon: null,
                    cls: "bg-slate-100 text-slate-700",
                  };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {p.property_title}
                        <span className="block text-xs text-slate-400">
                          Room {p.booking_house_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.landlord_name}</td>
                      <td className="px-4 py-3 text-slate-600">{p.student_name}</td>
                      <td className="px-4 py-3 text-slate-600">{p.phase}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {formatKES(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.cls}`}
                        >
                          {style.icon} {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {p.mpesa_receipt_number || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {p.transaction_date
                          ? new Date(p.transaction_date).toLocaleString("en-KE")
                          : new Date(p.created_at).toLocaleString("en-KE")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}