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
import {
  Edit,
  Eye,
  Plus,
  Search,
  MessageSquare,
  BarChart3,
  Target,
  Zap,
  TrendingUp,
  Loader2,
  ArrowRight,
  RotateCcw,
  Ban,
  Copy,
  ThumbsDown,
  XCircle,
  Users as UsersIcon,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import toast from "react-hot-toast";
import { hasPermission } from "../../../utils/permissionUtils";
import Skeleton from "../../../components/ui/Skeleton";
import {
  getLeads,
  getCampaignStats,
  getCampaignsList,
  rejectLead,
  markDuplicate,
  markNotInterested,
  markLost,
} from "../../../api/campaignsApi";

// Modularized Components
import AddLeadModal from "../components/AddLeadModal";
import LeadDetailModal from "../components/LeadDetailModal";
import EditLeadModal from "../components/EditLeadModal";
import MoveStageModal from "../components/MoveStageModal";
import AddActivityModal from "../components/AddActivityModal";
import CampaignSelectorModal from "../components/CampaignSelectorModal";
const ConfirmationModal = lazy(
  () => import("../../../components/ui/ConfirmationModal")
);

const STAGES = ["Data", "Prospect", "Lead", "Qualified Lead", "Customer"];

const STAGE_PERMISSION_KEY = {
  "Data": "tab.data",
  "Prospect": "tab.prospect",
  "Lead": "tab.lead",
  "Qualified Lead": "tab.qualified_lead",
  "Customer": "tab.customer",
};

const getPermittedStages = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return STAGES;

  try {
    const user = JSON.parse(userStr);
    const role = (user.role_name || "").toLowerCase();
    if (role === "super admin" || role === "admin" || role === "administrator") {
      return STAGES;
    }

    const campaignModules = user.modules?.campaigns || {};
    const hasAnyTabKey = Object.keys(campaignModules).some((k) => k.startsWith("tab."));
    if (!hasAnyTabKey) return STAGES;

    return STAGES.filter(
      (stage) => campaignModules[STAGE_PERMISSION_KEY[stage]] === true
    );
  } catch {
    return STAGES;
  }
};

