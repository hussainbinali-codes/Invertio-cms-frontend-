import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { X, Plus, Target, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getCampaignsList, createCampaign } from "../../../api/campaignsApi";

const CAMPAIGN_TYPES = [
  "Cold Outreach",
  "LinkedIn",
  "Other",
  "Event",
  "Email Campaign"
];

const CampaignSelectorModal = ({ isOpen, onClose, onSelectCampaign, createOnly = false }) => {
  useLockBodyScroll(isOpen);

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(createOnly);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "Cold Outreach",
    description: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (createOnly) {
        setIsCreating(true);
      } else {
        setIsCreating(false);
        fetchCampaigns();
      }
      setNewCampaign({
        name: "",
        type: "Cold Outreach",
        description: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
      });
    }
  }, [isOpen, createOnly]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await getCampaignsList();
      setCampaigns(res.data?.data || []);
    } catch (error) {
      toast.error("Failed to load campaigns list.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newCampaign.name.trim()) {
      toast.error("Campaign name is required.");
      return;
    }
    try {
      setLoading(true);
      const res = await createCampaign(newCampaign);
      toast.success("Campaign created successfully!");
      const created = res.data?.data;
      setIsCreating(false);
      setNewCampaign({ name: "", type: "Cold Outreach", description: "", start_date: "", end_date: "" });
      if (!createOnly) fetchCampaigns();
      if (created) {
        onSelectCampaign(created);
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create campaign.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className={`w-full ${createOnly ? "max-w-lg" : "max-w-xl"} shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col`}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {createOnly || isCreating ? "Create New Campaign" : "Select or Create Campaign"}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {createOnly || isCreating ? "Set up a new outreach campaign." : "Link lead to an outreach campaign."}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 bg-white space-y-4">
          {!isCreating ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Available Campaigns</span>
                <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Create New Campaign
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-sm border border-dashed rounded-xl">
                  No campaigns created yet. Click above to create one.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {campaigns.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectCampaign(c);
                        onClose();
                      }}
                      className="p-3 border border-slate-200 rounded-xl hover:border-primary-400 hover:bg-primary-50/30 cursor-pointer transition-all flex justify-between items-center"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{c.name}</h4>
                        <p className="text-xs text-slate-500">{c.type || "General"} • Status: {c.status}</p>
                      </div>
                      <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                        Select
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Campaign Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="e.g. Q3 Tech Summit Outreach"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Type</label>
                  <select
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm h-[42px]"
                  >
                    {CAMPAIGN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                {createOnly ? (
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                    Back
                  </Button>
                )}
                <Button type="submit" size="sm" disabled={loading}>
                  Save Campaign
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignSelectorModal;
