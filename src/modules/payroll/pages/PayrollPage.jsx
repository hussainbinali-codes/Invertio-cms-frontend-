import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import axios from '../../../api/axios';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const PayrollTab = lazy(() => import('../../finance/components/PayrollTab'));
const MonthlyPayrollModal = lazy(() => import('../../finance/components/MonthlyPayrollModal'));
const PayrollBatchDetailsDrawer = lazy(() => import('../../finance/components/PayrollBatchDetailsDrawer'));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
  </div>
);

const PayrollPage = () => {
  const [payrollBatches, setPayrollBatches] = useState([]);
  const [activeBatchDetails, setActiveBatchDetails] = useState(null);
  const [showBatchDrawer, setShowBatchDrawer] = useState(false);
  const [showMonthlyPayrollModal, setShowMonthlyPayrollModal] = useState(false);
  const [batchDetailsLoading, setBatchDetailsLoading] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [isSendingBatchPayslips, setIsSendingBatchPayslips] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Payroll Filters
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState('All');

  const fetchPayrollBatches = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await axios.get('/finance/payroll/batches');
      setPayrollBatches(res.data.data || []);
    } catch (err) {
      if (!silent) toast.error('Failed to fetch payroll runs');
    } finally {
      if (!silent) setIsRefreshing(false);
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('/users/selection');
      setUsers(Array.isArray(res.data.data) ? res.data.data : (res.data.users || []));
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }, []);

  useEffect(() => {
    fetchPayrollBatches();
    fetchUsers();
  }, [fetchPayrollBatches, fetchUsers]);

  const handleGenerateMonthlyBatch = async ({ month, year }) => {
    try {
      setIsGeneratingBatch(true);
      const res = await axios.post('/finance/payroll/batches/generate', { month, year });
      toast.success(res.data.message || 'Payroll generated successfully');
      setShowMonthlyPayrollModal(false);
      await fetchPayrollBatches();
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
    fetchPayrollBatches(true);
    return res.data.data;
  };

  const handleUploadProof = async (payrollId, formData) => {
    const res = await axios.patch(`/finance/payroll/${payrollId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (activeBatchDetails?.batch?.id) {
      handleViewBatchDetails(activeBatchDetails.batch.id);
    }
    fetchPayrollBatches(true);
    return res.data.data;
  };

  const handleSendSinglePayslip = async (payrollId) => {
    const res = await axios.post(`/finance/payroll/records/${payrollId}/send-payslip`);
    if (activeBatchDetails?.batch?.id) {
      handleViewBatchDetails(activeBatchDetails.batch.id);
    }
    fetchPayrollBatches(true);
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
      fetchPayrollBatches(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send batch payslips');
    } finally {
      setIsSendingBatchPayslips(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Suspense fallback={<TabLoader />}>
        <PayrollTab
          batches={payrollBatches}
          loading={loading || isRefreshing}
          onOpenGenerateModal={() => setShowMonthlyPayrollModal(true)}
          onViewBatchDetails={handleViewBatchDetails}
          stats={{ totalEmployees: users.length }}
          searchQuery={payrollSearch}
          setSearchQuery={setPayrollSearch}
          statusFilter={payrollStatusFilter}
          setStatusFilter={setPayrollStatusFilter}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MonthlyPayrollModal
          isOpen={showMonthlyPayrollModal}
          onClose={() => setShowMonthlyPayrollModal(false)}
          onGenerate={handleGenerateMonthlyBatch}
          isGenerating={isGeneratingBatch}
        />

        <PayrollBatchDetailsDrawer
          isOpen={showBatchDrawer}
          onClose={() => setShowBatchDrawer(false)}
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

export default PayrollPage;
