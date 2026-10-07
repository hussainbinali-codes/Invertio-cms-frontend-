// import React, { useEffect, useState, Suspense, lazy } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from '../../../api/axios';
// import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
// import Button from '../../../components/ui/Button';
// import KpiCard from '../../../components/ui/KpiCard';
// import PremiumCard from '../../../components/ui/PremiumCard';
// import {
//   Wallet,
//   TrendingDown,
//   Plus,
//   LayoutDashboard,
//   FileText,
//   Loader2
// } from 'lucide-react';
// import { cn } from '../../../utils/cn';
// import toast from 'react-hot-toast';
// import { hasPermission } from '../../../utils/permissionUtils';
// import Skeleton from '../../../components/ui/Skeleton';

// // Lazy Load Modular Components
// const FinanceOverview = lazy(() => import('../components/FinanceOverview'));
// const InvoicesTab = lazy(() => import('../components/InvoicesTab'));
// const ExpensesTab = lazy(() => import('../components/ExpensesTab'));
// const PayrollTab = lazy(() => import('../components/PayrollTab'));

// // Lazy Load Modals
// const InvoiceModal = lazy(() => import('../components/InvoiceModal'));
// const ExpenseModal = lazy(() => import('../components/ExpenseModal'));
// const PayrollModal = lazy(() => import('../components/PayrollModal'));
// const PayrollStatusModal = lazy(() => import('../components/PayrollStatusModal'));

// const CURRENCIES = [
//   { code: 'USD', symbol: '$', name: 'US Dollar' },
//   { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
//   { code: 'EUR', symbol: '€', name: 'Euro' },
//   { code: 'GBP', symbol: '£', name: 'British Pound' },
//   { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
//   { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' }
// ];

// const FILE_BASE_URL = "http://localhost:5000";

// const TabLoader = () => (
//   <div className="flex items-center justify-center py-20">
//     <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
//   </div>
// );

// const FinancePage = () => {
//   const navigate = useNavigate();
//   const user = JSON.parse(localStorage.getItem('user') || '{}');
//   const isSuperAdmin = user.role_name === 'Super Admin';
//   const [activeView, setActiveView] = useState(isSuperAdmin ? 'Overview' : 'Invoices'); // 'Overview', 'Invoices', 'Expenses', 'Payroll'
//   const [reportData, setReportData] = useState({ consolidated: {}, byCurrency: {} });
//   const [invoices, setInvoices] = useState([]);
//   const [expenses, setExpenses] = useState([]);
//   const [payrollData, setPayrollData] = useState([]);
//   const [clients, setClients] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [showPayrollModal, setShowPayrollModal] = useState(false);
//   const [showInvoiceModal, setShowInvoiceModal] = useState(false);
//   const [invoiceModalType, setInvoiceModalType] = useState('Outbound');
//   const [showExpenseModal, setShowExpenseModal] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [selectedCurrency, setSelectedCurrency] = useState('All');
//   const [reminderSendingId, setReminderSendingId] = useState(null);
  
//   // Payroll Status Modal State
//   const [payrollStatusModal, setPayrollStatusModal] = useState({
//     isOpen: false,
//     payrollId: null,
//     currentStatus: '',
//     targetStatus: '',
//     employeeName: '',
//     period: ''
//   });
  
//   // Invoice Filters
//   const [invoiceSearch, setInvoiceSearch] = useState('');
//   const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');
//   const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('All');

//   // Expense Filters
//   const [expenseSearch, setExpenseSearch] = useState('');
//   const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');

//   // Payroll Filters
//   const [payrollSearch, setPayrollSearch] = useState('');
//   const [payrollYearFilter, setPayrollYearFilter] = useState('All');

//   const [chartData, setChartData] = useState([
//     { name: 'Revenue', value: 0, color: '#3b82f6' },
//     { name: 'Expense', value: 0, color: '#ef4444' },
//     { name: 'Profit', value: 0, color: '#10b981' },
//   ]);

//   useEffect(() => {
//     if (!hasPermission('finance', 'view')) {
//       toast.error("Access Denied: You do not have permissions to access the Finance module.");
//       navigate('/dashboard');
//       return;
//     }
//     if (isSuperAdmin) {
//       fetchFinanceData();
//     } else {
//       setLoading(false);
//     }
//     fetchAuxData();
//   }, []);

//   useEffect(() => {
//     let data;
//     if (selectedCurrency === 'All') {
//       data = reportData.consolidated;
//     } else {
//       data = reportData.byCurrency?.[selectedCurrency];
//     }

//     if (data) {
//       setChartData([
//         { name: 'Revenue', value: data.revenue || 0, color: '#3b82f6' },
//         { name: 'Expense', value: data.expenses || 0, color: '#ef4444' },
//         { name: 'Profit', value: data.profit || 0, color: '#10b981' },
//       ]);
//     } else {
//       setChartData([
//         { name: 'Revenue', value: 0, color: '#3b82f6' },
//         { name: 'Expense', value: 0, color: '#ef4444' },
//         { name: 'Profit', value: 0, color: '#10b981' },
//       ]);
//     }
//   }, [selectedCurrency, reportData]);

