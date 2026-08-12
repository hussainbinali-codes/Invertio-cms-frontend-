import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { X, Sparkles, Loader2, Building2, User, Mail, Phone, Globe, MapPin, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import { createLead } from "../../../api/campaignsApi";

const AddLeadModal = ({ isOpen, onClose, onSuccess }) => {
  useLockBodyScroll(isOpen);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    designation: "",
    email: "",
    phone: "",
    linkedin: "",
    website: "",
    country: "",
    industry: "",
    source: "",
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      company: "",
      designation: "",
      email: "",
      phone: "",
      linkedin: "",
      website: "",
      country: "",
      industry: "",
      source: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) {
      toast.error("Name and Company are required.");
      return;
    }

    try {
      setLoading(true);
      await createLead(formData);
      toast.success("Lead added to Data stage successfully!");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to add lead.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Add Data Entry</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Create a new raw lead record in the Data stage.</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 bg-white overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                <User className="w-4 h-4 text-primary-600" />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Person</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Designation</label>
                  <Input
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g. Marketing Director"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Email Address</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. john@acme.com"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                <Phone className="w-4 h-4 text-primary-600" />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Details</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Phone Number</label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">LinkedIn URL</label>
                  <Input
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                <Briefcase className="w-4 h-4 text-primary-600" />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Business Context</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Website</label>
                  <Input
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://acme.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Country</label>
                  <Input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g. United States"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Industry</label>
                  <select
                    name="industry"
                    value={formData.industry}
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
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Data Source</label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="">-- Select Data Source --</option>
                    <option value="Reference">Reference</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Data Entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddLeadModal;
