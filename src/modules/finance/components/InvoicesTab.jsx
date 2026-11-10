import React from 'react';
import { createPortal } from 'react-dom';
import PremiumCard from '../../../components/ui/PremiumCard';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import { Search, FileText, CheckCircle2, Mail, Loader2, ArrowUpRight, ArrowDownLeft, Eye, Clock, ChevronDown, Building2, MoreVertical, Copy } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { hasPermission } from '../../../utils/permissionUtils';
import InvoiceStatusModal from './InvoiceStatusModal';
import axios from '../../../api/axios';
import toast from 'react-hot-toast';

const InvoicesTab = ({
  invoices,
  isRefreshing,
  invoiceSearch,
  setInvoiceSearch,
  invoiceTypeFilter,
  setInvoiceTypeFilter,
  invoiceStatusFilter,
  setInvoiceStatusFilter,
  currencies,
  updateStatus,
  sendPaymentReminder,
  reminderSendingId,
  isSuperAdmin,
  fileBaseUrl,
  yearFilter = 'All',
  monthFilter = 'All',
  dateFilter = '',
  fetchInvoices
}) => {
  const [generatingPdfId, setGeneratingPdfId] = React.useState(null);
  const [activeMenuInvoice, setActiveMenuInvoice] = React.useState(null);
  const [menuCoords, setMenuCoords] = React.useState(null);
  const menuRef = React.useRef(null);
  const [statusModal, setStatusModal] = React.useState({
    isOpen: false,
    invoice: null,
    targetStatus: ''
  });

  const handleToggleMenu = (e, inv) => {
    e.stopPropagation();
    if (activeMenuInvoice?.id === inv.id) {
      setActiveMenuInvoice(null);
      setMenuCoords(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Only flip upwards if there isn't enough space below (< 220px) AND there's more space above
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;

    setActiveMenuInvoice(inv);
    setMenuCoords({
      openUp,
      top: openUp ? undefined : Math.round(rect.bottom + 4),
      bottom: openUp ? Math.round(window.innerHeight - rect.top + 4) : undefined,
      right: Math.max(12, Math.round(window.innerWidth - rect.right)),
    });
  };

  React.useEffect(() => {
    if (!activeMenuInvoice) return;

    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuInvoice(null);
        setMenuCoords(null);
      }
    };

    const handleScrollOrResize = () => {
      setActiveMenuInvoice(null);
      setMenuCoords(null);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeMenuInvoice]);

  const handleCopyInvoiceNumber = (invNum) => {
    if (!invNum) return;
    navigator.clipboard.writeText(invNum);
    toast.success(`Copied "${invNum}" to clipboard`);
    setActiveMenuInvoice(null);
  };

  const handleGeneratePdf = async (invoiceId) => {
    setGeneratingPdfId(invoiceId);
    try {
      const res = await axios.post(`/finance/invoices/${invoiceId}/generate-pdf`);
      toast.success('Invoice PDF generated successfully');
      const pdfUrl = res.data?.data?.url;
      if (pdfUrl) {
        window.open(resolveFileUrl(pdfUrl), '_blank', 'noopener,noreferrer');
      }
      if (typeof fetchInvoices === 'function') {
        fetchInvoices(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate PDF');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const filteredInvoices = (invoices || []).filter(inv => {
    const rawDate = inv.invoice_date || inv.created_at;
    const invDateObj = rawDate ? new Date(rawDate) : null;

    const searchLower = (invoiceSearch || '').toLowerCase().trim();
    const invNumber = (inv.invoice_number || '').toLowerCase();
    const clientName = (inv.client_name || '').toLowerCase();
    const projectName = (inv.project_name || '').toLowerCase();

    const matchesSearch = !searchLower ||
      invNumber.includes(searchLower) ||
      clientName.includes(searchLower) ||
      projectName.includes(searchLower);

    const matchesStatus = invoiceStatusFilter === 'All' || inv.status === invoiceStatusFilter;
    const matchesType = invoiceTypeFilter === 'All' || inv.type === invoiceTypeFilter;

    const matchesYear = !invDateObj || yearFilter === 'All' || invDateObj.getFullYear() === Number(yearFilter);
    const matchesMonth = !invDateObj || monthFilter === 'All' || (invDateObj.getMonth() + 1) === Number(monthFilter);
    const matchesDate = !dateFilter || (rawDate && String(rawDate).startsWith(dateFilter));

    return matchesSearch && matchesStatus && matchesType && matchesYear && matchesMonth && matchesDate;
  });

  const resolveFileUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${fileBaseUrl}${url}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const outboundCount = invoices.filter(i => i.type === 'Outbound').length;
  const inboundCount = invoices.filter(i => i.type === 'Inbound').length;

  return (
    <PremiumCard 
      title="Invoice Management" 
      subtitle={`Tracking ${invoices.length} billing records.`} 
      icon={FileText}
      headerClassName="border-b-0 pb-2"
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      headerRight={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice # or client..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:ring-primary-500 w-full sm:w-64"
            />
          </div>
          <select
            value={invoiceStatusFilter}
            onChange={(e) => setInvoiceStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 focus:ring-primary-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      }
    >
      <div className="flex-grow">
        {/* Inbound / Outbound View Tabs */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-6 pt-1 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'All', label: 'All Invoices', count: invoices.length },
              { id: 'Outbound', label: 'Outbound (Billing)', count: outboundCount, icon: ArrowUpRight },
              { id: 'Inbound', label: 'Inbound (Vendor Bills)', count: inboundCount, icon: ArrowDownLeft }
            ].map(tab => {
              const isActive = invoiceTypeFilter === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setInvoiceTypeFilter(tab.id);
                    if (typeof fetchInvoices === 'function') {
                      fetchInvoices(true);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-[0.98] border cursor-pointer shadow-2xs",
                    isActive 
                      ? "bg-white text-slate-900 border-slate-400 font-bold shadow-xs ring-1 ring-slate-300/40" 
                      : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {Icon && (
                    <Icon className={cn(
                      "w-3.5 h-3.5",
                      tab.id === 'Outbound' ? 'text-blue-600' : 'text-amber-600'
                    )} />
                  )}
                  <span>{tab.label}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 text-[10px] rounded-full font-bold",
                    isActive ? "bg-slate-100 text-slate-800" : "bg-slate-100 text-slate-500"
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {isRefreshing ? (
          <div className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 border-b border-slate-200/80">
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Invoice #</TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Recipient / Vendor</TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-slate-500 text-xs">
                    No invoices found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map(inv => {
                  const pdfUrl = inv.generated_pdf_url || inv.document_url;
                  const isRecent = inv.created_at && (Date.now() - new Date(inv.created_at).getTime()) < 30000;
                  const isPdfGenerating = generatingPdfId === inv.id || (!pdfUrl && isRecent);

                  return (
                    <TableRow key={inv.id} className="group hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-b-0">
                      {/* TYPE */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        {inv.type === 'Outbound' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
                            <ArrowUpRight className="w-3 h-3 text-blue-600" />
                            <span>Outbound</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
                            <ArrowDownLeft className="w-3 h-3 text-amber-600" />
                            <span>Inbound</span>
                          </span>
                        )}
                      </TableCell>

                      {/* INVOICE # */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{inv.invoice_number}</span>
                          </div>

                          {/* Payment proofs */}
                          {inv.payment_proof_urls && inv.payment_proof_urls.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {inv.payment_proof_urls.map((proofUrl, idx) => (
                                <a
                                  key={idx}
                                  href={resolveFileUrl(proofUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-1.5 py-0.5 rounded transition-colors"
                                  title="View proof of payment"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                  <span>Proof {inv.payment_proof_urls.length > 1 ? `#${idx + 1}` : ''}</span>
                                </a>
                              ))}
                            </div>
                          ) : inv.payment_proof_url ? (
                            <a
                              href={resolveFileUrl(inv.payment_proof_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-1.5 py-0.5 rounded transition-colors mt-0.5"
                              title="View proof of payment"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>Proof</span>
                            </a>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* RECIPIENT / VENDOR */}
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-2.5 min-w-[170px]">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs border",
                            inv.type === 'Outbound'
                              ? "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 border-blue-200/60"
                              : "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 border-amber-200/60"
                          )}>
                            {inv.type === 'Outbound' ? (
                              (inv.client_name || 'C').charAt(0).toUpperCase()
                            ) : (
                              <Building2 className="w-4 h-4 text-amber-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate" title={inv.client_name || 'Vendor'}>
                              {inv.client_name || 'Vendor'}
                            </div>
                            <div className="text-xs text-slate-500 font-medium truncate flex items-center gap-1" title={inv.project_name || 'General Expense'}>
                              {inv.project_name ? (
                                <>
                                  <span className="text-slate-400 font-normal">Project:</span>
                                  <span>{inv.project_name}</span>
                                </>
                              ) : (
                                <span>General Expense</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* AMOUNT */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-sm tabular-nums tracking-tight">
                          <span className="text-slate-500 mr-0.5 text-xs font-normal">
                            {currencies.find(c => c.code === inv.currency)?.symbol || (inv.currency === 'INR' ? '₹' : '$')}
                          </span>
                          {Number(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {inv.currency === 'INR' && inv.type === 'Outbound' && (() => {
                          let items = inv.line_items;
                          if (typeof items === 'string') {
                            try { items = JSON.parse(items); } catch { items = []; }
                          }
                          const hasGst = Array.isArray(items) && items.length > 0 ? items[0].apply_gst !== false : true;
                          const total = Number(inv.amount || 0);
                          if (hasGst && total > 0) {
                            const subtotal = total / 1.18;
                            const gst = total - subtotal;
                            return (
                              <div className="text-[10px] text-amber-700/90 font-medium tabular-nums mt-0.5" title={`Subtotal: ₹${subtotal.toFixed(2)} + GST: ₹${gst.toFixed(2)}`}>
                                Incl. 18% GST (₹{Math.round(gst).toLocaleString()})
                              </div>
                            );
                          }
                          return (
                            <div className="text-[10px] text-slate-400 font-medium tabular-nums mt-0.5">
                              No GST
                            </div>
                          );
                        })()}
                        {inv.currency !== 'INR' && inv.amount_inr && (
                          <div className="text-[10px] text-slate-400 font-medium tabular-nums mt-0.5">
                            ≈ ₹{Number(inv.amount_inr).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        )}
                      </TableCell>

                      {/* DATE */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-700 tabular-nums">
                          {formatDate(inv.invoice_date || inv.created_at)}
                        </div>
                        {inv.due_date && inv.status !== 'Paid' && (
                          <div className={cn(
                            "text-[10px] font-medium flex items-center gap-1 mt-0.5 tabular-nums",
                            new Date(inv.due_date) < new Date() ? "text-rose-600 font-semibold" : "text-slate-400"
                          )}>
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>Due: {formatDate(inv.due_date)}</span>
                          </div>
                        )}
                      </TableCell>

                      {/* STATUS */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          {hasPermission('finance', 'invoices.edit') && inv.status !== 'Cancelled' ? (
                            <div className="relative inline-flex items-center">
                              <select
                                value={inv.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  if (newStatus === 'Unpaid') {
                                    updateStatus(inv.id, { status: 'Unpaid', notes: '', proof: null });
                                  } else if (newStatus === 'Cancelled') {
                                    if (window.confirm('Are you sure you want to cancel this invoice? This action cannot be undone.')) {
                                      updateStatus(inv.id, { status: 'Cancelled', notes: 'Invoice cancelled', proof: null });
                                    }
                                  } else {
                                    setStatusModal({
                                      isOpen: true,
                                      invoice: inv,
                                      targetStatus: newStatus
                                    });
                                  }
                                }}
                                className={cn(
                                  "appearance-none text-xs font-semibold pl-2.5 pr-6 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all shadow-2xs",
                                  inv.status === 'Paid'
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/80 focus:ring-emerald-500/30"
                                    : inv.status === 'Overdue'
                                    ? "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/80 focus:ring-rose-500/30"
                                    : "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/80 focus:ring-amber-500/30"
                                )}
                              >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Paid">Paid</option>
                                <option value="Overdue">Overdue</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              <ChevronDown className={cn(
                                "w-3 h-3 absolute right-2 pointer-events-none opacity-60",
                                inv.status === 'Paid' ? "text-emerald-700" : inv.status === 'Overdue' ? "text-rose-700" : "text-amber-700"
                              )} />
                            </div>
                          ) : (
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs",
                              inv.status === 'Paid'
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                : inv.status === 'Overdue'
                                ? "bg-rose-50 text-rose-700 border-rose-200/80"
                                : inv.status === 'Cancelled'
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-amber-50 text-amber-700 border-amber-200/80"
                            )}>
                              {inv.status === 'Paid' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              <span>{inv.status}</span>
                            </span>
                          )}

                          {inv.payment_notes && (
                            <p className="text-[11px] text-slate-400 font-medium max-w-[130px] truncate" title={inv.payment_notes}>
                              {inv.payment_notes}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* 3-dots Menu Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleMenu(e, inv)}
                            className={cn(
                              "p-1.5 rounded-lg border transition-all active:scale-[0.98] shadow-2xs cursor-pointer flex items-center justify-center",
                              activeMenuInvoice?.id === inv.id
                                ? "bg-slate-100 text-slate-900 border-slate-300 shadow-inner"
                                : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200/80"
                            )}
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </Table>
        )}
      </div>

      <InvoiceStatusModal 
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        invoiceNumber={statusModal.invoice?.invoice_number}
        currentStatus={statusModal.invoice?.status}
        targetStatus={statusModal.targetStatus}
        onConfirm={async (data) => {
           await updateStatus(statusModal.invoice.id, data);
           setStatusModal({ isOpen: false, invoice: null, targetStatus: '' });
        }}
      />

      {/* 3-dots Portal Popup Menu: on top of everything, viewport bounded */}
      {activeMenuInvoice && menuCoords && createPortal(
        (() => {
          const invPdfUrl = activeMenuInvoice.generated_pdf_url || (activeMenuInvoice.type === 'Outbound' ? activeMenuInvoice.document_url : null);
          const hasDoc = Boolean(invPdfUrl || activeMenuInvoice.document_url);

          return (
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                ...(menuCoords.openUp
                  ? { bottom: `${menuCoords.bottom}px` }
                  : { top: `${menuCoords.top}px` }),
                right: `${menuCoords.right}px`,
                zIndex: 99999
              }}
              className="w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 animate-in fade-in zoom-in-95 duration-150 select-none divide-y divide-slate-100"
            >
              <div className="py-1">
                {/* View PDF for Outbound (if PDF exists) */}
                {activeMenuInvoice.type === 'Outbound' && invPdfUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      window.open(resolveFileUrl(invPdfUrl), '_blank', 'noopener,noreferrer');
                      setActiveMenuInvoice(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer text-left"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View PDF</span>
                  </button>
                )}

                {/* Generate PDF for Outbound (if PDF not yet generated) */}
                {activeMenuInvoice.type === 'Outbound' && !invPdfUrl && (
                  <button
                    type="button"
                    disabled={generatingPdfId === activeMenuInvoice.id}
                    onClick={() => {
                      const invId = activeMenuInvoice.id;
                      setActiveMenuInvoice(null);
                      handleGeneratePdf(invId);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer text-left disabled:opacity-50"
                  >
                    {generatingPdfId === activeMenuInvoice.id ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{generatingPdfId === activeMenuInvoice.id ? 'Generating...' : 'Generate PDF'}</span>
                  </button>
                )}

                {/* View Bill for Inbound (if document attached) */}
                {activeMenuInvoice.type === 'Inbound' && activeMenuInvoice.document_url && (
                  <button
                    type="button"
                    onClick={() => {
                      window.open(resolveFileUrl(activeMenuInvoice.document_url), '_blank', 'noopener,noreferrer');
                      setActiveMenuInvoice(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-amber-50/70 hover:text-amber-800 transition-colors cursor-pointer text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Bill</span>
                  </button>
                )}


                {/* Copy Invoice Number */}
                {activeMenuInvoice.invoice_number && (
                  <button
                    type="button"
                    onClick={() => handleCopyInvoiceNumber(activeMenuInvoice.invoice_number)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Invoice #</span>
                  </button>
                )}
              </div>

              {/* Payment Proof Option */}
              {(activeMenuInvoice.payment_proof_urls?.[0] || activeMenuInvoice.payment_proof_url) && (
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      const proofUrl = activeMenuInvoice.payment_proof_urls?.[0] || activeMenuInvoice.payment_proof_url;
                      window.open(resolveFileUrl(proofUrl), '_blank', 'noopener,noreferrer');
                      setActiveMenuInvoice(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer text-left"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Payment Proof</span>
                  </button>
                </div>
              )}

              {/* SuperAdmin Reminder Option */}
              {isSuperAdmin && activeMenuInvoice.type === 'Outbound' && !['Paid', 'Cancelled'].includes(activeMenuInvoice.status) && (
                <div className="py-1">
                  <button
                    type="button"
                    disabled={reminderSendingId === activeMenuInvoice.id}
                    onClick={() => {
                      sendPaymentReminder(activeMenuInvoice.id);
                      setActiveMenuInvoice(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer text-left disabled:opacity-50"
                  >
                    {reminderSendingId === activeMenuInvoice.id ? (
                      <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{reminderSendingId === activeMenuInvoice.id ? 'Sending...' : 'Send Reminder'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })(),
        document.body
      )}
    </PremiumCard>
  );
};

export default InvoicesTab;
