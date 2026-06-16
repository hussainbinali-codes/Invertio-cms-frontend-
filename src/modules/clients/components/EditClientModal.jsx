import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, Zap, User as UserIcon, Target, Sparkles, Loader2 } from 'lucide-react';
import { COUNTRIES } from '../../../constants/countries';

const EditClientModal = ({
  isOpen,
  onClose,
  editingClient,
  handleEditClient,
  CURRENCIES,
  leadSource,
  setLeadSource,
  refType,
  setRefType,
  allClients,
  isSubmitting
}) => {
  useLockBodyScroll(isOpen);
  if (!isOpen || !editingClient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Edit {editingClient.company_name}</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Update client details and financial information.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-0 bg-white overflow-y-auto flex-1">
          <form onSubmit={handleEditClient} className="max-h-[70vh] overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* Company Profile Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest flex items-center gap-2">
                  
                  Company Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Company Name" name="company_name" defaultValue={editingClient.company_name} placeholder="Acme Corp" required />
                  <Input label="Interested Project / Service" name="potential_project_name" defaultValue={editingClient.potential_project_name} placeholder="E-commerce App, Website, etc." required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Website" name="website" defaultValue={editingClient.website} placeholder="e.g. invertio.in" required />
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Industry</label>
                    <select name="industry" defaultValue={editingClient.industry} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
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
                <h3 className="text-xs font-bold text-primary-600 tracking-widest flex items-center gap-2">
                  
                  Point of Contact
                </h3>
                <Input label="Contact Person" name="contact_person" defaultValue={editingClient.contact_person} placeholder="Jane Doe" required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Email Address" name="email" type="email" defaultValue={editingClient.email} placeholder="jane@acme.com" required />
                  <Input label="Phone Number" name="phone" type="tel" pattern="\+[0-9]{1,4}[0-9]{10}" defaultValue={editingClient.phone} placeholder="+919876543210" title="Please enter a valid phone number with country code (e.g., +919876543210)" required />
                </div>
              </div>

              {/* Sales & Location Section */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest flex items-center gap-2">
                  
                  Sales & Location
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Input label="Lead Score (0-100)" name="lead_score" type="number" min="0" max="100" defaultValue={editingClient.lead_score} placeholder="80" required />
                  </div>
                  <div className="col-span-2">
                    <Input label="Expected Value" name="expected_value" type="number" min="0" step="0.01" defaultValue={editingClient.expected_value} placeholder="5000" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Currency</label>
                    <select name="currency" defaultValue={editingClient.currency} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Country</label>
                    <select name="country" defaultValue={editingClient.country} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                      <option value="">Select Country</option>
                      {COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input label="Full Address" name="address" defaultValue={editingClient.address} placeholder="123 Business St, Suite 100" required />
              </div>

              {/* Reference Section */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-primary-600 uppercase tracking-widest flex items-center gap-2">
                  
                  Lead Source & Reference
                </h3>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Lead Source</label>
                  <select
                    name="lead_source"
                    defaultValue={editingClient.lead_source || 'Direct'}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    onChange={(e) => setLeadSource(e.target.value)}
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

                {(leadSource === 'Reference' || (!leadSource && editingClient.lead_source === 'Reference')) && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Reference Type</label>
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        onChange={(e) => setRefType(e.target.value)}
                        defaultValue={editingClient.reference_id ? 'client' : (editingClient.reference_name_other ? 'other' : 'client')}
                        required
                      >
                        <option value="client">Existing Client</option>
                        <option value="other">Other / New Reference</option>
                      </select>
                    </div>

                    {(refType === 'client' || (!refType && editingClient.reference_id)) ? (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Select Client</label>
                        <select name="reference_id" defaultValue={editingClient.reference_id} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                          <option value="">Select a client...</option>
                          {allClients.map(c => (
                            <option key={c.id} value={c.id}>{c.company_name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <Input label="Reference Name / Details" name="reference_name_other" defaultValue={editingClient.reference_name_other} placeholder="Enter reference name..." required />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Share Type</label>
                        <select name="reference_share_type" defaultValue={editingClient.reference_share_type} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                          <option value="Percentage">Percentage (%)</option>
                          <option value="Fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <Input label="Share Value" name="reference_share_value" type="number" min="0" step="0.01" defaultValue={editingClient.reference_share_value} placeholder="10" required />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 bg-slate-50 border-t border-slate-100 sticky bottom-0">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Client Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditClientModal;
