import React, { useState } from 'react';
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
  clients,
  projects,
  currencies
}) => {
  const [selectedClientId, setSelectedClientId] = useState('');

  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  // Filter projects based on selected client
  const filteredProjects = selectedClientId 
    ? projects.filter(p => p.client_id === selectedClientId)
    : projects;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-6">
          <div>
            <CardTitle className="text-xl font-bold">New Invoice</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Issue a professional billing document.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={<span>Invoice Number <span className="text-red-500 font-bold">*</span></span>} name="invoice_number" placeholder="INV-2024-001" required />
              <Input label={<span>Invoice Date <span className="text-red-500 font-bold">*</span></span>} name="invoice_date" type="date" required />
            </div>
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
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Direction <span className="text-red-500 font-bold">*</span></label>
              <select name="type" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                <option value="Outbound">Outbound </option>
                <option value="Inbound">Inbound </option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Client / Recipient <span className="text-red-500 font-bold">*</span></label>
              <select 
                name="client_id" 
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" 
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
              >
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Associated Project <span className="text-red-500 font-bold">*</span></label>
              <select name="project_id" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                <option value="none">General (No project)</option>
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={<span>Due Date <span className="text-red-500 font-bold">*</span></span>} name="due_date" type="date" required />
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Document (PDF/Image) <span className="text-red-500 font-bold">*</span></label>
                <input type="file" name="document" className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" required />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Issue Invoice"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceModal;

