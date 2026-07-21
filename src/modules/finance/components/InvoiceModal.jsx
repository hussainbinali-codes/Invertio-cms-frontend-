import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, Loader2 } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const InvoiceModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  clients = [],
  projects = [],
  currencies = [],
  onOpen,
  modalType = 'Outbound' // 'Outbound' or 'Inbound'
}) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceType, setInvoiceType] = useState(modalType);
  const [manualClientName, setManualClientName] = useState('');

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (isOpen) {
      setSelectedClientId('');
      setInvoiceType(modalType);
      setManualClientName('');
      if (typeof onOpen === 'function') onOpen();
    }
  }, [isOpen, modalType]);

  if (!isOpen) return null;

  const isOutbound = invoiceType === 'Outbound';

  // Filter projects based on selected client
  const filteredProjects = selectedClientId
    ? projects.filter(p => String(p.client_id) === String(selectedClientId))
    : projects;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-6">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isOutbound ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                {isOutbound ? 'Outbound Billing' : 'Inbound Bill'}
              </span>
              <CardTitle className="text-xl font-bold">
                {isOutbound ? 'New Outbound Invoice' : 'Record Inbound Invoice'}
              </CardTitle>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {isOutbound 
                ? 'Issue a client billing invoice with auto-generated PDF and invoice number.' 
                : 'Record a vendor bill or received invoice and upload the bill document.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1">
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="hidden" name="type" value={invoiceType} />

            {/* Type selector toggle */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Category</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setInvoiceType('Outbound'); setManualClientName(''); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${isOutbound ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Outbound ((Invoice to Client))
                </button>
                <button
                  type="button"
                  onClick={() => { setInvoiceType('Inbound'); setManualClientName(''); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${!isOutbound ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Inbound ((Paying to Client))
                </button>
              </div>
            </div>

            {/* Inbound-specific fields */}
            {!isOutbound && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label={<span>Vendor Invoice # <span className="text-red-500 font-bold">*</span></span>} 
                  name="invoice_number" 
                  placeholder="e.g. INV-99823" 
                  required 
                />
                <Input 
                  label={<span>Bill Date <span className="text-red-500 font-bold">*</span></span>} 
                  name="invoice_date" 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>
            )}

            {/* Outbound Client Selection / Inbound Vendor Name */}
            {isOutbound ? (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Client / Recipient <span className="text-red-500 font-bold">*</span></label>
                <select 
                  name="client_id" 
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" 
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  required
                >
                  <option value="">Select Client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Vendor / Supplier Name <span className="text-red-500 font-bold">*</span></label>
                <input
                  name="manual_client_name"
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  placeholder="Enter vendor or supplier name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  required
                />
              </div>
            )}

            {/* Associated Project */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Associated Project</label>
              <select name="project_id" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                <option value="none">General (No project)</option>
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={<span>Amount <span className="text-red-500 font-bold">*</span></span>} name="amount" type="number" min="0" step="0.01" placeholder="500.00" required />
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Currency <span className="text-red-500 font-bold">*</span></label>
                <select name="currency" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates & Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={<span>Due Date <span className="text-red-500 font-bold">*</span></span>} name="due_date" type="date" required />
              
              {!isOutbound ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Vendor Bill File (PDF/Image) <span className="text-red-500 font-bold">*</span></label>
                  <input type="file" name="document" accept=".pdf,image/*" className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" required />
                </div>
              ) : (
                <div className="space-y-1 flex flex-col justify-center">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Auto PDF Invoice</span>
                  <span className="text-[11px] text-slate-500">System will automatically generate PDF & invoice number.</span>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className={isOutbound ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isOutbound ? "Issue Outbound Invoice" : "Record Inbound Bill"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceModal;