//   useEffect(() => {
//     if (activeView === 'Invoices') {
//       fetchInvoices();
//     } else if (activeView === 'Expenses') {
//       fetchExpenses();
//     } else if (activeView === 'Payroll') {
//       fetchPayrollRecords();
//     }
//   }, [activeView]);

//   const fetchFinanceData = async () => {
//     if (!isSuperAdmin) return;
//     try {
//       const year = new Date().getFullYear();
//       const res = await axios.get(`/finance/report?startDate=${year}-01-01&endDate=${year}-12-31`);
//       const data = res.data.data || res.data;
//       setReportData(data);
//     } catch (err) {
//       console.error("Finance fetch error", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchInvoices = async () => {
//     setIsRefreshing(true);
//     try {
//       const res = await axios.get('/finance/invoices');
//       setInvoices(res.data.data || []);
//     } catch (err) {
//       toast.error('Failed to fetch invoices');
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   const fetchExpenses = async () => {
//     setIsRefreshing(true);
//     try {
//       const res = await axios.get('/finance/expenses');
//       setExpenses(res.data.data || []);
//     } catch (err) {
//       toast.error('Failed to fetch expenses');
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   const fetchPayrollRecords = async () => {
//     setIsRefreshing(true);
//     try {
//       const res = await axios.get('/finance/payroll/all');
//       setPayrollData(res.data.data || []);
//     } catch (err) {
//       toast.error('Failed to fetch payroll history');
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   const fetchAuxData = async () => {
//     try {
//       const [cRes, pRes, uRes] = await Promise.all([
//         axios.get('/clients'),
//         axios.get('/projects'),
//         axios.get('/users/selection')
//       ]);
//       setClients(Array.isArray(cRes.data.data) ? cRes.data.data : []);
//       setProjects(Array.isArray(pRes.data.data) ? pRes.data.data : []);
//       setUsers(Array.isArray(uRes.data.data) ? uRes.data.data : (uRes.data.users || []));
//     } catch (err) {
//       console.error("Aux fetch error", err);
//     }
//   };

//   const sendPaymentReminder = async (invoiceId) => {
//     if (!isSuperAdmin) {
//       toast.error('Only Super Admin can send invoice payment reminders');
//       return;
//     }

//     setReminderSendingId(invoiceId);
//     try {
//       await axios.post(`/finance/invoices/${invoiceId}/payment-reminder`);
//       toast.success('Payment reminder sent successfully');
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Failed to send payment reminder');
//     } finally {
//       setReminderSendingId(null);
//     }
//   };

//   const updateStatus = async (id, data) => {
//     try {
//       const formData = new FormData();
//       formData.append('status', data.status);
//       if (data.notes) formData.append('payment_notes', data.notes);
//       if (data.proof) formData.append('proof', data.proof);

//       await axios.patch(`/finance/invoices/${id}/status`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       if (data.status === 'Cancelled') {
//         toast.success('Invoice cancelled successfully');
//       } else {
//         toast.success('Invoice status updated');
//       }
//       fetchInvoices();
//       fetchFinanceData();
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Failed to update status');
//     }
//   };

//   const createInvoice = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     const formData = new FormData(e.target);
    
//     try {
//       await axios.post('/finance/invoices', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });

//       toast.success('Invoice created');
//       setShowInvoiceModal(false);

//       fetchInvoices();
//       fetchFinanceData();
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Creation failed');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const createExpense = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     const formData = new FormData(e.target);
//     const payload = Object.fromEntries(formData);

//     try {
//       await axios.post('/finance/expenses', {
//         ...payload,
//         amount: parseFloat(payload.amount),
//         project_id: payload.project_id || null
//       });
//       toast.success('Expense recorded');
//       setShowExpenseModal(false);
//       fetchExpenses();
//       fetchFinanceData();
//     } catch (err) {
//       toast.error('Failed to record expense');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const processPayroll = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     const formData = new FormData(e.target);
//     const payload = {
//       user_id: formData.get('user_id'),
//       month: parseInt(formData.get('month')),
//       year: parseInt(formData.get('year')),
//       days_adjustment: formData.get('days_adjustment') ? parseFloat(formData.get('days_adjustment')) : 0.00,
//       justification: formData.get('justification') || ''
//     };

//     try {
//       await axios.post('/finance/payroll/generate', payload);
//       toast.success('Payroll generation initiated successfully in background.');
//       setShowPayrollModal(false);
      
//       // Refresh historical list after a short delay (so the worker can finish & save the record)
//       setTimeout(() => {
//         if (activeView === 'Payroll') fetchPayrollRecords();
//         fetchFinanceData();
//       }, 1500);
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Failed to generate payroll');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const updatePayrollStatus = async (id, status) => {
//     // If transitioning to 'Paid', open the confirmation modal instead of direct update
//     if (status === 'Paid') {
//       const payroll = payrollData.find(p => p.id === id);
//       setPayrollStatusModal({
//         isOpen: true,
//         payrollId: id,
//         currentStatus: payroll?.status || 'Pending',
//         targetStatus: 'Paid',
//         employeeName: payroll?.user_name || 'Employee',
//         period: `${payroll?.month}/${payroll?.year}`
//       });
//     } else {
//       try {
//         await axios.patch(`/finance/payroll/${id}`, { status });
//         toast.success('Payroll status updated');
//         if (activeView === 'Payroll') fetchPayrollRecords();
//         fetchFinanceData();
//       } catch (err) {
//         toast.error(err.response?.data?.message || 'Failed to update payroll status');
//       }
//     }
//   };

//   const handlePayrollStatusConfirm = async (data) => {
//     setIsSubmitting(true);
//     try {
//       const formData = new FormData();
//       formData.append('status', data.status);
//       if (data.notes) formData.append('notes', data.notes);
//       if (data.proof) formData.append('proof', data.proof);

//       await axios.patch(`/finance/payroll/${payrollStatusModal.payrollId}`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
      
//       toast.success('Payroll status updated with proof');
//       setPayrollStatusModal(prev => ({ ...prev, isOpen: false }));
//       if (activeView === 'Payroll') fetchPayrollRecords();
//       fetchFinanceData();
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Failed to update status');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="space-y-8 pb-10">
//         <div className="flex justify-between items-center">
//           <div className="space-y-2">
//             <Skeleton className="h-8 w-64" />
//             <Skeleton className="h-4 w-96" />
//           </div>
//           <div className="flex gap-2">
//             <Skeleton className="h-10 w-32 rounded-lg" />
//             <Skeleton className="h-10 w-24 rounded-lg" />
//             <Skeleton className="h-10 w-32 rounded-lg" />
//           </div>
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           <Skeleton className="h-32 rounded-2xl" />
//           <Skeleton className="h-32 rounded-2xl" />
//           <Skeleton className="h-32 rounded-2xl" />
//           <Skeleton className="h-32 rounded-2xl" />
//         </div>
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <Skeleton className="lg:col-span-2 h-[400px] rounded-2xl" />
//           <Skeleton className="h-[400px] rounded-2xl" />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8 pb-10 max-w-[1400px] mx-auto py-2">
//       {/* Header section with Asymmetric Layout */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-950 tracking-tight mt-1">
//             Financial Hub
//           </h1>
//           <p className="text-sm text-slate-500 mt-1 font-normal">
//             Institutional liquidity, institutional billing, and performance analytics.
//           </p>
//         </div>
//         <div className="flex flex-wrap items-center gap-2.5">
//           {hasPermission('finance', 'expenses.create') && (
//             <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
//               <Button 
//                 variant="secondary" 
//                 onClick={() => setShowExpenseModal(true)} 
//                 className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2 px-5 text-sm font-semibold shadow-sm flex items-center gap-2"
//               >
//                 <TrendingDown className="w-3.5 h-3.5" />
//                 Add Expense
//               </Button>
//             </div>
//           )}
//           {hasPermission('finance', 'payroll.manage') && (
//             <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
//               <Button 
//                 variant="secondary" 
//                 onClick={() => setShowPayrollModal(true)} 
//                 className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2 px-5 text-sm font-semibold shadow-sm flex items-center gap-2"
//               >
//                 <Wallet className="w-3.5 h-3.5" />
//                 Payroll
//               </Button>
//             </div>
//           )}
//           {hasPermission('finance', 'invoices.create') && (
//             <div className="flex items-center gap-2">
//               <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
//                 <Button 
//                   onClick={() => { setInvoiceModalType('Outbound'); setShowInvoiceModal(true); }} 
//                   className="bg-blue-600 hover:bg-blue-700 text-white rounded-full py-2 px-5 text-sm font-semibold shadow-sm flex items-center gap-2"
//                 >
//                   <Plus className="w-3.5 h-3.5" />
//                   New Outbound Invoice
//                 </Button>
//               </div>
//               <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
//                 <Button 
//                   variant="secondary"
//                   onClick={() => { setInvoiceModalType('Inbound'); setShowInvoiceModal(true); }} 
//                   className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2 px-5 text-sm font-semibold shadow-sm flex items-center gap-2"
//                 >
//                   <FileText className="w-3.5 h-3.5 text-amber-600" />
//                   Record Inbound Invoice
//                 </Button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* View Tabs capsules */}
//       <div className="bg-slate-200/40 border border-slate-200/25 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar w-fit">
//         {[
//           ...(isSuperAdmin ? [{ id: 'Overview', icon: LayoutDashboard }] : []),
//           { id: 'Invoices', icon: FileText },
//           { id: 'Expenses', icon: TrendingDown },
//           { id: 'Payroll', icon: Wallet }
//         ].map(tab => {
//           const isActive = activeView === tab.id;
//           return (
//             <button
//               key={tab.id}
//               onClick={() => setActiveView(tab.id)}
//               className={cn(
//                 "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 active:scale-[0.98]",
//                 isActive 
//                   ? "bg-white text-blue-600 shadow-sm border border-slate-200/20" 
//                   : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
//               )}
//             >
//               <tab.icon className="w-3.5 h-3.5" />
//               {tab.id.toUpperCase()}
//             </button>
//           );
//         })}
//       </div>

//       <Suspense fallback={<TabLoader />}>
//         {activeView === 'Overview' && (
//           <FinanceOverview 
//             selectedCurrency={selectedCurrency}
//             setSelectedCurrency={setSelectedCurrency}
//             reportData={reportData}
//             chartData={chartData}
//             currencies={CURRENCIES}
//           />
//         )}

//         {activeView === 'Invoices' && (
//           <InvoicesTab 
//             invoices={invoices}
//             isRefreshing={isRefreshing}
//             invoiceSearch={invoiceSearch}
//             setInvoiceSearch={setInvoiceSearch}
//             invoiceTypeFilter={invoiceTypeFilter}
//             setInvoiceTypeFilter={setInvoiceTypeFilter}
//             invoiceStatusFilter={invoiceStatusFilter}
//             setInvoiceStatusFilter={setInvoiceStatusFilter}
//             currencies={CURRENCIES}
//             updateStatus={updateStatus}
//             sendPaymentReminder={sendPaymentReminder}
//             reminderSendingId={reminderSendingId}
//             isSuperAdmin={isSuperAdmin}
//             fileBaseUrl={FILE_BASE_URL}
//           />
//         )}

//         {activeView === 'Expenses' && (
//           <ExpensesTab 
//             expenses={expenses}
//             expenseSearch={expenseSearch}
//             setExpenseSearch={setExpenseSearch}
//             expenseCategoryFilter={expenseCategoryFilter}
//             setExpenseCategoryFilter={setExpenseCategoryFilter}
//             currencies={CURRENCIES}
//           />
//         )}

//         {activeView === 'Payroll' && (
//           <PayrollTab 
//             payrollData={payrollData}
//             payrollSearch={payrollSearch}
//             setPayrollSearch={setPayrollSearch}
//             payrollYearFilter={payrollYearFilter}
//             setPayrollYearFilter={setPayrollYearFilter}
//             currencies={CURRENCIES}
//             updatePayrollStatus={updatePayrollStatus}
//           />
//         )}
//       </Suspense>

//       <Suspense fallback={null}>
//         <InvoiceModal 
//           isOpen={showInvoiceModal}
//           onClose={() => setShowInvoiceModal(false)}
//           onSubmit={createInvoice}
//           isSubmitting={isSubmitting}
//           clients={clients}
//           projects={projects}
//           currencies={CURRENCIES}
//           onOpen={fetchAuxData}
//           modalType={invoiceModalType}
//         />

//         <ExpenseModal 
//           isOpen={showExpenseModal}
//           onClose={() => setShowExpenseModal(false)}
//           onSubmit={createExpense}
//           isSubmitting={isSubmitting}
//           projects={projects}
//           currencies={CURRENCIES}
//         />

//         <PayrollModal 
//           isOpen={showPayrollModal}
//           onClose={() => setShowPayrollModal(false)}
//           onSubmit={processPayroll}
//           isSubmitting={isSubmitting}
//           users={users}
//           projects={projects}
//           currencies={CURRENCIES}
//         />

//         <PayrollStatusModal 
//           isOpen={payrollStatusModal.isOpen}
//           onClose={() => setPayrollStatusModal(prev => ({ ...prev, isOpen: false }))}
//           onConfirm={handlePayrollStatusConfirm}
//           isSubmitting={isSubmitting}
//           currentStatus={payrollStatusModal.currentStatus}
//           targetStatus={payrollStatusModal.targetStatus}
//           employeeName={payrollStatusModal.employeeName}
//           period={payrollStatusModal.period}
//         />
//       </Suspense>
//     </div>
//   );
// };

// export default FinancePage;



import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import KpiCard from '../../../components/ui/KpiCard';
import PremiumCard from '../../../components/ui/PremiumCard';
import {
  Wallet,
  TrendingDown,
  Plus,
  LayoutDashboard,
  FileText,
  Loader2,
  Search,
  Calendar,
  Filter,
  X
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import toast from 'react-hot-toast';
import { hasPermission } from '../../../utils/permissionUtils';
import Skeleton from '../../../components/ui/Skeleton';

// Lazy Load Modular Components
const FinanceOverview = lazy(() => import('../components/FinanceOverview'));
const InvoicesTab = lazy(() => import('../components/InvoicesTab'));
const ExpensesTab = lazy(() => import('../components/ExpensesTab'));
const PayrollTab = lazy(() => import('../components/PayrollTab'));

// Lazy Load Modals
const InvoiceModal = lazy(() => import('../components/InvoiceModal'));
const ExpenseModal = lazy(() => import('../components/ExpenseModal'));
const MonthlyPayrollModal = lazy(() => import('../components/MonthlyPayrollModal'));
const PayrollBatchDetailsDrawer = lazy(() => import('../components/PayrollBatchDetailsDrawer'));
const PayrollStatusModal = lazy(() => import('../components/PayrollStatusModal'));

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' }
];

const MONTH_NAMES_LIST = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const FILE_BASE_URL = "http://localhost:5000";

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
  </div>
);

const FinancePage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.role_name === 'Super Admin';
  const [activeView, setActiveView] = useState(isSuperAdmin ? 'Overview' : 'Invoices'); // 'Overview', 'Invoices', 'Expenses', 'Payroll'
  const [reportData, setReportData] = useState({ consolidated: {}, byCurrency: {} });
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payrollBatches, setPayrollBatches] = useState([]);
  const [activeBatchDetails, setActiveBatchDetails] = useState(null);
  const [showBatchDrawer, setShowBatchDrawer] = useState(false);
  const [showMonthlyPayrollModal, setShowMonthlyPayrollModal] = useState(false);
  const [batchDetailsLoading, setBatchDetailsLoading] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [isSendingBatchPayslips, setIsSendingBatchPayslips] = useState(false);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceModalType, setInvoiceModalType] = useState('Outbound');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reminderSendingId, setReminderSendingId] = useState(null);
  const [dateYearFilter, setDateYearFilter] = useState('All');
  const [dateMonthFilter, setDateMonthFilter] = useState('All');
  const [dateSpecificFilter, setDateSpecificFilter] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('All');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState('All');

  const categoryOptions = React.useMemo(() => {
    const list = new Set();
    expenseCategories.forEach(c => { if (c.name) list.add(c.name); });
    expenses.forEach(e => { if (e.category) list.add(e.category); });
    return Array.from(list).sort();
  }, [expenseCategories, expenses]);

  // Helper to extract local date parts (year, month, day, YYYY-MM-DD) matching user's local timezone
  const getLocalDateParts = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, month, day, dateStr };
  };

  // Local-time aligned filtering for Invoices by specific Date
  const filteredInvoices = React.useMemo(() => {
    return invoices.filter(inv => {
      if (!dateSpecificFilter) return true;
      const rawDate = inv.invoice_date || inv.created_at;
      const parts = getLocalDateParts(rawDate);
      return parts ? parts.dateStr === dateSpecificFilter : false;
    });
  }, [invoices, dateSpecificFilter]);

  // Local-time aligned filtering for Expenses by specific Date
  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(exp => {
      if (!dateSpecificFilter) return true;
      const rawDate = exp.date || exp.created_at;
      const parts = getLocalDateParts(rawDate);
      return parts ? parts.dateStr === dateSpecificFilter : false;
    });
  }, [expenses, dateSpecificFilter]);

  // Local-time aligned filtering for Payroll Batches by specific Date
  const filteredPayrollBatches = React.useMemo(() => {
    return payrollBatches.filter(b => {
      if (!dateSpecificFilter) return true;
      const parts = getLocalDateParts(b.generated_at);
      return parts ? parts.dateStr === dateSpecificFilter : false;
    });
  }, [payrollBatches, dateSpecificFilter]);

  const [chartData, setChartData] = useState([
    { name: 'Revenue', value: 0, color: '#3b82f6' },
    { name: 'Expense', value: 0, color: '#f59e0b' },
    { name: 'Profit', value: 0, color: '#10b981' },
  ]);

  useEffect(() => {
    let data;
    if (selectedCurrency === 'All') {
      data = reportData.consolidated;
    } else {
      data = reportData.byCurrency?.[selectedCurrency];
    }

    if (data) {
      const profitVal = data.profit || 0;
      const isLoss = profitVal < 0;
      setChartData([
        { name: 'Revenue', value: data.revenue || 0, color: '#3b82f6' },
        { name: 'Expense', value: data.expenses || 0, color: '#f59e0b' },
        { name: isLoss ? 'Loss' : 'Profit', value: profitVal, color: isLoss ? '#ef4444' : '#10b981' },
      ]);
    } else {
      setChartData([
        { name: 'Revenue', value: 0, color: '#3b82f6' },
        { name: 'Expense', value: 0, color: '#f59e0b' },
        { name: 'Profit', value: 0, color: '#10b981' },
      ]);
    }
  }, [selectedCurrency, reportData]);

  useEffect(() => {
    if (!hasPermission('finance', 'view')) {
      toast.error("Access Denied: You do not have permissions to access the Finance module.");
      navigate('/dashboard');
      return;
    }
    if (isSuperAdmin) {
      fetchFinanceData(dateSpecificFilter);
    } else {
      setLoading(false);
    }
    fetchAuxData();
  }, [dateSpecificFilter]);

  useEffect(() => {
    if (activeView === 'Invoices') {
      fetchInvoices();
    } else if (activeView === 'Expenses') {
      fetchExpenses();
    } else if (activeView === 'Payroll') {
      fetchPayrollBatches();
    }
  }, [activeView]);

  // Auto-poll invoices silently if any Outbound invoice is still generating its PDF
  useEffect(() => {
    if (activeView !== 'Invoices') return;

    const hasPendingPdf = invoices.some(
      (inv) => inv.type === 'Outbound' && !inv.generated_pdf_url && inv.status !== 'Cancelled'
    );

    if (!hasPendingPdf) return;

    let pollCount = 0;
    const maxPolls = 15; // Poll up to 30 seconds

    const interval = setInterval(() => {
      pollCount += 1;
      fetchInvoices(true);
      if (pollCount >= maxPolls) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [invoices, activeView]);

  const fetchPayrollBatches = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get('/finance/payroll/batches');
      setPayrollBatches(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch payroll runs');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateMonthlyBatch = async ({ month, year }) => {
    try {
      setIsGeneratingBatch(true);
      const res = await axios.post('/finance/payroll/batches/generate', { month, year });
      toast.success('Monthly payroll run generated successfully');
      setShowMonthlyPayrollModal(false);
      fetchPayrollBatches();
      if (res.data.data?.id) {
        handleViewBatchDetails(res.data.data.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate monthly payroll');
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleViewBatchDetails = async (batchId) => {
    try {
      setShowBatchDrawer(true);
      setBatchDetailsLoading(true);
      const res = await axios.get(`/finance/payroll/batches/${batchId}`);
      setActiveBatchDetails(res.data.data || null);
    } catch (err) {
      toast.error('Failed to load batch details');
    } finally {
      setBatchDetailsLoading(false);
    }
  };

  const handleUpdateAdjustment = async (payrollId, payload) => {
    const res = await axios.patch(`/finance/payroll/records/${payrollId}/adjustment`, payload);
    if (activeBatchDetails?.batch?.id) {
      handleViewBatchDetails(activeBatchDetails.batch.id);
    }
    fetchPayrollBatches();
    return res.data.data;
  };

  const handleUploadProof = async (payrollId, formData) => {
    const res = await axios.patch(`/finance/payroll/${payrollId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (activeBatchDetails?.batch?.id) {
      handleViewBatchDetails(activeBatchDetails.batch.id);
    }
    fetchPayrollBatches();
    return res.data.data;
  };

  const handleSendSinglePayslip = async (payrollId) => {
    const res = await axios.post(`/finance/payroll/records/${payrollId}/send-payslip`);
    if (activeBatchDetails?.batch?.id) {
      handleViewBatchDetails(activeBatchDetails.batch.id);
    }
    fetchPayrollBatches();
    return res.data.data;
  };

  const handleSendBatchPayslips = async (batchId) => {
    try {
      setIsSendingBatchPayslips(true);
      const res = await axios.post(`/finance/payroll/batches/${batchId}/send-payslips`);
      toast.success(res.data.message || 'Payslips sent to employees');
      if (activeBatchDetails?.batch?.id) {
        handleViewBatchDetails(activeBatchDetails.batch.id);
      }
      fetchPayrollBatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send batch payslips');
    } finally {
      setIsSendingBatchPayslips(false);
    }
  };

  const fetchFinanceData = async (date = dateSpecificFilter) => {
    if (!isSuperAdmin) return;
    try {
      let startDate, endDate;
      if (date) {
        startDate = date;
        endDate = date;
      } else {
        const currentYear = new Date().getFullYear();
        startDate = `${currentYear}-01-01`;
        endDate = `${currentYear}-12-31`;
      }

      const res = await axios.get(`/finance/report?startDate=${startDate}&endDate=${endDate}`);
      const data = res.data.data || res.data;
      setReportData(data);
    } catch (err) {
      console.error("Finance fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await axios.get('/finance/invoices');
      setInvoices(res.data.data || []);
    } catch (err) {
      if (!silent) toast.error('Failed to fetch invoices');
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const fetchExpenses = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get('/finance/expenses');
      setExpenses(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch expenses');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchPayrollRecords = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get('/finance/payroll/all');
      setPayrollData(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch payroll history');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [cRes, pRes, uRes, catRes] = await Promise.all([
        axios.get('/clients'),
        axios.get('/projects'),
        axios.get('/users/selection'),
        axios.get('/finance/expense-categories').catch(() => ({ data: { data: [] } }))
      ]);
      setClients(Array.isArray(cRes.data.data) ? cRes.data.data : []);
      setProjects(Array.isArray(pRes.data.data) ? pRes.data.data : []);
      setUsers(Array.isArray(uRes.data.data) ? uRes.data.data : (uRes.data.users || []));
      setExpenseCategories(Array.isArray(catRes.data.data) ? catRes.data.data : []);
    } catch (err) {
      console.error("Aux fetch error", err);
    }
  };

  const sendPaymentReminder = async (invoiceId) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can send invoice payment reminders');
      return;
    }

    setReminderSendingId(invoiceId);
    try {
      await axios.post(`/finance/invoices/${invoiceId}/payment-reminder`);
      toast.success('Payment reminder sent successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send payment reminder');
    } finally {
      setReminderSendingId(null);
    }
  };

  const updateStatus = async (id, data) => {
    try {
      const formData = new FormData();
      formData.append('status', data.status);
      if (data.notes) formData.append('payment_notes', data.notes);
      if (data.proofs && data.proofs.length > 0) {
        data.proofs.forEach(file => {
          formData.append('proofs', file);
          formData.append('proof', file);
        });
      } else if (data.proof) {
        formData.append('proof', data.proof);
      }

      await axios.patch(`/finance/invoices/${id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.status === 'Cancelled') {
        toast.success('Invoice cancelled successfully');
      } else {
        toast.success('Invoice status updated');
      }
      fetchInvoices();
      fetchFinanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const createInvoice = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);

    try {
      await axios.post('/finance/invoices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Invoice created');
      setShowInvoiceModal(false);

      await fetchInvoices();
      fetchFinanceData();

      // Trigger a rapid follow-up check after 1.5s
      setTimeout(() => {
        fetchInvoices(true);
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createExpense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);

    try {
      await axios.post('/finance/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Expense recorded');
      setShowExpenseModal(false);
      fetchExpenses();
      fetchFinanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const processPayroll = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const payload = {
      user_id: formData.get('user_id'),
      month: parseInt(formData.get('month')),
      year: parseInt(formData.get('year')),
      days_adjustment: formData.get('days_adjustment') ? parseFloat(formData.get('days_adjustment')) : 0.00,
      justification: formData.get('justification') || ''
    };

    try {
      await axios.post('/finance/payroll/generate', payload);
      toast.success('Payroll generation initiated successfully in background.');
      setShowPayrollModal(false);

      // Refresh historical list after a short delay (so the worker can finish & save the record)
      setTimeout(() => {
        if (activeView === 'Payroll') fetchPayrollRecords();
        fetchFinanceData();
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePayrollStatus = async (id, status) => {
    // If transitioning to 'Paid', open the confirmation modal instead of direct update
    if (status === 'Paid') {
      const payroll = payrollData.find(p => p.id === id);
      setPayrollStatusModal({
        isOpen: true,
        payrollId: id,
        currentStatus: payroll?.status || 'Pending',
        targetStatus: 'Paid',
        employeeName: payroll?.user_name || 'Employee',
        period: `${payroll?.month}/${payroll?.year}`
      });
    } else {
      try {
        await axios.patch(`/finance/payroll/${id}`, { status });
        toast.success('Payroll status updated');
        if (activeView === 'Payroll') fetchPayrollRecords();
        fetchFinanceData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update payroll status');
      }
    }
  };

  const handlePayrollStatusConfirm = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', data.status);
      if (data.notes) formData.append('notes', data.notes);
      if (data.proof) formData.append('proof', data.proof);

      await axios.patch(`/finance/payroll/${payrollStatusModal.payrollId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Payroll status updated with proof');
      setPayrollStatusModal(prev => ({ ...prev, isOpen: false }));
      if (activeView === 'Payroll') fetchPayrollRecords();
      fetchFinanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-6 sm:space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 w-full min-w-0">
          <div className="space-y-2 w-full max-w-md">
            <Skeleton className="h-8 w-48 sm:w-64" />
            <Skeleton className="h-4 w-full max-w-xs sm:w-96" />
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Skeleton className="h-9 sm:h-10 w-28 sm:w-32 rounded-lg" />
            <Skeleton className="h-9 sm:h-10 w-20 sm:w-24 rounded-lg" />
            <Skeleton className="h-9 sm:h-10 w-28 sm:w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
          <Skeleton className="h-32 rounded-2xl w-full" />
          <Skeleton className="h-32 rounded-2xl w-full" />
          <Skeleton className="h-32 rounded-2xl w-full" />
          <Skeleton className="h-32 rounded-2xl w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-2xl w-full" />
          <Skeleton className="h-[400px] rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-8 pb-10 py-1">
      {/* Header section with Asymmetric Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight mt-1">
            Financial Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Institutional liquidity, institutional billing, and performance analytics.
          </p>
        </div>
        <div className="flex items-center flex-nowrap gap-1.5 sm:gap-2">
          {hasPermission('finance', 'expenses.create') && (
            <div className="bg-slate-200/30 p-0.5 sm:p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExpenseModal(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-1 px-2.5 sm:px-3 text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
              >
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Add Expense</span>
              </Button>
            </div>
          )}
          {hasPermission('finance', 'payroll.manage') && (
            <div className="bg-slate-200/30 p-0.5 sm:p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowMonthlyPayrollModal(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-1 px-2.5 sm:px-3 text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Generate Payroll</span>
              </Button>
            </div>
          )}
          {hasPermission('finance', 'invoices.create') && (
            <>
              <div className="bg-slate-200/30 p-0.5 sm:p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300 shrink-0">
                <Button
                  size="sm"
                  onClick={() => { setInvoiceModalType('Outbound'); setShowInvoiceModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full py-1 px-2.5 sm:px-3 text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">New Outbound Invoice</span>
                </Button>
              </div>
              <div className="bg-slate-200/30 p-0.5 sm:p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setInvoiceModalType('Inbound'); setShowInvoiceModal(true); }}
                  className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-1 px-2.5 sm:px-3 text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="whitespace-nowrap">Record Inbound Invoice</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Financial Navigation and Filters Bar */}
      <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 shadow-2xs space-y-2.5">
        {/* Tier 1: View Navigation Tabs & Date/Period Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          {/* Tabs Capsules */}
          <div className="bg-slate-200/60 border border-slate-200/40 rounded-xl p-1 flex items-center gap-1 overflow-x-auto no-scrollbar w-full lg:w-fit shrink-0">
            {[
              ...(isSuperAdmin ? [{ id: 'Overview', icon: LayoutDashboard }] : []),
              { id: 'Invoices', icon: FileText },
              { id: 'Expenses', icon: TrendingDown },
              { id: 'Payroll', icon: Wallet }
            ].map(tab => {
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 active:scale-[0.98] whitespace-nowrap shrink-0",
                    isActive
                      ? "bg-white text-blue-600 shadow-xs border border-slate-200/40"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Specific Date Picker */}
          <div className="flex items-center gap-2 justify-start lg:justify-end">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date:</span>
              <input
                type="date"
                value={dateSpecificFilter}
                onChange={(e) => setDateSpecificFilter(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-1"
              />
              {dateSpecificFilter && (
                <button
                  type="button"
                  onClick={() => setDateSpecificFilter('')}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  title="Clear date"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Reset Filter Button (visible if date filter active) */}
            {dateSpecificFilter && (
              <button
                type="button"
                onClick={() => setDateSpecificFilter('')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-2xs border border-rose-200/50"
                title="Reset date filter"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Search Input and Tab-Specific Dropdowns */}
        <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Left: Search Bar */}
          <div className="w-full sm:w-80">
            {activeView === 'Invoices' && (
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice # or client..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
                />
              </div>
            )}
            {activeView === 'Expenses' && (
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search expenses by description, project..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
                />
              </div>
            )}
            {activeView === 'Payroll' && (
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search payroll month or year..."
                  value={payrollSearch}
                  onChange={(e) => setPayrollSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
                />
              </div>
            )}
            {activeView === 'Overview' && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Financial Performance & Liquidity Report</span>
              </div>
            )}
          </div>

          {/* Right: Specific Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
            {activeView === 'Overview' && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Currency:</span>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-2"
                >
                  <option value="All">All (Consolidated INR)</option>
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                  ))}
                </select>
              </div>
            )}

            {activeView === 'Invoices' && (
              <>
                <select
                  value={invoiceTypeFilter}
                  onChange={(e) => setInvoiceTypeFilter(e.target.value)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Outbound">Outbound (Billing)</option>
                  <option value="Inbound">Inbound (Vendor)</option>
                </select>

                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </>
            )}

            {activeView === 'Expenses' && (
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            {activeView === 'Payroll' && (
              <select
                value={payrollStatusFilter}
                onChange={(e) => setPayrollStatusFilter(e.target.value)}
                className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Paid">Paid</option>
                <option value="Sent">Sent</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={<TabLoader />}>
        {activeView === 'Overview' && (
          <FinanceOverview
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            reportData={reportData}
            chartData={chartData}
            currencies={CURRENCIES}
          />
        )}

        {activeView === 'Invoices' && (
          <InvoicesTab
            invoices={filteredInvoices}
            isRefreshing={isRefreshing}
            invoiceSearch={invoiceSearch}
            setInvoiceSearch={setInvoiceSearch}
            invoiceTypeFilter={invoiceTypeFilter}
            setInvoiceTypeFilter={setInvoiceTypeFilter}
            invoiceStatusFilter={invoiceStatusFilter}
            setInvoiceStatusFilter={setInvoiceStatusFilter}
            currencies={CURRENCIES}
            updateStatus={updateStatus}
            sendPaymentReminder={sendPaymentReminder}
            reminderSendingId={reminderSendingId}
            isSuperAdmin={isSuperAdmin}
            fileBaseUrl={FILE_BASE_URL}
          />
        )}

        {activeView === 'Expenses' && (
          <ExpensesTab
            expenses={filteredExpenses}
            expenseSearch={expenseSearch}
            setExpenseSearch={setExpenseSearch}
            expenseCategoryFilter={expenseCategoryFilter}
            setExpenseCategoryFilter={setExpenseCategoryFilter}
            currencies={CURRENCIES}
            categories={expenseCategories}
            onCategoriesChange={setExpenseCategories}
            fileBaseUrl={FILE_BASE_URL}
          />
        )}

        {activeView === 'Payroll' && (
          <PayrollTab
            batches={filteredPayrollBatches}
            loading={isRefreshing}
            onOpenGenerateModal={() => setShowMonthlyPayrollModal(true)}
            onViewBatchDetails={handleViewBatchDetails}
            stats={{ totalEmployees: users.length }}
            searchQuery={payrollSearch}
            setSearchQuery={setPayrollSearch}
            statusFilter={payrollStatusFilter}
            setStatusFilter={setPayrollStatusFilter}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          onSubmit={createInvoice}
          isSubmitting={isSubmitting}
          clients={clients}
          projects={projects}
          currencies={CURRENCIES}
          onOpen={fetchAuxData}
          modalType={invoiceModalType}
        />

        <ExpenseModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onSubmit={createExpense}
          isSubmitting={isSubmitting}
          projects={projects}
          currencies={CURRENCIES}
          categories={expenseCategories}
          onCategoriesChange={setExpenseCategories}
        />

        <MonthlyPayrollModal
          isOpen={showMonthlyPayrollModal}
          onClose={() => setShowMonthlyPayrollModal(false)}
          onGenerate={handleGenerateMonthlyBatch}
          isGenerating={isGeneratingBatch}
        />

        <PayrollBatchDetailsDrawer
          isOpen={showBatchDrawer}
          onClose={() => { setShowBatchDrawer(false); setActiveBatchDetails(null); }}
          batchDetails={activeBatchDetails}
          loading={batchDetailsLoading}
          onUpdateAdjustment={handleUpdateAdjustment}
          onUploadProof={handleUploadProof}
          onSendSinglePayslip={handleSendSinglePayslip}
          onSendBatchPayslips={handleSendBatchPayslips}
          isSendingBatch={isSendingBatchPayslips}
        />
      </Suspense>
    </div>
  );
};

export default FinancePage;