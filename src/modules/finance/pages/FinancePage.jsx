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
  Loader2
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
const PayrollModal = lazy(() => import('../components/PayrollModal'));
const PayrollStatusModal = lazy(() => import('../components/PayrollStatusModal'));

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' }
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
  const [payrollData, setPayrollData] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceModalType, setInvoiceModalType] = useState('Outbound');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  const [reminderSendingId, setReminderSendingId] = useState(null);
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Payroll Status Modal State
  const [payrollStatusModal, setPayrollStatusModal] = useState({
    isOpen: false,
    payrollId: null,
    currentStatus: '',
    targetStatus: '',
    employeeName: '',
    period: ''
  });

  // Invoice Filters
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('All');

  // Expense Filters
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');

  // Payroll Filters
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollYearFilter, setPayrollYearFilter] = useState('All');

  const [chartData, setChartData] = useState([
    { name: 'Revenue', value: 0, color: '#3b82f6' },
    { name: 'Expense', value: 0, color: '#ef4444' },
    { name: 'Profit', value: 0, color: '#10b981' },
  ]);

  useEffect(() => {
    if (!hasPermission('finance', 'view')) {
      toast.error("Access Denied: You do not have permissions to access the Finance module.");
      navigate('/dashboard');
      return;
    }
    if (isSuperAdmin) {
      fetchFinanceData();
    } else {
      setLoading(false);
    }
    fetchAuxData();
  }, []);

  useEffect(() => {
    let data;
    if (selectedCurrency === 'All') {
      data = reportData.consolidated;
    } else {
      data = reportData.byCurrency?.[selectedCurrency];
    }

    if (data) {
      setChartData([
        { name: 'Revenue', value: data.revenue || 0, color: '#3b82f6' },
        { name: 'Expense', value: data.expenses || 0, color: '#ef4444' },
        { name: 'Profit', value: data.profit || 0, color: '#10b981' },
      ]);
    } else {
      setChartData([
        { name: 'Revenue', value: 0, color: '#3b82f6' },
        { name: 'Expense', value: 0, color: '#ef4444' },
        { name: 'Profit', value: 0, color: '#10b981' },
      ]);
    }
  }, [selectedCurrency, reportData]);

  useEffect(() => {
    if (activeView === 'Invoices') {
      fetchInvoices();
    } else if (activeView === 'Expenses') {
      fetchExpenses();
    } else if (activeView === 'Payroll') {
      fetchPayrollRecords();
    }
  }, [activeView]);

  const fetchFinanceData = async () => {
    if (!isSuperAdmin) return;
    try {
      const year = new Date().getFullYear();
      const res = await axios.get(`/finance/report?startDate=${year}-01-01&endDate=${year}-12-31`);
      const data = res.data.data || res.data;
      setReportData(data);
    } catch (err) {
      console.error("Finance fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setIsRefreshing(true);
    try {
      const res = await axios.get('/finance/invoices');
      setInvoices(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch invoices');
    } finally {
      setIsRefreshing(false);
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
      if (data.proof) formData.append('proof', data.proof);

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

      fetchInvoices();
      fetchFinanceData();
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
    const payload = Object.fromEntries(formData);

    try {
      await axios.post('/finance/expenses', {
        ...payload,
        amount: parseFloat(payload.amount),
        project_id: payload.project_id || null
      });
      toast.success('Expense recorded');
      setShowExpenseModal(false);
      fetchExpenses();
      fetchFinanceData();
    } catch (err) {
      toast.error('Failed to record expense');
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
      <div className="space-y-8 pb-10 px-4 sm:px-6 lg:px-0">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 sm:w-64" />
            <Skeleton className="h-4 w-full max-w-xs sm:w-96" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-28 sm:w-32 rounded-lg" />
            <Skeleton className="h-10 w-20 sm:w-24 rounded-lg" />
            <Skeleton className="h-10 w-28 sm:w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 max-w-[1400px] mx-auto py-2 px-4 sm:px-6 lg:px-0">
      {/* Header section with Asymmetric Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight mt-1">
            Financial Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Institutional liquidity, institutional billing, and performance analytics.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          {hasPermission('finance', 'expenses.create') && (
            <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
              <Button
                variant="secondary"
                onClick={() => setShowExpenseModal(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2 px-3 sm:px-5 text-sm font-semibold shadow-sm flex items-center justify-center gap-2 w-full"
              >
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Add Expense</span>
              </Button>
            </div>
          )}
          {hasPermission('finance', 'payroll.manage') && (
            <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
              <Button
                variant="secondary"
                onClick={() => setShowPayrollModal(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2 px-3 sm:px-5 text-sm font-semibold shadow-sm flex items-center justify-center gap-2 w-full"
              >
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Payroll</span>
              </Button>
            </div>
          )}
          {hasPermission('finance', 'invoices.create') && (
            <div className="col-span-2 sm:col-auto flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2">
              <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300 flex-1">
                <Button
                  onClick={() => { setInvoiceModalType('Outbound'); setShowInvoiceModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full py-2 px-3 sm:px-5 text-sm font-semibold shadow-sm flex items-center justify-center gap-2 w-full"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">New Outbound Invoice</span>
                </Button>
              </div>
              <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300 flex-1">
                <Button
                  variant="secondary"
                  onClick={() => { setInvoiceModalType('Inbound'); setShowInvoiceModal(true); }}
                  className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2 px-3 sm:px-5 text-sm font-semibold shadow-sm flex items-center justify-center gap-2 w-full"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Record Inbound Invoice</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Tabs capsules */}
      <div className="bg-slate-200/40 border border-slate-200/25 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-fit -mx-4 px-4 sm:mx-0 sm:px-1.5">
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
                "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 active:scale-[0.98] whitespace-nowrap shrink-0",
                isActive
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/20"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              )}
            >
              <tab.icon className="w-3.5 h-3.5 shrink-0" />
              {tab.id.toUpperCase()}
            </button>
          );
        })}
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
            invoices={invoices}
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
            expenses={expenses}
            expenseSearch={expenseSearch}
            setExpenseSearch={setExpenseSearch}
            expenseCategoryFilter={expenseCategoryFilter}
            setExpenseCategoryFilter={setExpenseCategoryFilter}
            currencies={CURRENCIES}
            categories={expenseCategories}
            onCategoriesChange={setExpenseCategories}
          />
        )}

        {activeView === 'Payroll' && (
          <PayrollTab
            payrollData={payrollData}
            payrollSearch={payrollSearch}
            setPayrollSearch={setPayrollSearch}
            payrollYearFilter={payrollYearFilter}
            setPayrollYearFilter={setPayrollYearFilter}
            currencies={CURRENCIES}
            updatePayrollStatus={updatePayrollStatus}
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

        <PayrollModal
          isOpen={showPayrollModal}
          onClose={() => setShowPayrollModal(false)}
          onSubmit={processPayroll}
          isSubmitting={isSubmitting}
          users={users}
          projects={projects}
          currencies={CURRENCIES}
        />

        <PayrollStatusModal
          isOpen={payrollStatusModal.isOpen}
          onClose={() => setPayrollStatusModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handlePayrollStatusConfirm}
          isSubmitting={isSubmitting}
          currentStatus={payrollStatusModal.currentStatus}
          targetStatus={payrollStatusModal.targetStatus}
          employeeName={payrollStatusModal.employeeName}
          period={payrollStatusModal.period}
        />
      </Suspense>
    </div>
  );
};

export default FinancePage;