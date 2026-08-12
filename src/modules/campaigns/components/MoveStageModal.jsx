import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { X, ArrowRight, Loader2, Target } from "lucide-react";
import toast from "react-hot-toast";
import { moveLeadStage } from "../../../api/campaignsApi";
import CampaignSelectorModal from "./CampaignSelectorModal";

const MoveStageModal = ({ isOpen, onClose, lead, targetStage, users = [], onSuccess }) => {
  useLockBodyScroll(isOpen);

  const [extraData, setExtraData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCampaignSelector, setShowCampaignSelector] = useState(false);
  const [selectedCampaignName, setSelectedCampaignName] = useState("");

  useEffect(() => {
    if (lead) {
      // Pre-fill existing lead fields if available
      setExtraData({
        campaign_id: lead.campaign_id || "",
        assigned_to: lead.assigned_to || "",
        contact_channel: lead.contact_channel || "Email",
        outreach_date: lead.outreach_date || new Date().toISOString().split("T")[0],
        outreach_message: lead.outreach_message || "",
        interested_service: lead.interested_service || "",
        response_channel: lead.response_channel || "Email",
        lead_date: lead.lead_date || new Date().toISOString().split("T")[0],
        lead_response: lead.lead_response || "",
        requirement: lead.requirement || "",
        pain_point: lead.pain_point || "",
        interested_in: lead.interested_in || "",
        decision_maker: lead.decision_maker || "",
        budget: lead.budget || "",
        expected_project_value: lead.expected_project_value || "",
        service: lead.service || lead.interested_service || "",
        project_name: lead.project_name || lead.company + " Project",
        project_value: lead.project_value || lead.expected_project_value || "",
        currency: lead.currency || "USD",
        closing_date: lead.closing_date || new Date().toISOString().split("T")[0],
        customer_status: lead.customer_status || "New Customer",
      });
      setSelectedCampaignName(lead.campaign_name || "");
    }
  }, [lead, targetStage]);

  if (!isOpen || !lead) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExtraData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const stageSpecificPayload = { target_stage: targetStage };

      if (targetStage === "Prospect") {
        if (extraData.campaign_id) stageSpecificPayload.campaign_id = extraData.campaign_id;
        if (extraData.assigned_to) stageSpecificPayload.assigned_to = extraData.assigned_to;
        stageSpecificPayload.contact_channel = extraData.contact_channel || "Email";
        if (extraData.outreach_date) stageSpecificPayload.outreach_date = extraData.outreach_date;
        if (extraData.outreach_message) stageSpecificPayload.outreach_message = extraData.outreach_message;
      } else if (targetStage === "Lead") {
        if (extraData.interested_service) stageSpecificPayload.interested_service = extraData.interested_service;
        stageSpecificPayload.response_channel = extraData.response_channel || "Email";
        if (extraData.lead_date) stageSpecificPayload.lead_date = extraData.lead_date;
        if (extraData.lead_response) stageSpecificPayload.lead_response = extraData.lead_response;
      } else if (targetStage === "Qualified Lead") {
        if (extraData.requirement) stageSpecificPayload.requirement = extraData.requirement;
        if (extraData.pain_point) stageSpecificPayload.pain_point = extraData.pain_point;
        if (extraData.decision_maker) stageSpecificPayload.decision_maker = extraData.decision_maker;
        if (extraData.budget) stageSpecificPayload.budget = extraData.budget;
        if (extraData.expected_project_value) stageSpecificPayload.expected_project_value = Number(extraData.expected_project_value);
      } else if (targetStage === "Customer") {
        if (extraData.project_name) stageSpecificPayload.project_name = extraData.project_name;
        if (extraData.project_value) stageSpecificPayload.project_value = Number(extraData.project_value);
        stageSpecificPayload.currency = extraData.currency || "USD";
        if (extraData.closing_date) stageSpecificPayload.closing_date = extraData.closing_date;
        stageSpecificPayload.customer_status = extraData.customer_status || "New Customer";
      }

      await moveLeadStage(lead.id, stageSpecificPayload);
      toast.success(`Lead successfully moved to ${targetStage} stage!`);
      onSuccess();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to move stage.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
        <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
                <ArrowRight className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Advance Stage: {lead.stage} → {targetStage}</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update relevant information for <strong>{lead.name}</strong> ({lead.company}).
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="p-6 bg-white overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Fields for DATA -> PROSPECT */}
              {targetStage === "Prospect" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b pb-1">
                    Outreach & Campaign Setup
                  </h4>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Campaign</label>
                    <div className="flex gap-2">
                      <Input
                        value={selectedCampaignName || "No campaign selected"}
                        readOnly
                        className="bg-slate-50 cursor-pointer"
                        onClick={() => setShowCampaignSelector(true)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCampaignSelector(true)}
                        className="gap-1 text-xs"
                      >
                        <Target className="w-3.5 h-3.5" /> Select
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Assigned Outreach Member</label>
                      <select
                        name="assigned_to"
                        value={extraData.assigned_to || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select Team Member</option>
                        {(Array.isArray(users) ? users : []).map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} {u.role_name ? `(${u.role_name})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Contact Channel</label>
                      <select
                        name="contact_channel"
                        value={extraData.contact_channel || "Email"}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Email">Email</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Phone Call">Phone Call</option>
                        <option value="Event / Conference">Event / Conference</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Outreach Date</label>
                    <Input
                      type="date"
                      name="outreach_date"
                      value={extraData.outreach_date || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Outreach Message / Purpose</label>
                    <textarea
                      name="outreach_message"
                      rows={3}
                      value={extraData.outreach_message || ""}
                      onChange={handleChange}
                      placeholder="Brief summary of what message or offer was sent..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* Fields for PROSPECT -> LEAD */}
              {targetStage === "Lead" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b pb-1">
                    Response & Interest Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Interested Service</label>
                      <Input
                        name="interested_service"
                        value={extraData.interested_service || ""}
                        onChange={handleChange}
                        placeholder="e.g. Web App Development, UI/UX"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Response Channel</label>
                      <select
                        name="response_channel"
                        value={extraData.response_channel || "Email"}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Email">Email</option>
                        <option value="LinkedIn">LinkedIn Message</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Phone Call">Phone Call</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">What They Responded</label>
                    <textarea
                      name="lead_response"
                      rows={3}
                      value={extraData.lead_response || ""}
                      onChange={handleChange}
                      placeholder="Details of their response and what they asked for..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* Fields for LEAD -> QUALIFIED LEAD */}
              {targetStage === "Qualified Lead" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b pb-1">
                    Business Opportunity & Requirements
                  </h4>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Requirement / Project Scope</label>
                    <textarea
                      name="requirement"
                      rows={2}
                      value={extraData.requirement || ""}
                      onChange={handleChange}
                      placeholder="Scope details discussed..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Pain Point / Problem</label>
                      <Input
                        name="pain_point"
                        value={extraData.pain_point || ""}
                        onChange={handleChange}
                        placeholder="Core problem to solve"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Decision Maker</label>
                      <Input
                        name="decision_maker"
                        value={extraData.decision_maker || ""}
                        onChange={handleChange}
                        placeholder="e.g. CTO, CEO"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Budget Range</label>
                      <Input
                        name="budget"
                        value={extraData.budget || ""}
                        onChange={handleChange}
                        placeholder="e.g. $10k - $25k"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Expected Value ($)</label>
                      <Input
                        type="number"
                        name="expected_project_value"
                        value={extraData.expected_project_value || ""}
                        onChange={handleChange}
                        placeholder="15000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fields for QUALIFIED LEAD -> CUSTOMER */}
              {targetStage === "Customer" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b pb-1">
                    Deal Closing & Commercial Info
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Project Name</label>
                      <Input
                        name="project_name"
                        value={extraData.project_name || ""}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Final Project Value</label>
                      <Input
                        type="number"
                        name="project_value"
                        value={extraData.project_value || ""}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Currency</label>
                      <select
                        name="currency"
                        value={extraData.currency || "USD"}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Closing Date</label>
                      <Input
                        type="date"
                        name="closing_date"
                        value={extraData.closing_date || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Customer Status</label>
                    <select
                      name="customer_status"
                      value={extraData.customer_status || "New Customer"}
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
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Move to {targetStage}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <CampaignSelectorModal
        isOpen={showCampaignSelector}
        onClose={() => setShowCampaignSelector(false)}
        onSelectCampaign={(c) => {
          setExtraData((prev) => ({ ...prev, campaign_id: c.id }));
          setSelectedCampaignName(c.name);
        }}
      />
    </>
  );
};

export default MoveStageModal;
