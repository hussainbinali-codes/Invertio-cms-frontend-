import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import toast from 'react-hot-toast';

const MAX_LINE_ITEMS = 7;

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
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [invoiceType, setInvoiceType] = useState(modalType);
  const [manualClientName, setManualClientName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [lineItems, setLineItems] = useState([
    { description: '', amount: '' }
  ]);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (isOpen) {
      setSelectedClientId('');
      setSelectedProjectId('');
      setInvoiceType(modalType);
      setManualClientName('');
      setSelectedCurrency(currencies[0]?.code || 'USD');
      setLineItems([{ description: '', amount: '' }]);
      if (typeof onOpen === 'function') onOpen();
    }
  }, [isOpen, modalType, currencies]);

  // Deduplicate client entries so each client company appears exactly once in the dropdown
  const uniqueClients = React.useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const c of clients) {
      const key = (c.company_name || '').trim().toLowerCase() || String(c.id);
      if (!seen.has(key)) {
        seen.add(key);
        list.push(c);
      }
    }
    return list.sort((a, b) => (a.company_name || '').localeCompare(b.company_name || ''));
  }, [clients]);

  // Find all client IDs matching the selected client company (including multi-lead entries)
  const selectedClientObj = clients.find(c => String(c.id) === String(selectedClientId));
  const clientIdsForCompany = React.useMemo(() => {
    if (!selectedClientObj) return new Set();
    const targetName = (selectedClientObj.company_name || '').trim().toLowerCase();
    const parentId = selectedClientObj.existing_client_id || selectedClientObj.id;
    return new Set(
      clients
        .filter(c => 
          String(c.id) === String(parentId) || 
          String(c.existing_client_id) === String(parentId) ||
          (targetName && (c.company_name || '').trim().toLowerCase() === targetName)
        )
        .map(c => String(c.id))
    );
  }, [selectedClientObj, clients]);

  // Filter projects based on selected client (1-to-Many mapping)
  const filteredProjects = selectedClientId
    ? projects.filter(p => clientIdsForCompany.has(String(p.client_id)))
    : projects;

  const handleClientChange = (e) => {
    const cId = e.target.value;
    setSelectedClientId(cId);
    setSelectedProjectId('');

    if (cId) {
      const client = clients.find(c => String(c.id) === String(cId));
      if (client?.currency) {
        setSelectedCurrency(client.currency);
      }
    }
  };

  const handleProjectChange = (e) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    if (projId && projId !== 'none') {
      const proj = projects.find(p => String(p.id) === String(projId));
      if (proj && proj.client_id) {
        const targetClient = clients.find(c => String(c.id) === String(proj.client_id));
        if (targetClient) {
          const companyName = (targetClient.company_name || '').trim().toLowerCase();
          const parentId = targetClient.existing_client_id || targetClient.id;
          const reprClient = uniqueClients.find(uc => 
            String(uc.id) === String(parentId) || 
            String(uc.existing_client_id) === String(parentId) ||
            (companyName && (uc.company_name || '').trim().toLowerCase() === companyName)
          );
          if (reprClient) {
            setSelectedClientId(String(reprClient.id));
          } else {
            setSelectedClientId(String(proj.client_id));
          }
          if (targetClient.currency) {
            setSelectedCurrency(targetClient.currency);
          }
        } else {
          setSelectedClientId(String(proj.client_id));
        }
      }

      // If line item 0 description is empty, suggest the project name
      if (proj && lineItems.length === 1 && !lineItems[0].description) {
        setLineItems([{ description: `${proj.name} Services`, amount: lineItems[0].amount }]);
      }
    }
  };

  const handleAddLineItem = () => {
    if (lineItems.length >= MAX_LINE_ITEMS) {
      toast.error(`Maximum ${MAX_LINE_ITEMS} rows allowed`);
      return;
    }
    setLineItems(prev => [...prev, { description: '', amount: '' }]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index, field, value) => {
    setLineItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  if (!isOpen) return null;

  const isOutbound = invoiceType === 'Outbound';

  // Calculate live total for outbound line items
  const outboundTotal = lineItems.reduce((sum, item) => {
    const val = parseFloat(item.amount) || 0;
    return sum + val;
  }, 0);

  // Active currency symbol
  const activeCurrencyObj = currencies.find(c => c.code === selectedCurrency);
  const currencySymbol = activeCurrencyObj?.symbol || (
    selectedCurrency === 'USD' ? '$' :
    selectedCurrency === 'INR' ? '₹' :
    selectedCurrency === 'EUR' ? '€' :
    selectedCurrency === 'GBP' ? '£' :
    selectedCurrency
  );

  // Prepare sanitized line items for PDF & backend
  const preparedLineItems = lineItems.map((item, idx) => ({
    description: (item.description || '').trim() || `Professional Services (Item ${idx + 1})`,
    amount: parseFloat(item.amount) || 0
  }));

  const handleFormSubmit = (e) => {
    if (isOutbound) {
      if (outboundTotal <= 0) {
        e.preventDefault();
        toast.error('Please enter at least one valid amount greater than 0.');
        return;
      }
    }
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-2xl sm:max-w-3xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-b border-slate-100 shrink-0">
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
                ? 'Issue a client billing invoice with auto-generated PDF and itemized amounts (max 7).' 
                : 'Record a vendor bill or received invoice and upload the bill document.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <input type="hidden" name="type" value={invoiceType} />

            {/* Type selector toggle */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Category</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setInvoiceType('Outbound'); setManualClientName(''); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${isOutbound ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Outbound ((Invoice to Client))
                </button>
                <button
                  type="button"
                  onClick={() => { setInvoiceType('Inbound'); setManualClientName(''); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${!isOutbound ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
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
                  className="cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
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
                  onChange={handleClientChange}
                  required
                >
                  <option value="">Select Client...</option>
                  {uniqueClients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
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
              <select 
                name="project_id" 
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                value={selectedProjectId}
                onChange={handleProjectChange}
              >
                <option value="none">General (No project)</option>
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Amount and Items Section */}
            {isOutbound ? (
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Invoice Amounts & Items
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        {lineItems.length} / {MAX_LINE_ITEMS} Rows
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Add up to {MAX_LINE_ITEMS} distinct service rows. Each row is rendered in the PDF table.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Currency:</label>
                    <select
                      name="currency"
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
                      required
                    >
                      {currencies.map(c => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol || c.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rows Header */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-7">Description / Service</div>
                  <div className="col-span-3 text-right">Amount ({currencySymbol})</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {/* Line Items List */}
                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col sm:grid sm:grid-cols-12 gap-2 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs items-center"
                    >
                      {/* Row number */}
                      <div className="hidden sm:flex sm:col-span-1 items-center justify-center">
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                          {index + 1}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="w-full sm:col-span-7">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                          placeholder={index === 0 ? "Description (e.g. Frontend Development, Consultation)" : `Item ${index + 1} description`}
                          className="w-full px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Amount */}
                      <div className="w-full sm:col-span-3 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                          placeholder="0.00"
                          required={index === 0}
                          className="w-full pl-7 pr-2.5 py-1.5 text-xs font-bold text-right text-slate-900 bg-slate-50/50 rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Action */}
                      <div className="flex sm:col-span-1 items-center justify-end sm:justify-center w-full">
                        {lineItems.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-7 h-7" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Row Button & Total Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div>
                    {lineItems.length < MAX_LINE_ITEMS ? (
                      <button
                        type="button"
                        onClick={handleAddLineItem}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-[1.01]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Another Amount ({lineItems.length}/{MAX_LINE_ITEMS})</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">
                        ✓ Reached maximum of {MAX_LINE_ITEMS} rows
                      </span>
                    )}
                  </div>

                  {/* Computed Total */}
                  <div className="flex items-center gap-3 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount:</span>
                    <span className="text-base font-extrabold text-blue-700">
                      {currencySymbol} {outboundTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Hidden form fields for request payload */}
                <input type="hidden" name="amount" value={outboundTotal > 0 ? outboundTotal.toFixed(2) : ''} />
                <input type="hidden" name="line_items" value={JSON.stringify(preparedLineItems)} />
              </div>
            ) : (
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
            )}

            {/* Dates & Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label={<span>Due Date <span className="text-red-500 font-bold">*</span></span>} 
                name="due_date" 
                type="date" 
                required 
                className="cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              
              {!isOutbound ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Vendor Bill File (PDF/Image) <span className="text-red-500 font-bold">*</span></label>
                  <input type="file" name="document" accept=".pdf,image/*" className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" required />
                </div>
              ) : (
                <div className="space-y-1 flex flex-col justify-center">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Auto PDF Invoice</span>
                  <span className="text-[11px] text-slate-500">System will automatically generate PDF with all {lineItems.length} amount rows & invoice number.</span>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className={isOutbound ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" : "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"}>
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
