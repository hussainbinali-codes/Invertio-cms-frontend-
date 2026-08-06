import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, Zap, User as UserIcon, Target, Sparkles, Loader2, Building2 } from 'lucide-react';
import { COUNTRIES } from '../../../constants/countries';
import { cn } from '../../../utils/cn';

const AddClientModal = ({
  isOpen,
  onClose,
  activeTab,
  handleAddClient,
  projects,
  MAINTENANCE_STATUSES,
  CURRENCIES,
  leadSource,
  setLeadSource,
  refType,
  setRefType,
  allClients = [],
  isSubmitting
}) => {
  useLockBodyScroll(isOpen);

  const [clientMode, setClientMode] = useState('new'); // 'new' or 'existing'
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setClientMode('new');
      setSelectedClient(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClientSelect = (clientId) => {
    const found = allClients.find(c => c.id === clientId);
    setSelectedClient(found || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Add New {activeTab}</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Enter details to add a new lead to the pipeline.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-0 bg-white overflow-y-auto flex-1">
          <form onSubmit={handleAddClient} className="max-h-[70vh] overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* Client Selection Mode Switcher */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Client Profile Option</label>
                <div className="bg-slate-100 p-1.5 rounded-xl flex gap-2 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setClientMode('new');
                      setSelectedClient(null);
                    }}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                      clientMode === 'new' ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-600 hover:bg-slate-200/60"
                    )}
                  >
                    <Building2 className="w-4 h-4" />
                    New Client & Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientMode('existing')}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                      clientMode === 'existing' ? "bg-white text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-600 hover:bg-slate-200/60"
                    )}
                  >
                    <UserIcon className="w-4 h-4" />
                    Existing Client (Add New Lead / Project)
                  </button>
                </div>
              </div>

              {/* Existing Client Selector */}
              {clientMode === 'existing' && (
                <div className="space-y-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-blue-900 uppercase">Select Registered Client / Account</label>
                  <select
                    name="existing_client_id"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-800"
                    value={selectedClient?.id || ''}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    required={clientMode === 'existing'}
                  >
                    <option value="">Select Existing Client...</option>
                    {allClients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} — {c.contact_person || 'N/A'} ({c.email || 'No email'})
                      </option>
                    ))}
                  </select>
                  {selectedClient && (
                    <p className="text-[11px] text-blue-700 font-medium italic">
                      ✓ Point of contact and company details loaded for <strong>{selectedClient.company_name}</strong>.
                    </p>
                  )}
                </div>
              )}

              {/* Company Profile Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Company Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Company Name" 
                    name="company_name" 
                    placeholder="Acme Corp" 
                    defaultValue={selectedClient?.company_name || ''}
                    readOnly={clientMode === 'existing' && !!selectedClient}
                    required={clientMode === 'new'} 
                  />
                  <Input 
                    label="Interested Project / Service" 
                    name="potential_project_name" 
                    placeholder="E-commerce App, Mobile Web App, etc." 
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Website" 
                    name="website" 
                    placeholder="e.g. https://invertio.in" 
                    defaultValue={selectedClient?.website || ''}
                    readOnly={clientMode === 'existing' && !!selectedClient}
                    required={clientMode === 'new'} 
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Industry</label>
                    <select 
                      name="industry" 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" 
                      defaultValue={selectedClient?.industry || ''}
                      disabled={clientMode === 'existing' && !!selectedClient}
                      required={clientMode === 'new'}
                    >
                      <option value="">Select Industry</option>
                      <option value="Technology">Technology</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Education">Education</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Point of Contact Section */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  Point of Contact Details
                </h3>
                <Input 
                  label="Contact Person" 
                  name="contact_person" 
                  placeholder="Jane Doe" 
                  defaultValue={selectedClient?.contact_person || ''}
                  readOnly={clientMode === 'existing' && !!selectedClient}
                  required={clientMode === 'new'} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Email Address" 
                    name="email" 
                    type="email" 
                    placeholder="jane@acme.com" 
                    defaultValue={selectedClient?.email || ''}
                    readOnly={clientMode === 'existing' && !!selectedClient}
                    required={clientMode === 'new'} 
                  />
                  <Input 
                    label="Phone Number" 
                    name="phone" 
                    type="tel" 
                    placeholder="+15550192834" 
                    defaultValue={selectedClient?.phone || ''}
                    readOnly={clientMode === 'existing' && !!selectedClient}
                    required={clientMode === 'new'} 
                  />
                </div>
              </div>

              {/* Sales & Location Section */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Sales & Location
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Input label="Lead Score (0-100)" name="lead_score" type="number" min="0" max="100" placeholder="80" required />
                  </div>
                  <div className="col-span-2">
                    <Input label="Expected Value" name="expected_value" type="number" min="0" step="0.01" placeholder="5000" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Currency</label>
                    <select name="currency" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Country</label>
                    <select 
                      name="country" 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" 
                      defaultValue={selectedClient?.country || "United States"}
                      disabled={clientMode === 'existing' && !!selectedClient}
                      required={clientMode === 'new'}
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input 
                  label="Full Address" 
                  name="address" 
                  placeholder="123 Business St, Suite 100" 
                  defaultValue={selectedClient?.address || ''}
                  readOnly={clientMode === 'existing' && !!selectedClient}
                  required={clientMode === 'new'} 
                />
              </div>

              {/* Reference Section */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Lead Source & Reference
                </h3>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Lead Source</label>
                  <select
                    name="lead_source"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    onChange={(e) => setLeadSource(e.target.value)}
                    value={leadSource}
                    required
                  >
                    <option value="Direct">Direct</option>
                    <option value="Reference">Reference</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Email Marketing">Email Marketing</option>
                    <option value="Event">Event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {leadSource === 'Reference' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Reference Type</label>
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        onChange={(e) => setRefType(e.target.value)}
                        value={refType}
                        required
                      >
                        <option value="client">Existing Client</option>
                        <option value="other">Other / New Reference</option>
                      </select>
                    </div>

                    {refType === 'client' ? (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Select Client</label>
                        <select name="reference_id" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                          <option value="">Select a client...</option>
                          {allClients.map(c => (
                            <option key={c.id} value={c.id}>{c.company_name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <Input label="Reference Name / Details" name="reference_name_other" placeholder="Enter reference name..." required />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Share Type</label>
                        <select name="reference_share_type" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                          <option value="Percentage">Percentage (%)</option>
                          <option value="Fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <Input label="Share Value" name="reference_share_value" type="number" min="0" step="0.01" placeholder="10" required />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 bg-slate-50 border-t border-slate-100 sticky bottom-0">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (clientMode === 'existing' ? "Create Lead for Client" : "Create Client Profile")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddClientModal;
