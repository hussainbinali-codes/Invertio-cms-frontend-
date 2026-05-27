import React, { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import StatCard from '../../../components/ui/StatCard';
import { 
  Monitor, 
  Smartphone, 
  Laptop, 
  Trash2, 
  UserPlus, 
  Search,
  Loader2,
  Box,
  CheckCircle2,
  Plus,
  ExternalLink,
  X
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/ui/Skeleton';

const AssetsPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/assets'); // Assuming this exists based on BRD flow
      setAssets(Array.isArray(res.data.data) ? res.data.data : (res.data.assets || res.data || []));
    } catch (err) {
      console.error("Assets fetch error", err);
      // Mock Data
      setAssets([
        { id: 1, name: 'MacBook Pro M1', type: 'Hardware', serial_number: 'SN-00123', assignee_name: 'Rahul S.', status: 'Active' },
        { id: 2, name: 'Dell UltraSharp 27"', type: 'Hardware', serial_number: 'SN-99881', assignee_name: null, status: 'Stock' },
        { id: 3, name: 'Adobe Creative Cloud', type: 'Software', serial_number: 'LIC-44552', assignee_name: 'Priya K.', status: 'Active' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userId = formData.get('user_id');

    try {
      await axios.patch(`/assets/${selectedAsset.id}/assign`, { user_id: userId });
      toast.success(`Asset assigned to user ${userId}`);
      setShowAssignModal(false);
      fetchAssets(); // Refresh list
    } catch (err) {
      toast.error('Failed to assign asset');
    }
  };

  const getAssetIcon = (name) => {
    const lowName = name.toLowerCase();
    if (lowName.includes('macbook') || lowName.includes('laptop')) return Laptop;
    if (lowName.includes('monitor')) return Monitor;
    if (lowName.includes('phone') || lowName.includes('iphone')) return Smartphone;
    return Box;
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Asset Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Track company hardware inventory and software license allocation.</p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700 h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add New Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <StatCard title="Total Assets" value={assets.length} icon={Box} subtext="Global inventory" />
         <StatCard title="Assigned" value={assets.filter(a => a.assignee_name).length} icon={UserPlus} trend="+5" subtext="In active use" />
         <StatCard title="In Stock" value={assets.filter(a => !a.assignee_name).length} icon={CheckCircle2} subtext="Available for allocation" />
      </div>

      <Card className="overflow-hidden">
         <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold">Asset Inventory</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Tracking {assets.length} assets.</p>
            </div>
            <div className="relative w-full sm:w-72">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <Input className="pl-10 h-10 text-sm w-full" placeholder="Search by name or serial..." />
            </div>
         </CardHeader>
         <CardContent className="p-0">
            {loading ? (
               <div className="divide-y divide-slate-100">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <Skeleton className="h-4 w-48" />
                       </div>
                       <Skeleton className="h-4 w-20" />
                       <Skeleton className="h-3 w-24" />
                       <Skeleton className="h-6 w-24 rounded-full" />
                       <Skeleton className="h-4 w-16" />
                       <div className="flex gap-2">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-8 w-8 rounded-lg" />
                       </div>
                    </div>
                  ))}
               </div>
            ) : (
              <Table>
                 <TableHeader>
                    <TableRow>
                       <TableHead className="py-4">Asset</TableHead>
                       <TableHead className="py-4">Type</TableHead>
                       <TableHead className="py-4">Identifier</TableHead>
                       <TableHead className="py-4">Custodian</TableHead>
                       <TableHead className="py-4">Status</TableHead>
                       <TableHead className="py-4">Actions</TableHead>
                    </TableRow>
                 </TableHeader>
                 <tbody>
                    {assets.map(asset => {
                       const Icon = getAssetIcon(asset.name);
                       return (
                          <TableRow key={asset.id} className="group">
                             <TableCell className="py-5">
                                <div className="flex items-center gap-3">
                                   <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-primary-50 transition-colors">
                                      <Icon className="w-5 h-5 text-slate-600 group-hover:text-primary-600 transition-colors" />
                                   </div>
                                   <span className="font-bold text-slate-900">{asset.name}</span>
                                </div>
                             </TableCell>
                             <TableCell className="py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">{asset.type}</TableCell>
                             <TableCell className="py-5 font-mono text-[10px] text-slate-400 font-bold uppercase">{asset.serial_number}</TableCell>
                             <TableCell className="py-5">
                                {asset.assignee_name ? (
                                   <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                         {asset.assignee_name.charAt(0)}
                                      </div>
                                      <span className="text-sm font-medium text-slate-700">{asset.assignee_name}</span>
                                   </div>
                                ) : (
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Unassigned</span>
                                )}
                             </TableCell>
                             <TableCell className="py-5">
                                <Badge variant={asset.status === 'Active' ? 'success' : 'default'} className="text-[10px] font-bold uppercase tracking-wider">{asset.status}</Badge>
                             </TableCell>
                             <TableCell className="py-5">
                                <div className="flex justify-start gap-2">
                                   <Button 
                                     variant="ghost" 
                                     size="sm"
                                     className="h-8 w-8 p-0"
                                     onClick={() => {
                                        setSelectedAsset(asset);
                                        setShowAssignModal(true);
                                     }}
                                   >
                                      <UserPlus className="w-4 h-4 text-slate-400" />
                                   </Button>
                                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                                      <Trash2 className="w-4 h-4" />
                                   </Button>
                                </div>
                             </TableCell>
                          </TableRow>
                       );
                    })}
                 </tbody>
              </Table>
            )}
         </CardContent>
      </Card>

      {/* Assign Asset Modal */}
      {showAssignModal && selectedAsset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between py-6">
              <div>
                <CardTitle className="text-xl font-bold">Assign Asset</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">{selectedAsset.name}</p>
              </div>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAssign} className="space-y-4">
                <Input label="Assign to User (ID)" name="user_id" type="number" placeholder="Enter User ID" required />
                <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl text-xs text-primary-700 leading-relaxed font-medium">
                   Assigning this asset will update the custodian record and notify the employee. 
                   Ensure the hardware serial number matches the physical handover.
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)} className="flex-1 sm:flex-none">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary-600 hover:bg-primary-700 flex-1 sm:flex-none">
                    Confirm Assignment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;
