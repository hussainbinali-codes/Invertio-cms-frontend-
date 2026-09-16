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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredAssets = assets.filter((asset) => {
    const q = searchTerm.toLowerCase();
    return (
      (asset.name && asset.name.toLowerCase().includes(q)) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(q)) ||
      (asset.assignee_name && asset.assignee_name.toLowerCase().includes(q)) ||
      (asset.type && asset.type.toLowerCase().includes(q)) ||
      (asset.status && asset.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full space-y-5 pb-10">
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Asset Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Track company hardware inventory and software license allocation.</p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700 h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Add New Asset
        </Button>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
         <StatCard title="Total Assets" value={assets.length} icon={Box} subtext="Global inventory" className="w-full" />
         <StatCard title="Assigned" value={assets.filter(a => a.assignee_name).length} icon={UserPlus} trend="+5" subtext="In active use" className="w-full" />
         <StatCard title="In Stock" value={assets.filter(a => !a.assignee_name).length} icon={CheckCircle2} subtext="Available for allocation" className="w-full" />
      </div>

      <Card className="w-full overflow-hidden">
         <CardHeader className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 sm:py-5 px-4 sm:px-6">
            <div className="w-full">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Asset Inventory</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Tracking {filteredAssets.length} of {assets.length} assets</p>
            </div>
            <div className="relative w-full sm:w-72 shrink-0">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
               <Input 
                 className="pl-9 h-9 sm:h-10 text-xs sm:text-sm w-full" 
                 placeholder="Search by name, serial, user..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </CardHeader>
         <CardContent className="w-full p-0 overflow-x-auto">
            {loading ? (
               <div className="w-full divide-y divide-slate-100">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-full p-4 sm:p-5 flex items-center justify-between gap-4">
                       <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                          <Skeleton className="h-4 w-36" />
                       </div>
                       <Skeleton className="h-4 w-20 hidden sm:block" />
                       <Skeleton className="h-4 w-24 hidden md:block" />
                       <Skeleton className="h-6 w-20 rounded-full" />
                       <div className="flex gap-2 shrink-0">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-8 w-8 rounded-lg" />
                       </div>
                    </div>
                  ))}
               </div>
            ) : (
              <Table className="w-full">
                 <TableHeader>
                    <TableRow>
                       <TableHead className="py-3 px-4 sm:px-6">Asset</TableHead>
                       <TableHead className="py-3 px-4 sm:px-6">Type</TableHead>
                       <TableHead className="py-3 px-4 sm:px-6">Identifier</TableHead>
                       <TableHead className="py-3 px-4 sm:px-6">Custodian</TableHead>
                       <TableHead className="py-3 px-4 sm:px-6">Status</TableHead>
                       <TableHead className="py-3 px-4 sm:px-6">Actions</TableHead>
                    </TableRow>
                 </TableHeader>
                 <tbody>
                    {filteredAssets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                          <Box className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">No assets found</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {searchTerm ? `No results matching "${searchTerm}"` : 'No assets available in inventory'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssets.map(asset => {
                         const Icon = getAssetIcon(asset.name);
                         return (
                            <TableRow key={asset.id} className="group">
                               <TableCell className="py-3.5 px-4 sm:px-6">
                                  <div className="flex items-center gap-3">
                                     <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-primary-50 transition-colors shrink-0">
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:text-primary-600 transition-colors" />
                                     </div>
                                     <span className="font-semibold text-slate-900 text-sm">{asset.name}</span>
                                  </div>
                               </TableCell>
                               <TableCell className="py-3.5 px-4 sm:px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{asset.type}</TableCell>
                               <TableCell className="py-3.5 px-4 sm:px-6 font-mono text-xs text-slate-500 font-medium">{asset.serial_number}</TableCell>
                               <TableCell className="py-3.5 px-4 sm:px-6">
                                  {asset.assignee_name ? (
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                           {asset.assignee_name.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{asset.assignee_name}</span>
                                     </div>
                                  ) : (
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Unassigned</span>
                                  )}
                               </TableCell>
                               <TableCell className="py-3.5 px-4 sm:px-6">
                                  <Badge variant={asset.status === 'Active' ? 'success' : 'default'} className="text-xs font-semibold">{asset.status}</Badge>
                               </TableCell>
                               <TableCell className="py-3.5 px-4 sm:px-6">
                                  <div className="flex justify-start gap-1 sm:gap-2">
                                     <Button 
                                       variant="ghost" 
                                       size="sm"
                                       className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
                                       title="Assign Asset"
                                       onClick={() => {
                                          setSelectedAsset(asset);
                                          setShowAssignModal(true);
                                       }}
                                     >
                                        <UserPlus className="w-4 h-4" />
                                     </Button>
                                     <Button 
                                       variant="ghost" 
                                       size="sm" 
                                       className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50"
                                       title="Delete Asset"
                                     >
                                        <Trash2 className="w-4 h-4" />
                                     </Button>
                                  </div>
                               </TableCell>
                            </TableRow>
                         );
                      })
                    )}
                 </tbody>
              </Table>
            )}
         </CardContent>
      </Card>

      {/* Assign Asset Modal */}
      {showAssignModal && selectedAsset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between py-5 px-6">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Assign Asset</CardTitle>
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