// Premium Double-Bezel KPI Card
const KpiCard = ({ title, value, icon: Icon, subtext, trend }) => {
  return (
    <div className="bg-slate-200/40 p-1.5 rounded-[1.75rem] border border-slate-200/20 hover:bg-slate-200/60 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group hover:-translate-y-0.5 flex-1">
      <div className="bg-white p-5 rounded-[calc(1.75rem-0.375rem)] border border-slate-200/25 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
              {title}
            </span>
            {Icon && (
              <div className="p-2 bg-slate-50 border border-slate-100/60 rounded-xl group-hover:scale-105 transition-transform duration-300">
                <Icon className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-slate-800 tracking-tight font-mono">
              {value}
            </span>
          </div>
        </div>

        {(trend || subtext) && (
          <div className="mt-4 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full font-mono",
                  trend.startsWith("+")
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-rose-700 bg-rose-50"
                )}
              >
                {trend}
              </span>
            )}
            {subtext && (
              <span className="text-xs text-slate-500 font-medium font-mono">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CampaignsPage = () => {
  const navigate = useNavigate();
  const permittedStages = getPermittedStages();
  const [activeTab, setActiveTab] = useState(permittedStages[0] || "Data");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    Data: 0,
    Prospect: 0,
    Lead: 0,
    "Qualified Lead": 0,
    Customer: 0,
  });
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetStage, setMoveTargetStage] = useState("");
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showCampaignSelector, setShowCampaignSelector] = useState(false);

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
    if (!hasPermission("campaigns", "view")) {
      toast.error(
        "Access Denied: You do not have permissions to access the Campaigns module."
      );
      navigate("/dashboard");
      return;
    }
    fetchUsers();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchStats();
    fetchLeads();
  }, [activeTab, selectedCampaignId]);

  const fetchCampaigns = async () => {
    try {
      const res = await getCampaignsList();
      setCampaigns(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch campaigns list", error);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const params = selectedCampaignId ? { campaign_id: selectedCampaignId } : {};
      const res = await getCampaignStats(params);
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/users?limit=1000");
      const payload = res.data?.data || res.data || {};
      const userList = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload)
        ? payload
        : [];
      setUsers(userList);
    } catch (error) {
      console.error("Failed to fetch users", error);
      setUsers([]);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = { stage: activeTab };
      if (selectedCampaignId) {
        params.campaign_id = selectedCampaignId;
      }
      const res = await getLeads(params);
      setLeads(res.data?.data || []);
    } catch (error) {
      toast.error("Failed to load campaign leads.");
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    fetchCampaigns();
    fetchLeads();
    fetchStats();
  };

  // Actions
  const handleReject = (lead) => {
    setConfirmModal({
      show: true,
      title: "Reject Lead Entry",
      message: `Are you sure you want to mark "${lead.name}" (${lead.company}) as Rejected?`,
      confirmText: "Mark Rejected",
      variant: "danger",
      onConfirm: async () => {
        try {
          await rejectLead(lead.id);
          toast.success("Lead marked as Rejected");
          refreshAll();
        } catch (error) {
          toast.error("Failed to reject lead.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, show: false }));
        }
      },
    });
  };

  const handleMarkDuplicate = (lead) => {
    setConfirmModal({
      show: true,
      title: "Mark Duplicate Entry",
      message: `Flag "${lead.name}" (${lead.company}) as a duplicate entry?`,
      confirmText: "Mark Duplicate",
      variant: "warning",
      onConfirm: async () => {
        try {
          await markDuplicate(lead.id);
          toast.success("Lead marked as Duplicate");
          refreshAll();
        } catch (error) {
          toast.error("Failed to mark duplicate.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, show: false }));
        }
      },
    });
  };

  const handleMarkNotInterested = (lead) => {
    setConfirmModal({
      show: true,
      title: "Mark Not Interested",
      message: `Mark "${lead.name}" as Not Interested?`,
      confirmText: "Mark Not Interested",
      variant: "danger",
      onConfirm: async () => {
        try {
          await markNotInterested(lead.id);
          toast.success("Response status set to Not Interested");
          refreshAll();
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to update.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, show: false }));
        }
      },
    });
  };

  const handleMarkLost = (lead) => {
    setConfirmModal({
      show: true,
      title: "Mark Lead as Lost",
      message: `Mark deal with "${lead.company}" as Lost?`,
      confirmText: "Mark Lost",
      variant: "danger",
      onConfirm: async () => {
        try {
          await markLost(lead.id);
          toast.success("Lead status updated to Lost");
          refreshAll();
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to update.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, show: false }));
        }
      },
    });
  };

  const openMoveModal = (lead, target) => {
    setSelectedLead(lead);
    setMoveTargetStage(target);
    setShowMoveModal(true);
  };

  const filteredLeads = leads.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.company && item.company.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.industry && item.industry.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Campaign Leads Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track and advance leads across 5 stages: Data → Prospect → Lead → Qualified Lead → Customer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Top-Level Campaign Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <Target className="w-4 h-4 text-primary-600 ml-2" />
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none pr-2 cursor-pointer"
            >
              <option value="">All Campaigns (Combined)</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type || "General"})
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => setShowCampaignSelector(true)}
            className="gap-2 shadow-sm h-9 text-xs"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </Button>

          <Button onClick={() => setShowAddModal(true)} className="gap-2 shadow-sm h-9 text-xs">
            <Plus className="w-4 h-4" /> Add Data Entry
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard
          title="Raw Data"
          value={stats.Data || 0}
          icon={BarChart3}
          subtext="Data Stage"
        />
        <KpiCard
          title="Prospects"
          value={stats.Prospect || 0}
          icon={Target}
          subtext="Prospect Stage"
        />
        <KpiCard
          title="Leads"
          value={stats.Lead || 0}
          icon={Zap}
          subtext="Lead Stage"
        />
        <KpiCard
          title="Qualified Leads"
          value={stats["Qualified Lead"] || 0}
          icon={TrendingUp}
          subtext="Qualified Stage"
        />
        <KpiCard
          title="Customers Won"
          value={stats.Customer || 0}
          icon={CheckCircle2}
          subtext="Customer Stage"
        />
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        {/* Stage Tabs Bar */}
        <div className="px-6 pt-5 pb-0 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3">
            {permittedStages.map((stage) => {
              const count = stats[stage] || 0;
              const isActive = activeTab === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveTab(stage)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary-600 text-white shadow-sm shadow-primary-500/30"
                      : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/60"
                  )}
                >
                  <span>{stage}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono",
                      isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab} leads...`}
              className="pl-9 bg-white"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredLeads.length} entries in <strong>{activeTab}</strong> stage
          </span>
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No leads in {activeTab} stage</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No entries match this stage filter. Move leads from earlier stages or add new data.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="w-56">CONTACT & COMPANY</TableHead>

                    {/* Stage Specific Headers */}
                    {activeTab === "Data" && (
                      <>
                        <TableHead>DESIGNATION</TableHead>
                        <TableHead>CONTACT INFO</TableHead>
                        <TableHead>LOCATION & INDUSTRY</TableHead>
                        <TableHead>SOURCE</TableHead>
                      </>
                    )}

                    {activeTab === "Prospect" && (
                      <>
                        <TableHead>CAMPAIGN</TableHead>
                        <TableHead>ASSIGNED TO</TableHead>
                        <TableHead>RESPONSE STATUS</TableHead>
                        <TableHead>NEXT FOLLOW-UP</TableHead>
                      </>
                    )}

                    {activeTab === "Lead" && (
                      <>
                        <TableHead>INTERESTED SERVICE</TableHead>
                        <TableHead>LEAD STATUS</TableHead>
                        <TableHead>PRIORITY</TableHead>
                        <TableHead>NEXT FOLLOW-UP</TableHead>
                      </>
                    )}

                    {activeTab === "Qualified Lead" && (
                      <>
                        <TableHead>REQUIREMENT</TableHead>
                        <TableHead>BUDGET / VALUE</TableHead>
                        <TableHead>DECISION MAKER</TableHead>
                        <TableHead>NEXT ACTION</TableHead>
                      </>
                    )}

                    {activeTab === "Customer" && (
                      <>
                        <TableHead>PROJECT NAME</TableHead>
                        <TableHead>DEAL VALUE</TableHead>
                        <TableHead>CLOSING DATE</TableHead>
                        <TableHead>STATUS</TableHead>
                      </>
                    )}

                    <TableHead className="text-right pr-6">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {filteredLeads.map((item) => (
                    <TableRow key={item.id} className={cn(item.is_rejected && "opacity-60 bg-rose-50/20")}>
                      {/* Company & Name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">
                            {item.name ? item.name.charAt(0).toUpperCase() : "L"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                              {item.name}
                              {item.is_duplicate && <Badge variant="warning">Duplicate</Badge>}
                              {item.is_rejected && <Badge variant="danger">Rejected</Badge>}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">{item.company}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* DATA Tab Columns */}
                      {activeTab === "Data" && (
                        <>
                          <TableCell className="text-xs text-slate-700">{item.designation || "N/A"}</TableCell>
                          <TableCell className="text-xs">
                            <div className="text-slate-800">{item.email || "N/A"}</div>
                            <div className="text-slate-400 text-[11px]">{item.phone || item.whatsapp || ""}</div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            <div>{item.country || "N/A"}</div>
                            <div className="text-slate-400 text-[11px]">{item.industry || ""}</div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">{item.source || "N/A"}</TableCell>
                        </>
                      )}

                      {/* PROSPECT Tab Columns */}
                      {activeTab === "Prospect" && (
                        <>
                          <TableCell className="text-xs text-slate-800 font-medium">
                            {item.campaign_name || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            {item.assigned_to_name || "Unassigned"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.response_status === "Responded" || item.response_status === "Interested"
                                  ? "success"
                                  : item.response_status === "Not Interested"
                                  ? "danger"
                                  : "outline"
                              }
                            >
                              {item.response_status || "Not Contacted"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 font-mono">
                            {item.next_followup ? item.next_followup.split("T")[0] : "N/A"}
                          </TableCell>
                        </>
                      )}

                      {/* LEAD Tab Columns */}
                      {activeTab === "Lead" && (
                        <>
                          <TableCell className="text-xs font-semibold text-slate-800">
                            {item.interested_service || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.lead_status === "Lost" ? "danger" : "success"}>
                              {item.lead_status || "Interested"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-700">
                            {item.priority || "Medium"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 font-mono">
                            {item.lead_followup ? item.lead_followup.split("T")[0] : "N/A"}
                          </TableCell>
                        </>
                      )}

                      {/* QUALIFIED LEAD Tab Columns */}
                      {activeTab === "Qualified Lead" && (
                        <>
                          <TableCell className="text-xs text-slate-800 max-w-xs truncate">
                            {item.requirement || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs font-mono font-semibold text-slate-800">
                            {item.expected_project_value ? `$${item.expected_project_value}` : item.budget || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            {item.decision_maker || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                            {item.next_action || "N/A"}
                          </TableCell>
                        </>
                      )}

                      {/* CUSTOMER Tab Columns */}
                      {activeTab === "Customer" && (
                        <>
                          <TableCell className="text-xs font-semibold text-slate-800">
                            {item.project_name || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs font-mono font-bold text-emerald-700">
                            {item.currency || "USD"} {item.project_value || "0.00"}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-700">
                            {item.closing_date ? item.closing_date.split("T")[0] : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="success">{item.customer_status || "New Customer"}</Badge>
                          </TableCell>
                        </>
                      )}

                      {/* Row Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail */}
                          <button
                            title="View Full Detail"
                            onClick={() => {
                              setSelectedLead(item);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Lead */}
                          <button
                            title="Edit Lead"
                            onClick={() => {
                              setEditingLead(item);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Move Next Stage */}
                          {activeTab === "Data" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openMoveModal(item, "Prospect")}
                                className="h-7 px-2 text-xs gap-1 border-primary-200 text-primary-700 hover:bg-primary-50"
                              >
                                Move to Prospect <ArrowRight className="w-3 h-3" />
                              </Button>
                              <button
                                title="Mark Rejected"
                                onClick={() => handleReject(item)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button
                                title="Mark Duplicate"
                                onClick={() => handleMarkDuplicate(item)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {activeTab === "Prospect" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openMoveModal(item, "Lead")}
                                className="h-7 px-2 text-xs gap-1 border-primary-200 text-primary-700 hover:bg-primary-50"
                              >
                                Move to Lead <ArrowRight className="w-3 h-3" />
                              </Button>
                              <button
                                title="Move back to Data"
                                onClick={() => openMoveModal(item, "Data")}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                title="Mark Not Interested"
                                onClick={() => handleMarkNotInterested(item)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {activeTab === "Lead" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openMoveModal(item, "Qualified Lead")}
                                className="h-7 px-2 text-xs gap-1 border-primary-200 text-primary-700 hover:bg-primary-50"
                              >
                                Move to Qualified <ArrowRight className="w-3 h-3" />
                              </Button>
                              <button
                                title="Log Activity"
                                onClick={() => {
                                  setSelectedLead(item);
                                  setShowActivityModal(true);
                                }}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                title="Mark Lost"
                                onClick={() => handleMarkLost(item)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {activeTab === "Qualified Lead" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openMoveModal(item, "Customer")}
                                className="h-7 px-2 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Move to Customer <CheckCircle2 className="w-3 h-3" />
                              </Button>
                              <button
                                title="Log Activity"
                                onClick={() => {
                                  setSelectedLead(item);
                                  setShowActivityModal(true);
                                }}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                title="Mark Lost"
                                onClick={() => handleMarkLost(item)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {activeTab === "Customer" && (
                            <button
                              title="Log Activity"
                              onClick={() => {
                                setSelectedLead(item);
                                setShowActivityModal(true);
                              }}
                              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refreshAll}
      />

      <LeadDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        lead={selectedLead}
        onRefresh={refreshAll}
      />

      <EditLeadModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        lead={editingLead}
        users={users}
        onSuccess={refreshAll}
      />

      <MoveStageModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        lead={selectedLead}
        targetStage={moveTargetStage}
        users={users}
        onSuccess={refreshAll}
      />

      <AddActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        lead={selectedLead}
        onSuccess={refreshAll}
      />

      <CampaignSelectorModal
        isOpen={showCampaignSelector}
        onClose={() => setShowCampaignSelector(false)}
        onSelectCampaign={(campaign) => {
          setSelectedCampaignId(campaign.id);
          refreshAll();
        }}
      />

      <Suspense fallback={null}>
        <ConfirmationModal
          isOpen={confirmModal.show}
          onClose={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          variant={confirmModal.variant}
        />
      </Suspense>
    </div>
  );
};

export default CampaignsPage;
