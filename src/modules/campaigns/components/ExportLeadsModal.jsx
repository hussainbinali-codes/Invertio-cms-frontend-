import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import Button from "../../../components/ui/Button";
import { X, FileSpreadsheet, Download, Loader2, Target } from "lucide-react";
import toast from "react-hot-toast";
import { exportLeads } from "../../../api/campaignsApi";

const ExportLeadsModal = ({ isOpen, onClose, campaigns = [], selectedCampaignId = "" }) => {
  useLockBodyScroll(isOpen);

  const [campaignId, setCampaignId] = useState(selectedCampaignId || "");
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setCampaignId(selectedCampaignId || "");
    setStage("");
    onClose();
  };

  if (!isOpen) return null;

  const handleExportSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const params = {};
      if (campaignId) params.campaign_id = campaignId;
      if (stage) params.stage = stage;

      const res = await exportLeads(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Campaign_Leads_Report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel report exported successfully!");
      handleClose();
    } catch (error) {
      toast.error("Failed to export Excel report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Export Campaign Leads (Option A Report)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate structured single-sheet Excel report with full pipeline metrics.
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="p-6 bg-white space-y-4">
          <form onSubmit={handleExportSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Filter by Campaign</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Campaigns (Combined)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type || "General"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Filter by Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Pipeline Stages</option>
                <option value="Data">Data Stage</option>
                <option value="Prospect">Prospect Stage</option>
                <option value="Lead">Lead Stage</option>
                <option value="Qualified Lead">Qualified Lead Stage</option>
                <option value="Customer">Customer (Won Deals) Stage</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Excel Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportLeadsModal;
