import React, { useEffect, useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../api/axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import Table, {
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Input from "../../../components/ui/Input";
import StatCard from "../../../components/ui/StatCard";
import {
  Edit,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Folder,
  MessageSquare,
  BarChart3,
  Target,
  Zap,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import toast from "react-hot-toast";
import { hasPermission } from "../../../utils/permissionUtils";
import Skeleton from "../../../components/ui/Skeleton";

// Modularized Components (Lazy Loaded)
const ClientDetailModal = lazy(() => import("../components/ClientDetailModal"));
const AddClientModal = lazy(() => import("../components/AddClientModal"));
const EditClientModal = lazy(() => import("../components/EditClientModal"));
const ConfirmationModal = lazy(
  () => import("../../../components/ui/ConfirmationModal"),
);

const PIPELINE_STAGES = [
  "Lead",
  "Proposal",
  "Proposal Signed",
  "Project Started",
  "Project Completed",
  "Project Maintenance",
];

const LEAD_STATUSES = ["Active", "Not Interested", "No Response", "Others"];

const MAINTENANCE_STATUSES = [
  "Active",
  "Expired",
  "Pending Renewal",
  "Not Applicable",
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
];

const FILE_BASE_URL = "http://localhost:5000";

const ClientsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Lead");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadSource, setLeadSource] = useState("");
  const [refType, setRefType] = useState("client");
  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stageCounts, setStageCounts] = useState({});

  // Document state
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadClassification, setUploadClassification] = useState("internal");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = (user?.role_name || "").toLowerCase();
  const isAdmin =
    role === "admin" || role === "super admin" || role === "administrator";
  const canManageConfidential =
    isAdmin || user?.modules?.clients?.["documents.confidential"];

  // Interaction logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [allClients, setAllClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");

  const [projects, setProjects] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("Overview");

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
    variant: "primary",
  });

  useEffect(() => {
    if (!hasPermission("clients", "view")) {
      toast.error(
        "Access Denied: You do not have permissions to access the Clients module.",
      );

      navigate("/dashboard");

      return;
    }

    Promise.all([fetchDashboardStats(), fetchProjects(), fetchAllClients()]);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [activeTab]);

  useEffect(() => {
    if (showDetailModal && selectedClient?.id) {
      fetchLogs(selectedClient.id);
      fetchDocuments(selectedClient.id);
    }
  }, [showDetailModal, selectedClient?.id]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/clients?stage=${activeTab}`);
      setItems(
        Array.isArray(res.data.data)
          ? res.data.data
          : res.data.clients || res.data || [],
      );
    } catch (err) {
      console.error("Client fetch error", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllClients = async () => {
    try {
      const res = await axios.get("/clients");
      const data = Array.isArray(res.data.data)
        ? res.data.data
        : res.data.clients || res.data || [];
      setAllClients(data);
    } catch (err) {
      console.error("Fetch all clients error", err);
    }
  };

  const fetchDashboardStats = async () => {
    setStatsLoading(true);

    try {
      const res = await axios.get("/clients/crm-stats");

      const data = res.data.data;

      setStageCounts(data.stageCounts || {});

      setStats([
        {
          title: "Pipeline Value",
          value: `₹${(data.pipelineValueINR / 100000).toFixed(1)}L`,
          icon: BarChart3,
        },
        {
          title: "Avg Lead Score",
          value: `${data.avgLeadScore}/100`,
          icon: Target,
        },
        {
          title: "Hot Leads",
          value: data.hotLeads,
          icon: Zap,
        },
        {
          title: "Conversion",
          value: `${data.conversionRate}%`,
          icon: TrendingUp,
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/projects");
      setProjects(res.data.data || []);
    } catch (err) {
      console.error("Fetch projects error", err);
    }
  };

  const fetchLogs = async (clientId) => {
    if (!clientId) return;
    setLogsLoading(true);
    setLogs([]); // Reset to prevent stale data
    try {
      const res = await axios.get(`/clients/${clientId}/interactions`);
      // successResponse wraps data in a 'data' property
      setLogs(res.data?.data || []);
    } catch (err) {
      console.error("Fetch logs error", err);
      toast.error("Failed to fetch interaction history");
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchDocuments = async (clientId) => {
    if (!clientId) return;
    setDocLoading(true);
    setDocuments([]); // Reset to prevent stale data
    try {
      const res = await axios.get(`/clients/${clientId}/documents`);
      setDocuments(res.data?.data || []);
    } catch (err) {
      console.error("Fetch docs error", err);
      toast.error("Failed to fetch documents");
      setDocuments([]);
    } finally {
      setDocLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if any file is too large
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 10 * 1024 * 1024) {
        toast.error(`File "${files[i].name}" is too large. Max 10MB allowed.`);
        return;
      }
    }

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    formData.append("folder", "clients");
    formData.append("classification", uploadClassification);

    try {
      await axios.post(`/clients/${selectedClient.id}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`${files.length} document(s) uploaded successfully`);
      fetchDocuments(selectedClient.id);
    } catch (err) {
      // Handled by global interceptor
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteDocument = async (docId) => {
    setConfirmModal({
      show: true,
      title: "Delete Document",
      message:
        "Are you sure you want to permanently delete this document? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await axios.delete(`/clients/documents/${docId}`);
          toast.success("Document deleted");
          fetchDocuments(selectedClient.id);
        } catch (err) {
          toast.error("Failed to delete document");
        } finally {
          setConfirmModal((prev) => ({ ...prev, show: false }));
        }
      },
    });
  };

  const logInteraction = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      type: formData.get("type"),
      notes: formData.get("notes"),
    };

    try {
      await axios.post(`/clients/${selectedClient.id}/interactions`, payload);
      toast.success("Interaction logged successfully");
      fetchLogs(selectedClient.id);
      e.target.notes.value = "";
    } catch (err) {
      toast.error("Failed to log interaction");
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    const companyNameValue = payload.company_name?.trim();
    if (!companyNameValue) {
      toast.error("Company name cannot be empty or contain only spaces.");
      return;
    }

    if (/^\d+$/.test(companyNameValue)) {
      toast.error("Company name cannot consist of numbers only.");
      return;
    }

    if (!/^[a-zA-Z0-9\s]+$/.test(companyNameValue)) {
      toast.error("Company name can only contain letters, numbers, and spaces.");
      return;
    }

    const websiteValue = payload.website?.trim();
    if (websiteValue) {
      const websiteRegex =
        /^(https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      if (!websiteRegex.test(websiteValue)) {
        toast.error(
          "Please enter a valid website URL (e.g. https://invertio.in or http://example.com).",
        );
        return;
      }
    }

    const contactPersonValue = payload.contact_person?.trim();
    if (!contactPersonValue) {
      toast.error("Contact person name cannot be empty.");
      return;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(contactPersonValue)) {
      toast.error("Contact person name can only contain letters, numbers, and spaces.");
      return;
    }

    const emailValue = payload.email?.trim();
    if (emailValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        toast.error("Please enter a valid email address (e.g. jane@acme.com).");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await axios.post("/clients", {
        ...payload,
        industry:
          payload.industry === "Other" || !payload.industry
            ? payload.industry_other
            : payload.industry,
        lifecycle_stage: activeTab,
        type: activeTab === "Lead" ? "Lead" : "Client",
        lead_score: payload.lead_score ? parseInt(payload.lead_score) : 0,
        expected_value: payload.expected_value
          ? parseFloat(payload.expected_value)
          : null,
      });
      toast.success(`${activeTab} added successfully`);
      setShowAddModal(false);
      await Promise.all([
        fetchClients(),
        fetchDashboardStats(),
        fetchAllClients(),
      ]);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        return;
      }
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (!err.response || err.response.status < 500) {
        toast.error("Failed to add client");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClient = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    const companyNameValue = payload.company_name?.trim();
    if (!companyNameValue) {
      toast.error("Company name cannot be empty or contain only spaces.");
      return;
    }

    if (/^\d+$/.test(companyNameValue)) {
      toast.error("Company name cannot consist of numbers only.");
      return;
    }

    if (!/^[a-zA-Z0-9\s]+$/.test(companyNameValue)) {
      toast.error("Company name can only contain letters, numbers, and spaces.");
      return;
    }

    const websiteValue = payload.website?.trim();
    if (websiteValue) {
      const websiteRegex =
        /^(https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      if (!websiteRegex.test(websiteValue)) {
        toast.error(
          "Please enter a valid website URL (e.g. https://invertio.in or http://example.com).",
        );
        return;
      }
    }

    const contactPersonValue = payload.contact_person?.trim();
    if (!contactPersonValue) {
      toast.error("Contact person name cannot be empty.");
      return;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(contactPersonValue)) {
      toast.error("Contact person name can only contain letters, numbers, and spaces.");
      return;
    }

    const emailValue = payload.email?.trim();
    if (emailValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        toast.error("Please enter a valid email address (e.g. jane@acme.com).");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await axios.put(`/clients/${editingClient.id}`, {
        ...payload,
        industry:
          payload.industry === "Other" || !payload.industry
            ? payload.industry_other
            : payload.industry,
        lead_score: payload.lead_score ? parseInt(payload.lead_score) : 0,
        expected_value: payload.expected_value
          ? parseFloat(payload.expected_value)
          : null,
      });
      toast.success("Client updated successfully");
      setShowEditModal(false);
      await Promise.all([
        fetchClients(),
        fetchDashboardStats(),
        fetchAllClients(),
      ]);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        return;
      }
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (!err.response || err.response.status < 500) {
        toast.error("Failed to update client");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStage = async (clientId, currentStage) => {
    const client = items.find((i) => i.id === clientId);
    if (client && client.lead_status === "Not Interested") {
      toast.error(
        "Cannot advance lifecycle stage for a client marked as Not Interested",
      );
      return;
    }
    const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
    if (currentIndex < PIPELINE_STAGES.length - 1) {
      const nextStage = PIPELINE_STAGES[currentIndex + 1];

      if (nextStage === "Project Started") {
        const client = items.find((i) => i.id === clientId);

        if (client && client.project_id) {
          try {
            await axios.patch(`/clients/${clientId}/stage`, {
              stage: nextStage,
            });
            toast.success(`Client moved to ${nextStage}`);
            await Promise.all([
              fetchClients(),
              fetchDashboardStats(),
              fetchAllClients(),
            ]);
          } catch (err) {
            toast.error(
              err.response?.data?.message || "Failed to update stage",
            );
          }
          return;
        }

        setConfirmModal({
          show: true,
          title: "Initialize Project",
          message: `Moving to 'Project Started'. Would you like to initialize the project "${client.potential_project_name || "New Project"}" now?`,
          confirmText: "Initialize Project",
          variant: "primary",
          onConfirm: async () => {
            try {
              await axios.post("/projects", {
                name:
                  client.potential_project_name ||
                  `${client.company_name} Project`,
                client_id: client.id,
                budget: client.expected_value || 0,
                currency: client.currency || "USD",
                status: "Planned",
                start_date: new Date().toISOString().split("T")[0],
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0],
              });
              toast.success("Project initialized in Projects module");
              await axios.patch(`/clients/${clientId}/stage`, {
                stage: nextStage,
              });
              toast.success(`Client moved to ${nextStage}`);
              await Promise.all([
                fetchClients(),
                fetchDashboardStats(),
                fetchAllClients(),
              ]);
            } catch (err) {
              console.error("Project creation failed", err);
              toast.error("Failed to initialize project record");
            } finally {
              setConfirmModal((prev) => ({ ...prev, show: false }));
            }
          },
        });
        return;
      }

      try {
        await axios.patch(`/clients/${clientId}/stage`, { stage: nextStage });
        toast.success(`Client moved to ${nextStage}`);
        await Promise.all([
          fetchClients(),
          fetchDashboardStats(),
          fetchAllClients(),
        ]);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to update stage");
      }
    }
  };

  const handlePreviousStage = async (clientId, currentStage) => {
    const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
    if (currentIndex > 0) {
      const prevStage = PIPELINE_STAGES[currentIndex - 1];
      try {
        await axios.patch(`/clients/${clientId}/stage`, { stage: prevStage });
        toast.success(`Client moved back to ${prevStage}`);
        await Promise.all([
          fetchClients(),
          fetchDashboardStats(),
          fetchAllClients(),
        ]);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to update stage");
      }
    }
  };

  const handleUpdateStatus = async (clientId, newStatus) => {
    try {
      await axios.patch(`/clients/${clientId}/status`, { status: newStatus });
      toast.success("Status updated");
      await Promise.all([
        fetchClients(),
        fetchDashboardStats(),
        fetchAllClients(),
      ]);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case "Lead":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Proposal":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Proposal Signed":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Project Started":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Project Completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Project Maintenance":
        return "bg-violet-100 text-violet-700 border-violet-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-sky-100 text-sky-700 border-sky-200";
      case "Not Interested":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "No Response":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Others":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getInitials = (name) => {
    if (!name) return "C";
    const initials = name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
    return initials || "C";
  };

  const getAvatarColor = (id) => {
    const colors = [
      "bg-indigo-500",
      "bg-emerald-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-sky-500",
      "bg-violet-500",
      "bg-teal-500",
      "bg-fuchsia-500",
    ];
    const index = id ? (typeof id === "number" ? id : id.toString().length) : 0;
    return colors[index % colors.length];
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      leadStatusFilter === "All" || item.lead_status === leadStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const statsList = stats;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clients & CRM
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your customer pipeline and track interactions.
          </p>
        </div>
        {hasPermission("clients", "create") && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? [...Array(4)].map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex justify-between">
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-4 w-24" />

                    <Skeleton className="h-8 w-28" />

                    <Skeleton className="h-3 w-20" />
                  </div>

                  <Skeleton className="w-12 h-12 rounded-xl" />
                </div>
              </Card>
            ))
          : statsList.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {PIPELINE_STAGES.map((tab) => {
          const count = stageCounts[tab] || 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                activeTab === tab
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
              )}
            >
              {tab}
              <Badge
                variant={activeTab === tab ? "primary" : "secondary"}
                className="px-1.5 py-0 h-5 min-w-5 flex items-center justify-center text-[10px]"
              >
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              {activeTab}s
              <Badge variant="secondary" className="font-medium">
                {filteredItems.length} of {items.length}
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Viewing all prospects in the {activeTab.toLowerCase()} stage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-10 w-full sm:w-64 h-10 text-sm"
                placeholder={`Search ${activeTab.toLowerCase()}s...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={leadStatusFilter}
              onChange={(e) => setLeadStatusFilter(e.target.value)}
              className="h-10 text-sm border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100/80 px-3 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer transition-colors shadow-sm font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-8 w-32 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No matches found
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-4 font-bold text-slate-700">
                    Company
                  </TableHead>
                  <TableHead className="py-4 font-bold text-slate-700">
                    Contact
                  </TableHead>
                  <TableHead className="py-4 font-bold text-slate-700">
                    Pipeline Stage
                  </TableHead>
                  <TableHead className="py-4 font-bold text-slate-700">
                    Disposition
                  </TableHead>
                  <TableHead className="py-4 font-bold text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "group",
                      item.lead_status &&
                        item.lead_status !== "Active" &&
                        "opacity-60",
                    )}
                  >
                    <TableCell className="py-5">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm",
                            getAvatarColor(item.id),
                          )}
                        >
                          {getInitials(item.company_name)}
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              setSelectedClient(item);
                              setShowDetailModal(true);
                            }}
                            className="font-bold text-slate-900 hover:text-primary-600 transition-colors text-left block"
                          >
                            {item.company_name}
                          </button>
                          <div className="flex items-center gap-1.5 mt-0.5 font-bold uppercase tracking-wider text-[10px]">
                            <span className="text-slate-400">
                              Score: {item.lead_score || 0}
                            </span>
                            {item.country && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500">
                                  {item.country}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-sm">
                      <div className="font-semibold text-slate-700">
                        {item.contact_person}
                      </div>
                      <div className="text-xs text-slate-400">{item.email}</div>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          getStageColor(item.lifecycle_stage),
                        )}
                      >
                        {item.lifecycle_stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                      <select
                        value={item.lead_status || "Active"}
                        onChange={(e) =>
                          handleUpdateStatus(item.id, e.target.value)
                        }
                        className={cn(
                          "text-[10px] font-bold uppercase py-1 px-2 rounded border focus:ring-1 focus:ring-primary-500",
                          getStatusColor(item.lead_status || "Active"),
                        )}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex justify-start items-center gap-2">
                        {hasPermission("clients", "stage.edit") && (
                          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              disabled={
                                PIPELINE_STAGES.indexOf(
                                  item.lifecycle_stage,
                                ) === 0 || item.lead_status === "Not Interested"
                              }
                              onClick={() =>
                                handlePreviousStage(
                                  item.id,
                                  item.lifecycle_stage,
                                )
                              }
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[10px] font-bold uppercase"
                              disabled={
                                PIPELINE_STAGES.indexOf(
                                  item.lifecycle_stage,
                                ) ===
                                  PIPELINE_STAGES.length - 1 ||
                                item.lead_status === "Not Interested"
                              }
                              onClick={() =>
                                handleNextStage(item.id, item.lifecycle_stage)
                              }
                            >
                              Advance
                              <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedClient(item);
                            setShowDetailModal(true);
                            setActiveDetailTab("Files");
                          }}
                        >
                          <Folder className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={item.lead_status === "Not Interested"}
                          onClick={() => {
                            setEditingClient(item);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedClient(item);
                            setShowDetailModal(true);
                            setActiveDetailTab("Activity");
                          }}
                        >
                          <MessageSquare className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <ClientDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          selectedClient={selectedClient}
          activeDetailTab={activeDetailTab}
          setActiveDetailTab={setActiveDetailTab}
          getAvatarColor={getAvatarColor}
          getStageColor={getStageColor}
          handleDeleteDocument={handleDeleteDocument}
          logInteraction={logInteraction}
          logs={logs}
          logsLoading={logsLoading}
          documents={documents}
          docLoading={docLoading}
          handleUpload={handleUpload}
          isUploading={isUploading}
          uploadClassification={uploadClassification}
          setUploadClassification={setUploadClassification}
          canManageConfidential={canManageConfidential}
          setShowDetailModal={setShowDetailModal}
          setEditingClient={setEditingClient}
          setShowEditModal={setShowEditModal}
          PIPELINE_STAGES={PIPELINE_STAGES}
          CURRENCIES={CURRENCIES}
        />

        <AddClientModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          activeTab={activeTab}
          handleAddClient={handleAddClient}
          projects={projects}
          MAINTENANCE_STATUSES={MAINTENANCE_STATUSES}
          CURRENCIES={CURRENCIES}
          leadSource={leadSource}
          setLeadSource={setLeadSource}
          refType={refType}
          setRefType={setRefType}
          allClients={allClients}
          isSubmitting={isSubmitting}
        />

        <EditClientModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          editingClient={editingClient}
          handleEditClient={handleEditClient}
          CURRENCIES={CURRENCIES}
          leadSource={leadSource}
          setLeadSource={setLeadSource}
          refType={refType}
          setRefType={setRefType}
          allClients={allClients}
          isSubmitting={isSubmitting}
        />

        <ConfirmationModal
          isOpen={confirmModal.show}
          onClose={() => setConfirmModal({ ...confirmModal, show: false })}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
        />
      </Suspense>
    </div>
  );
};

export default ClientsPage;
