import React from 'react';
import PremiumCard from '../../../components/ui/PremiumCard';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import { Search, FileText, CheckCircle2, Download, Mail, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { hasPermission } from '../../../utils/permissionUtils';
import InvoiceStatusModal from './InvoiceStatusModal';

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
  fileBaseUrl
}) => {
  const [statusModal, setStatusModal] = React.useState({
    isOpen: false,
    invoice: null,
    targetStatus: ''
  });

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(invoiceSearch.toLowerCase());
    const matchesStatus = invoiceStatusFilter === 'All' || inv.status === invoiceStatusFilter;
    const matchesType = invoiceTypeFilter === 'All' || inv.type === invoiceTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const resolveFileUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${fileBaseUrl}${url}`;
  };

  const outboundCount = invoices.filter(i => i.type === 'Outbound').length;
  const inboundCount = invoices.filter(i => i.type === 'Inbound').length;

  return (
    <PremiumCard 
      title="Invoice Management" 
      subtitle={`Tracking ${invoices.length} billing records.`} 
      icon={FileText}
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl w-fit">
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
                  onClick={() => setInvoiceTypeFilter(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-[0.98]",
                    isActive 
                      ? "bg-white text-slate-900 shadow-sm font-bold" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
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
                    isActive ? "bg-slate-100 text-slate-800" : "bg-slate-200/60 text-slate-500"
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
              <TableRow>
                <TableHead className="py-4">Type</TableHead>
                <TableHead className="py-4">Invoice #</TableHead>
                <TableHead className="py-4">Recipient/Vendor</TableHead>
                <TableHead className="py-4">Amount</TableHead>
                <TableHead className="py-4">Date</TableHead>
                <TableHead className="py-4">Status</TableHead>
                <TableHead className="py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-500">No invoices found matching filters.</TableCell></TableRow>
              ) : (
                filteredInvoices.map(inv => (
                  <TableRow key={inv.id} className="group">
                    <TableCell className="py-5">
                      {inv.type === 'Outbound' ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-bold text-[10px] uppercase">Outbound (Billing)</Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold text-[10px] uppercase">Inbound (Vendor Bill)</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">{inv.invoice_number}</div>
                      {inv.document_url && (
                        <a
                          href={resolveFileUrl(inv.document_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          <FileText className="w-3 h-3" /> VIEW PDF
                        </a>
                      )}
                      {inv.payment_proof_urls && inv.payment_proof_urls.length > 0 ? (
                        <div className="flex flex-col gap-1 mt-1">
                          {inv.payment_proof_urls.map((proofUrl, idx) => (
                            <a
                              key={idx}
                              href={resolveFileUrl(proofUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>{inv.payment_proof_urls.length > 1 ? `PROOF #${idx + 1}` : 'VIEW PROOF'}</span>
                            </a>
                          ))}
                        </div>
                      ) : inv.payment_proof_url ? (
                        <a
                          href={resolveFileUrl(inv.payment_proof_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> VIEW PROOF
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="text-sm font-semibold text-slate-900">{inv.client_name || 'Vendor'}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5 tracking-wider">{inv.project_name || 'General Expense'}</div>
                    </TableCell>
                    <TableCell className="py-5 font-bold text-slate-900">
                      {currencies.find(c => c.code === inv.currency)?.symbol || '$'}
                      {inv.amount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-5 text-xs font-medium text-slate-500">
                      {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : new Date(inv.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'destructive' : 'default'} className="text-xs font-semibold text-slate-500">
                        {inv.status}
                      </Badge>
                      {inv.payment_notes && (
                        <p className="text-xs text-slate-500 font-medium mt-1 max-w-[120px] truncate" title={inv.payment_notes}>
                          {inv.payment_notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col items-start gap-2">
                        {inv.type === 'Outbound' ? (
                          inv.generated_pdf_url ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                              onClick={() => window.open(resolveFileUrl(inv.generated_pdf_url), '_blank', 'noopener,noreferrer')}
                            >
                              <Download className="w-3 h-3" />
                              Download Invoice
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <Download className="w-3 h-3 text-slate-400" />
                              Generating PDF...
                            </span>
                          )
                        ) : inv.document_url ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-wider"
                            onClick={() => window.open(resolveFileUrl(inv.document_url), '_blank', 'noopener,noreferrer')}
                          >
                            <FileText className="w-3 h-3" />
                            View Bill Document
                          </button>
                        ) : null}

                        {/* Send Reminder button ONLY for Outbound client invoices */}
                        {isSuperAdmin && inv.type === 'Outbound' && !['Paid', 'Cancelled'].includes(inv.status) && (
                          <button
                            type="button"
                            disabled={reminderSendingId === inv.id}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
                            onClick={() => sendPaymentReminder(inv.id)}
                          >
                            {reminderSendingId === inv.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Mail className="w-3 h-3" />
                            )}
                            {reminderSendingId === inv.id ? 'Sending...' : 'Send Reminder'}
                          </button>
                        )}

                        {inv.status === 'Cancelled' ? (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-bold text-[10px] uppercase">Cancelled</Badge>
                        ) : hasPermission('finance', 'invoices.edit') ? (
                          <select
                            className="bg-transparent border-none text-[10px] font-bold text-slate-400 focus:ring-0 cursor-pointer hover:text-primary-600 transition-colors uppercase tracking-wider"
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
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold text-slate-400 uppercase">LOCKED</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
    </PremiumCard>
  );
};

export default InvoicesTab;
