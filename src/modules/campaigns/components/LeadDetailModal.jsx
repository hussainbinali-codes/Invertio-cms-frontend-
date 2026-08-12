import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import {
  X,
  User,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  MessageSquare,
  FileText,
  Upload,
  Trash2,
  Loader2,
  Plus,
  Target,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { getActivities, getDocuments, uploadDocuments, deleteDocument } from "../../../api/campaignsApi";
import AddActivityModal from "./AddActivityModal";

const LeadDetailModal = ({ isOpen, onClose, lead, onRefresh }) => {
  useLockBodyScroll(isOpen);

  const [activeTab, setActiveTab] = useState("Overview"); // Overview, Activity Log, Documents
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);

  useEffect(() => {
    if (isOpen && lead) {
      fetchActivities();
      fetchDocuments();
    }
  }, [isOpen, lead]);

  const fetchActivities = async () => {
    if (!lead) return;
    try {
      setActivitiesLoading(true);
      const res = await getActivities(lead.id);
      setActivities(res.data?.data || []);
    } catch (error) {
      console.error("Failed to load activities", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!lead) return;
    try {
      setDocumentsLoading(true);
      const res = await getDocuments(lead.id);
      setDocuments(res.data?.data || []);
    } catch (error) {
      console.error("Failed to load documents", error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      setUploading(true);
      await uploadDocuments(lead.id, formData);
      toast.success("Document(s) uploaded successfully!");
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(docId);
      toast.success("Document deleted.");
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to delete document.");
    }
  };

  if (!isOpen || !lead) return null;

  const isStageAtLeast = (target) => {
    const stages = ["Data", "Prospect", "Lead", "Qualified Lead", "Customer"];
    return stages.indexOf(lead.stage) >= stages.indexOf(target);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
        <Card className="w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold flex items-center justify-center text-xl shadow-md">
                {lead.name ? lead.name.charAt(0).toUpperCase() : "L"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{lead.name}</CardTitle>
                  <Badge variant="outline" className="text-xs bg-primary-50 text-primary-700 border-primary-200">
                    {lead.stage} Stage
                  </Badge>
                  {lead.is_duplicate && <Badge variant="warning">Duplicate</Badge>}
                  {lead.is_rejected && <Badge variant="danger">Rejected</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lead.company} {lead.designation ? `• ${lead.designation}` : ""} {lead.country ? `• ${lead.country}` : ""}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          {/* Sub-Nav Tabs */}
          <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
            {["Overview", "Activity Log", "Documents"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === tab
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <CardContent className="p-6 bg-white overflow-y-auto flex-1 space-y-6">
            {activeTab === "Overview" && (
              <div className="space-y-6">
                {/* DATA Section */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Data Stage Profile</span>
                    <span className="text-xs text-slate-400">Source: {lead.source || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Email</span>
                      <span className="font-semibold text-slate-800">{lead.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Phone</span>
                      <span className="font-semibold text-slate-800">{lead.phone || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Industry</span>
                      <span className="font-semibold text-slate-800">{lead.industry || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Website</span>
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                          {lead.website}
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-800">N/A</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">LinkedIn</span>
                      {lead.linkedin ? (
                        <a href={lead.linkedin} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                          Profile Link
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-800">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* PROSPECT Section */}
                {isStageAtLeast("Prospect") && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Prospect Stage Info</span>
                      <Badge variant="outline">{lead.response_status || "Not Contacted"}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Campaign</span>
                        <span className="font-semibold text-slate-800">{lead.campaign_name || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Assigned To</span>
                        <span className="font-semibold text-slate-800">{lead.assigned_to_name || "Unassigned"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Contact Channel</span>
                        <span className="font-semibold text-slate-800">{lead.contact_channel || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Next Follow-up</span>
                        <span className="font-semibold text-slate-800">{lead.next_followup ? lead.next_followup.split("T")[0] : "N/A"}</span>
                      </div>
                    </div>
                    {lead.outreach_message && (
                      <div className="text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-400 block mb-0.5">Outreach Purpose / Message:</span>
                        <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60">{lead.outreach_message}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* LEAD Section */}
                {isStageAtLeast("Lead") && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">3. Lead Stage Details</span>
                      <Badge variant={lead.lead_status === "Lost" ? "danger" : "success"}>{lead.lead_status || "Interested"}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Interested Service</span>
                        <span className="font-semibold text-slate-800">{lead.interested_service || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Priority</span>
                        <span className="font-semibold text-slate-800">{lead.priority || "Medium"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Response Channel</span>
                        <span className="font-semibold text-slate-800">{lead.response_channel || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Lead Follow-up</span>
                        <span className="font-semibold text-slate-800">{lead.lead_followup ? lead.lead_followup.split("T")[0] : "N/A"}</span>
                      </div>
                    </div>
                    {lead.lead_response && (
                      <div className="text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-400 block mb-0.5">Lead Response Summary:</span>
                        <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60">{lead.lead_response}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* QUALIFIED LEAD Section */}
                {isStageAtLeast("Qualified Lead") && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">4. Qualified Lead Details</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Budget</span>
                        <span className="font-semibold text-slate-800">{lead.budget || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Expected Value</span>
                        <span className="font-semibold text-slate-800">{lead.expected_project_value ? `$${lead.expected_project_value}` : "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Decision Maker</span>
                        <span className="font-semibold text-slate-800">{lead.decision_maker || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Project Type</span>
                        <span className="font-semibold text-slate-800">{lead.project_type || "N/A"}</span>
                      </div>
                    </div>
                    {lead.requirement && (
                      <div className="text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-400 block mb-0.5">Project Scope / Requirements:</span>
                        <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60">{lead.requirement}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* CUSTOMER Section */}
                {isStageAtLeast("Customer") && (
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60 space-y-3">
                    <div className="flex justify-between items-center border-b border-emerald-200/80 pb-2">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> 5. Won Business Customer Info
                      </span>
                      <Badge variant="success">{lead.customer_status || "Active"}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Project Name</span>
                        <span className="font-semibold text-slate-900">{lead.project_name || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Deal Value</span>
                        <span className="font-semibold text-emerald-700 font-mono text-sm">
                          {lead.currency} {lead.project_value || "0.00"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Closing Date</span>
                        <span className="font-semibold text-slate-900">{lead.closing_date ? lead.closing_date.split("T")[0] : "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Payment Status</span>
                        <span className="font-semibold text-slate-900">{lead.payment_status || "Pending"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Activity Log" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Activity History</h4>
                  <Button size="sm" onClick={() => setShowAddActivityModal(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Log Activity
                  </Button>
                </div>

                {activitiesLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-xs border border-dashed rounded-xl">
                    No activities logged yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {activities.map((act) => (
                      <div key={act.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {act.activity_type}
                          </span>
                          <span className="text-slate-400">{new Date(act.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1">{act.notes}</p>
                        <div className="text-[10px] text-slate-400 pt-1">Logged by: {act.user_name || "System"} • Stage: {act.stage}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Documents" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Attached Documents</h4>
                  <label className="cursor-pointer">
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" disabled={uploading} />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all">
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Upload File
                    </span>
                  </label>
                </div>

                {documentsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-xs border border-dashed rounded-xl">
                    No documents uploaded for this lead yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary-600" />
                          <div>
                            <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-800 hover:underline">
                              {doc.file_name}
                            </a>
                            <p className="text-[10px] text-slate-400">
                              {(doc.file_size / 1024).toFixed(1)} KB • Uploaded by {doc.uploaded_by_name || "User"} on {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddActivityModal
        isOpen={showAddActivityModal}
        onClose={() => setShowAddActivityModal(false)}
        lead={lead}
        onSuccess={() => {
          fetchActivities();
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};

export default LeadDetailModal;
