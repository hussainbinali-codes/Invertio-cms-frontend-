import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { X, Edit, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateLead } from "../../../api/campaignsApi";

const EditLeadModal = ({ isOpen, onClose, lead, users = [], onSuccess }) => {
  useLockBodyScroll(isOpen);

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({ ...lead });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateLead(lead.id, formData);
      toast.success("Lead updated successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update lead.");
    } finally {
      setLoading(false);
    }
  };

  const isStageAtLeast = (target) => {
    const stages = ["Data", "Prospect", "Lead", "Qualified Lead", "Customer"];
    return stages.indexOf(lead.stage) >= stages.indexOf(target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Edit Lead ({lead.stage} Stage)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Update details for <strong>{lead.name}</strong> ({lead.company}).
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 bg-white overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* DATA Fields */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-1">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Data & Contact Information
                </h4>
                {formData.is_rejected && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    <input
                      type="checkbox"
                      checked={!formData.is_rejected}
                      onChange={(e) => setFormData((prev) => ({ ...prev, is_rejected: !e.target.checked }))}
                      className="rounded border-rose-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Re-activate Lead (Un-reject)
                  </label>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Name *</label>
                  <Input name="name" value={formData.name || ""} onChange={handleChange} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Company *</label>
                  <Input name="company" value={formData.company || ""} onChange={handleChange} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Designation</label>
                  <Input name="designation" value={formData.designation || ""} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Email</label>
                  <Input type="email" name="email" value={formData.email || ""} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Phone</label>
                  <Input name="phone" value={formData.phone || ""} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">LinkedIn</label>
                  <Input name="linkedin" value={formData.linkedin || ""} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Website</label>
                  <Input name="website" value={formData.website || ""} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Country</label>
                  <Input name="country" value={formData.country || ""} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Industry</label>
                  <select
                    name="industry"
                    value={formData.industry || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="">-- Select Industry --</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Software">Software</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Manufacturing">Manufacturing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Source</label>
                  <select
                    name="source"
                    value={formData.source || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="">-- Select Data Source --</option>
                    <option value="Reference">Reference</option>
                    <option value="Online">Online</option>
                    <option value="Excel Import">Excel Import</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PROSPECT Fields */}
            {isStageAtLeast("Prospect") && (
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b pb-1">
                  Prospect Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Assigned To</label>
                    <select
                      name="assigned_to"
                      value={formData.assigned_to || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select User</option>
                      {(Array.isArray(users) ? users : []).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Response Status</label>
                    <select
                      name="response_status"
                      value={formData.response_status || "Not Contacted"}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Not Contacted">Not Contacted</option>
                      <option value="Contacted">Contacted</option>
                      <option value="No Response">No Response</option>
                      <option value="Responded">Responded</option>
                      <option value="Interested">Interested</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Next Follow-up</label>
                    <Input type="date" name="next_followup" value={formData.next_followup ? formData.next_followup.split("T")[0] : ""} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Prospect Notes</label>
                  <textarea
                    name="prospect_notes"
                    rows={2}
                    value={formData.prospect_notes || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            {/* LEAD Fields */}
            {isStageAtLeast("Lead") && (
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b pb-1">
                  Lead Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Interested Service</label>
                    <Input name="interested_service" value={formData.interested_service || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Lead Status</label>
                    <select
                      name="lead_status"
                      value={formData.lead_status || "Interested"}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Interested">Interested</option>
                      <option value="Meeting Scheduled">Meeting Scheduled</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Lost">Lost</option>
                      <option value="No Response">No Response</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority || "Medium"}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* QUALIFIED LEAD Fields */}
            {isStageAtLeast("Qualified Lead") && (
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b pb-1">
                  Qualified Lead Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Budget</label>
                    <Input name="budget" value={formData.budget || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Expected Value</label>
                    <Input type="number" name="expected_project_value" value={formData.expected_project_value || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Decision Maker</label>
                    <Input name="decision_maker" value={formData.decision_maker || ""} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOMER Fields */}
            {isStageAtLeast("Customer") && (
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b pb-1">
                  Customer Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Project Name</label>
                    <Input name="project_name" value={formData.project_name || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Project Value</label>
                    <Input type="number" name="project_value" value={formData.project_value || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Customer Status</label>
                    <select
                      name="customer_status"
                      value={formData.customer_status || "New Customer"}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="New Customer">New Customer</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Repeat Customer">Repeat Customer</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditLeadModal;
