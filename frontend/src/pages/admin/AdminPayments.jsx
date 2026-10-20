import { useEffect, useState, useCallback } from "react";
import {
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Download,
  RotateCcw,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../services/api";
import AdminNav from "../../components/AdminNav";
import { useToast } from "../../context/ToastContext";

const STATUS_STYLE = {
  COMPLETED: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: "bg-emerald-100 text-emerald-800" },
  PENDING: { icon: <Clock className="h-3.5 w-3.5" />, cls: "bg-amber-100 text-amber-800" },
  FAILED: { icon: <XCircle className="h-3.5 w-3.5" />, cls: "bg-rose-100 text-rose-800" },
  CANCELLED: { icon: <XCircle className="h-3.5 w-3.5" />, cls: "bg-slate-100 text-slate-600" },
  REFUNDED: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: "bg-indigo-100 text-indigo-800" },
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { addToast } = useToast();

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
      addToast("Failed to load payments.", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, phaseFilter, addToast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const formatKES = (amount) => `KES ${Number(amount || 0).toLocaleString("en-KE")}`;

  const handleProcessRefund = async (payment) => {
    const amountNum = Number(payment.amount || 0);
    const retentionFee = amountNum * 0.05;
    const refundAmount = amountNum * 0.95;

    if (!window.confirm(`Approve 95% Refund for ${payment.student_name || "Student"}?\n\n- Original Amount: KES ${amountNum.toLocaleString()}\n- 5% Admin Fee Retention: KES ${retentionFee.toLocaleString()}\n- 95% Refund Payout: KES ${refundAmount.toLocaleString()}`)) {
      return;
    }

    setProcessingId(payment.id);
    setError("");
    try {
      await api.post(`/payments/admin/${payment.id}/refund/`, {
        reason: "Admin approved 95% refund with 5% retention fee",
      });
      addToast("Refund approved and 95% B2C payout initiated successfully!", "success");
      fetchPayments();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to process refund.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setProcessingId(null);
    }
  };

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

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title / Header
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Financial Records & M-Pesa Auditing Report", 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${new Date().toLocaleString("en-KE")}`, 14, 27);
    doc.text(`Completed Transactions: ${totals.completedCount} | Total Volume: KES ${totals.completedAmount.toLocaleString("en-KE")}`, 14, 33);

    // Table Data
    const tableColumn = ["Property", "Landlord", "Student", "Phase", "Amount (KES)", "Status", "Receipt", "Date"];
    const tableRows = filteredPayments.map((p) => [
      p.property_title || "",
      p.landlord_name || "",
      p.student_name || "",
      p.phase || "",
      Number(p.amount || 0).toLocaleString("en-KE"),
      p.status || "",
      p.mpesa_receipt_number || "—",
      p.transaction_date ? new Date(p.transaction_date).toLocaleDateString("en-KE") : new Date(p.created_at).toLocaleDateString("en-KE"),
    ]);

    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`financial_records_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-10 space-y-8 animate-fadeIn">
      {/* Shared Admin Navigation */}
      <AdminNav
        title="Financial Records & M-Pesa Auditing"
        subtitle="Platform-wide ledger of student deposit and rental disbursements across all landlords."
        onRefresh={fetchPayments}
        loading={loading}
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Completed Transactions
          </span>
          <div className="text-3xl font-black text-slate-900 mt-2">{totals.completedCount}</div>
          <span className="text-[11px] font-semibold text-emerald-600">Successfully settled</span>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Total Volume Collected
          </span>
          <div className="text-3xl font-black text-emerald-700 mt-2">
            {formatKES(totals.completedAmount)}
          </div>
          <span className="text-[11px] font-semibold text-emerald-800">Direct student deposits & rent</span>
        </div>
      </div>

      {/* Filters, Search and Export PDF */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search property, landlord, student, receipt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-slate-900"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold bg-white text-slate-700 outline-none focus:border-slate-900 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold bg-white text-slate-700 outline-none focus:border-slate-900 cursor-pointer"
        >
          <option value="">All Phases</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="RENT">Rent</option>
        </select>

        <button
          onClick={handleExportPDF}
          disabled={filteredPayments.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs font-bold">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-2">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent mb-2"></div>
            <p className="text-xs font-bold">Loading payment records...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-20 text-center">
            <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-3 stroke-[1.5]" />
            <h3 className="text-base font-bold text-slate-800">No payment records found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Adjust search queries or filters to view other transactions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[11px] text-slate-400 uppercase font-black tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-2xl">Property</th>
                  <th className="px-4 py-3">Landlord</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Phase</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">M-Pesa Receipt</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 rounded-r-2xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const style = STATUS_STYLE[p.status] || {
                    icon: null,
                    cls: "bg-slate-100 text-slate-700",
                  };
                  const isProcessing = processingId === p.id;
                  const canRefund = p.status === "COMPLETED" && !p.refund_approved;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {p.property_title}
                        <span className="block text-[11px] font-semibold text-slate-400">
                          Room #{p.booking_house_number || "Any"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">{p.landlord_name}</td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {p.student_name}
                        {p.phone_number && <span className="block text-[10px] text-slate-400 font-mono">{p.phone_number}</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          {p.phase}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900 text-sm">
                        {formatKES(p.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${style.cls}`}
                        >
                          {style.icon} {p.status}
                        </span>
                        {p.refund_approved && (
                          <span className="block text-[10px] font-semibold text-indigo-600 mt-0.5">
                            Refunded (95%): {formatKES(p.refunded_amount)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-slate-700">
                        {p.mpesa_receipt_number || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {p.transaction_date
                          ? new Date(p.transaction_date).toLocaleDateString("en-KE")
                          : new Date(p.created_at).toLocaleDateString("en-KE")}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {canRefund ? (
                          <button
                            onClick={() => handleProcessRefund(p)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className={`h-3 w-3 ${isProcessing ? "animate-spin" : ""}`} />
                            {isProcessing ? "Processing..." : "Refund 95%"}
                          </button>
                        ) : p.refund_approved ? (
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                            Processed
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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
