import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  X,
  Loader2,
  LayoutDashboard,
  Users,
  ShieldCheck,
  FolderKanban,
  CheckSquare,
  CircleDollarSign,
  UserPlus,
  CalendarClock,
  Contact,
  Monitor,
  Megaphone,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import { useLockBodyScroll } from "../../../hooks/useLockBodyScroll";

const UserModal = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  selectedUser,
  isSubmitting,
  roles,
  skills,
  selectedSkills,
  skillInput,
  setSkillInput,
  handleAddSkill,
  removeSkill,
  pages,
  setPages,
  modules,
  setModules,
}) => {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  const PERMISSION_CONFIG = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5 text-indigo-500" />,
      description: "Main overview, company stats, and performance charts.",
      actions: [{ key: "view", label: "View Dashboard" }],
    },
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-5 h-5 text-blue-500" />,
      description: "Staff directory, account creation, and security settings.",
      actions: [
        { key: "view", label: "View Users List" },
        { key: "create", label: "Add New Users" },
        { key: "salary.view", label: "View Sensitive Salary" },
        { key: "status.edit", label: "Toggle User Status" },
        { key: "permissions.edit", label: "Edit Permissions" },
      ],
    },
    {
      id: "projects",
      label: "Projects",
      icon: <FolderKanban className="w-5 h-5 text-emerald-500" />,
      description: "High-level project boards, budgets, and team setups.",
      actions: [
        { key: "view", label: "View Project List" },
        { key: "create", label: "Create Projects" },
        { key: "edit", label: "Edit Project" },
        { key: "team.manage", label: "Manage Team Members" },
        { key: "documents.confidential", label: "Manage Confidential Docs" },
        { key: "resources.manage", label: "Manage Project Resources" },
      ],
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: <CheckSquare className="w-5 h-5 text-rose-500" />,
      description: "Individual work items, progress tracking, and deadlines.",
      actions: [
        { key: "view", label: "View Tasks Board" },
        { key: "create", label: "Create Tasks" },
        { key: "edit", label: "Update Task Details" },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      icon: <CircleDollarSign className="w-5 h-5 text-amber-500" />,
      description: "Invoicing, company expenses, and profit reports.",
      actions: [
        { key: "view", label: "View Finance Hub" },
        { key: "invoices.create", label: "Generate Invoices" },
        { key: "expenses.create", label: "Log Expenses" },
        { key: "payroll.manage", label: "Create Payroll" },
      ],
    },
    {
      id: "hr",
      label: "HR",
      icon: <UserPlus className="w-5 h-5 text-cyan-500" />,
      description: "Recruitment, employee directory, and HR operations.",
      actions: [
        { key: "view", label: "View HR Dashboard" },
        { key: "leaves.approve", label: "Approve Leaves" },
        { key: "documents.confidential", label: "Manage Confidential HR Docs" },
      ],
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: <CalendarClock className="w-5 h-5 text-emerald-500" />,
      description: "Personal attendance tracking and historical logs.",
      actions: [
        { key: "view", label: "View My Attendance" },
        { key: "view_all", label: "View All Logs (Admin)" },
      ],
    },
    {
      id: "clients",
      label: "Clients",
      icon: <Contact className="w-5 h-5 text-orange-500" />,
      description: "Client database, lead pipeline, and interaction history.",
      actions: [
        { key: "view", label: "View CRM / Leads" },
        { key: "create", label: "Add New Clients" },
        { key: "interactions.create", label: "Log Conversations" },
        { key: "stage.edit", label: "Move Deal Stages" },
        { key: "status.edit", label: "Update Client Status" },
        { key: "documents.upload", label: "Upload Documents" },
        { key: "documents.delete", label: "Delete Documents" },
        {
          key: "documents.confidential",
          label: "Manage Confidential Client Docs",
        },
      ],
      tabs: [
        { key: "tab.lead", label: "Leads" },
        { key: "tab.proposal", label: "Proposal" },
        { key: "tab.proposal_signed", label: "Proposal Signed" },
        { key: "tab.project_started", label: "Project Started" },
        { key: "tab.project_completed", label: "Project Completed" },
        { key: "tab.project_maintenance", label: "Project Maintenance" },
      ],
    },
    {
      id: "campaigns",
      label: "Campaigns",
      icon: <Megaphone className="w-5 h-5 text-rose-500" />,
      description: "Campaign lead tracking, outreach pipeline, and activity management.",
      actions: [
        { key: "view", label: "View Campaigns" },
        { key: "create", label: "Add Data Entry" },
        { key: "edit", label: "Edit Lead Details" },
        { key: "stage.edit", label: "Move Stages / Status" },
        { key: "activities.create", label: "Log Activities" },
        { key: "documents.upload", label: "Upload Documents" },
        { key: "documents.delete", label: "Delete Documents" },
        { key: "export", label: "Export Campaign Data (Excel)" },
      ],
      tabs: [
        { key: "tab.data", label: "Data" },
        { key: "tab.prospect", label: "Prospect" },
        { key: "tab.lead", label: "Lead" },
        { key: "tab.qualified_lead", label: "Qualified Lead" },
        { key: "tab.customer", label: "Customer" },
      ],
    },
    {
      id: "resources",
      label: "Assets",
      icon: <Monitor className="w-5 h-5 text-purple-500" />,
      description:
        "Company assets, equipment inventory, and resource tracking.",
      actions: [
        { key: "view", label: "View Inventory" },
        { key: "create", label: "Add Asset" },
        { key: "edit", label: "Edit Asset" },
        { key: "delete", label: "Remove Asset" },
        { key: "assign", label: "Assign Asset" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-6">
          <div>
            <CardTitle className="text-xl font-bold">
              {isEditing ? "Edit Member" : "Add New Member"}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? "Update team member information and permissions."
                : "Enter details to create a new team member account."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label={
                <span>
                  Full Name <span className="text-red-500 font-bold">*</span>
                </span>
              }
              name="name"
              defaultValue={selectedUser?.name}
              placeholder="John Doe"
              required
            />
            <Input
              label={
                <span>
                  Email Address{" "}
                  <span className="text-red-500 font-bold">*</span>
                </span>
              }
              name="email"
              defaultValue={selectedUser?.email}
              placeholder="john@company.com"
              required
            />
            {!isEditing && (
              <Input
                label={
                  <span>
                    Password <span className="text-red-500 font-bold">*</span>
                  </span>
                }
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={
                  <span>
                    Designation{" "}
                    <span className="text-red-500 font-bold">*</span>
                  </span>
                }
                name="designation"
                defaultValue={selectedUser?.designation}
                placeholder="Senior Developer"
                required
              />
              <Input
                label={
                  <span>
                    Department <span className="text-red-500 font-bold">*</span>
                  </span>
                }
                name="department"
                defaultValue={selectedUser?.department}
                placeholder="Engineering"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={
                  <span>
                    Joining Date{" "}
                    <span className="text-red-500 font-bold">*</span>
                  </span>
                }
                name="joining_date"
                type="date"
                defaultValue={selectedUser?.joining_date?.split("T")[0]}
                required
              />
              <Input
                label={
                  <span>
                    Salary (₹) <span className="text-red-500 font-bold">*</span>
                  </span>
                }
                name="salary"
                type="number"
                min="0"
                defaultValue={selectedUser?.salary}
                placeholder="50000"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Role <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  name="role_id"
                  defaultValue={selectedUser?.role_id}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  required
                >
                  <option value="">Select a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Status <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  name="status"
                  defaultValue={selectedUser?.status || "Active"}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Skill Set (Type & Enter){" "}
                <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Input
                  placeholder="Add skill (e.g. React)..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  className="h-10"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Press Enter to add multiple skills.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 min-h-[40px] p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                {selectedSkills.length === 0 && (
                  <span className="text-xs text-slate-400">
                    No skills added yet...
                  </span>
                )}
                {selectedSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 shadow-sm animate-in fade-in zoom-in duration-200"
                  >
                    {skill.name}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Comprehensive Permission Matrix */}
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl shadow-lg">
                <div>
                  <label className="text-sm font-semibold text-white uppercase tracking-wider">
                    Security & Access Control
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Define granular module-level overrides for this user
                    account.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {PERMISSION_CONFIG.map((mod) => {
                  const isPageEnabled = pages[mod.id] === true;
                  return (
                    <div
                      key={mod.id}
                      className={cn(
                        "group border rounded-xl transition-all duration-300",
                        isPageEnabled
                          ? "bg-white border-primary-200 shadow-sm"
                          : "bg-slate-50/50 border-slate-200 opacity-80",
                      )}
                    >
                      <div className="p-4 flex items-center justify-between border-b border-transparent group-hover:border-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{mod.icon}</span>
                          <div>
                            <h4
                              className={cn(
                                "text-sm font-bold transition-colors",
                                isPageEnabled
                                  ? "text-primary-700"
                                  : "text-slate-700",
                              )}
                            >
                              {mod.label}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium leading-tight max-w-[200px]">
                              {mod.description}
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isPageEnabled}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setPages({ ...pages, [mod.id]: isChecked });

                              if (isChecked && !modules[mod.id]) {
                                const defaults = { view: true };
                                // Auto-enable all tab permissions when Clients is toggled on
                                if (mod.tabs) {
                                  mod.tabs.forEach((tab) => {
                                    defaults[tab.key] = true;
                                  });
                                }
                                setModules({
                                  ...modules,
                                  [mod.id]: defaults,
                                });
                              }
                            }}
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      {isPageEnabled && (
                        <div className="animate-in slide-in-from-top-1 duration-200">
                          {/* Action Permissions */}
                          <div className="p-4 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {mod.actions.map((action) => {
                              const isActionEnabled =
                                modules[mod.id]?.[action.key] === true;
                              return (
                                <label
                                  key={action.key}
                                  className="flex items-center gap-2 text-[11px] cursor-pointer group/action p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    checked={isActionEnabled}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      setModules({
                                        ...modules,
                                        [mod.id]: {
                                          ...(modules[mod.id] || {}),
                                          [action.key]: isChecked,
                                        },
                                      });
                                    }}
                                  />
                                  <span
                                    className={cn(
                                      "font-medium transition-colors",
                                      isActionEnabled
                                        ? "text-slate-900 font-bold"
                                        : "text-slate-500 group-hover/action:text-slate-700",
                                    )}
                                  >
                                    {action.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          {/* Tab Access Permissions (Pipeline Stages) */}
                          {mod.tabs && (
                            <div className="mx-4 mb-4 p-3 bg-orange-50/60 border border-orange-200/50 rounded-xl">
                              <div className="flex items-center gap-2 mb-2.5">
                                <div className="w-1 h-4 bg-orange-400 rounded-full" />
                                <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                                  Pipeline Tab Access
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {mod.tabs.map((tab) => {
                                  const isTabEnabled =
                                    modules[mod.id]?.[tab.key] === true;
                                  return (
                                    <label
                                      key={tab.key}
                                      className="flex items-center gap-2 text-[11px] cursor-pointer group/tab p-2 rounded-lg hover:bg-orange-100/50 transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                                        checked={isTabEnabled}
                                        onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          setModules({
                                            ...modules,
                                            [mod.id]: {
                                              ...(modules[mod.id] || {}),
                                              [tab.key]: isChecked,
                                            },
                                          });
                                        }}
                                      />
                                      <span
                                        className={cn(
                                          "font-medium transition-colors",
                                          isTabEnabled
                                            ? "text-orange-900 font-bold"
                                            : "text-slate-500 group-hover/tab:text-orange-700",
                                        )}
                                      >
                                        {tab.label}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  "Update Account"
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserModal;
