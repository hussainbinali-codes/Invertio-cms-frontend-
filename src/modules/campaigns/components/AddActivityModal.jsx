import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { X, MessageSquare, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { addActivity } from "../../../api/campaignsApi";

const AddActivityModal = ({ isOpen, onClose, lead, onSuccess }) => {
  useLockBodyScroll(isOpen);

  const [formData, setFormData] = useState({
    activity_type: "Call",
    notes: "",
    scheduled_at: "",
  });
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setFormData({ activity_type: "Call", notes: "", scheduled_at: "" });
    onClose();
  };

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.notes.trim()) {
      toast.error("Activity notes are required.");
      return;
    }

    try {
      setLoading(true);
      await addActivity(lead.id, formData);
      toast.success("Activity logged successfully!");
      handleClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to log activity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Log Activity / Interaction</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Record communication for <strong>{lead.name}</strong> ({lead.company}).
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
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Activity Type *</label>
              <select
                value={formData.activity_type}
                onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Call">Phone Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Proposal">Proposal Submitted</option>
                <option value="Discussion">Discussion</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Scheduled Date / Time (Optional)</label>
              <Input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Details / Notes *</label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Log details of the conversation, outcome, or next steps..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Activity
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddActivityModal;
