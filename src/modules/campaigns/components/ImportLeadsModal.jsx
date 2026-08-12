import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import Button from "../../../components/ui/Button";
import { X, Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { downloadImportTemplate, importLeads } from "../../../api/campaignsApi";

const ImportLeadsModal = ({ isOpen, onClose, onSuccess, campaigns = [] }) => {
  useLockBodyScroll(isOpen);

  const [file, setFile] = useState(null);
  const [defaultCampaignId, setDefaultCampaignId] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const res = await downloadImportTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Campaign_Lead_Import_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Import template downloaded!");
    } catch (error) {
      toast.error("Failed to download import template.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select an Excel or CSV file to import.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (defaultCampaignId) {
      formData.append("default_campaign_id", defaultCampaignId);
    }

    try {
      setLoading(true);
      const res = await importLeads(formData);
      toast.success("Bulk import completed!");
      setResultSummary(res.data?.data || null);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDefaultCampaignId("");
    setResultSummary(null);
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setResultSummary(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Bulk Import Marketing Data</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Upload .xlsx or .csv spreadsheet to bulk import leads.</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="p-6 bg-white space-y-6 overflow-y-auto flex-1">
          {!resultSummary ? (
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {/* Template Download Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Need the correct column format?</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Download sample template with pre-formatted headers.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="gap-1.5 text-xs border-slate-200 text-slate-700"
                >
                  {downloadingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-emerald-600" />}
                  Download Template
                </Button>
              </div>

              {/* Default Campaign Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Default Campaign (Optional)
                </label>
                <select
                  value={defaultCampaignId}
                  onChange={(e) => setDefaultCampaignId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">No Campaign (Import into Data Stage)</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type || "General"}) — Import to Prospect Stage
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Note: If your Excel sheet contains a <strong>Campaign Name</strong> column, matching records will automatically move to the <strong>Prospect</strong> stage under that campaign.
                </p>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-all bg-slate-50/50 hover:bg-emerald-50/20">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <label className="cursor-pointer block">
                  <span className="text-sm font-bold text-slate-800 hover:underline">
                    {file ? file.name : "Click to select file"}
                  </span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, or .csv up to 10MB</p>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!file || loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Start Import
                </Button>
              </div>
            </form>
          ) : (
            /* Result Summary View */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Import Processing Complete</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Processed {resultSummary.totalRows} row(s) from uploaded sheet.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border rounded-xl text-center">
                  <span className="text-2xl font-bold text-emerald-600 font-mono">{resultSummary.successCount}</span>
                  <span className="text-xs text-slate-500 block font-medium">Leads Created</span>
                </div>
                <div className="p-3 bg-slate-50 border rounded-xl text-center">
                  <span className="text-2xl font-bold text-amber-600 font-mono">{resultSummary.duplicateCount}</span>
                  <span className="text-xs text-slate-500 block font-medium">Duplicates Flagged</span>
                </div>
              </div>

              {resultSummary.errors && resultSummary.errors.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Row Warnings / Skipped Rows:
                  </span>
                  <div className="max-h-40 overflow-y-auto p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-800 font-mono">
                    {resultSummary.errors.map((err, idx) => (
                      <div key={idx}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Import Another File
                </Button>
                <Button type="button" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportLeadsModal;
