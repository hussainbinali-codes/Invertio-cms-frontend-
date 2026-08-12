import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import Button from "../../../components/ui/Button";
import { X, Target, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { bulkMoveCampaign } from "../../../api/campaignsApi";

const BulkMoveCampaignModal = ({ isOpen, onClose, selectedLeadIds = [], campaigns = [], onSuccess }) => {
  useLockBodyScroll(isOpen);

  const [targetCampaignId, setTargetCampaignId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setTargetCampaignId("");
    onClose();
  };

  if (!isOpen || selectedLeadIds.length === 0) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetCampaignId) {
      toast.error("Please select a target campaign.");
      return;
    }

    try {
      setLoading(true);
      await bulkMoveCampaign({
        lead_ids: selectedLeadIds,
        target_campaign_id: targetCampaignId,
      });
      toast.success(`${selectedLeadIds.length} lead(s) successfully transferred to campaign!`);
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to transfer leads.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Bulk Campaign Transfer</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Reassign <strong>{selectedLeadIds.length} selected lead(s)</strong> to a target campaign.
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="p-6 bg-white space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Select Target Campaign</label>
              <select
                value={targetCampaignId}
                onChange={(e) => setTargetCampaignId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                required
              >
                <option value="">-- Choose Target Campaign --</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type || "General"})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Transfer & Stage Preservation Note:</span>
              <p>Leads in the <strong>Data</strong> stage will advance to <strong>Prospect</strong> under the target campaign. Leads already in <strong>Prospect, Lead, Qualified Lead, or Customer</strong> stages will preserve their current progress under the new campaign.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!targetCampaignId || loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Transfer Leads
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkMoveCampaignModal;
