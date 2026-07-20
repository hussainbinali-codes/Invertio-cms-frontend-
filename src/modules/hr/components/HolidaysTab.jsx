import React from 'react';
import PremiumCard from '../../../components/ui/PremiumCard';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import { Calendar, Trash2, Search } from 'lucide-react';
import { hasPermission } from '../../../utils/permissionUtils';

const HolidaysTab = ({
  holidays,
  deleteHoliday,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <PremiumCard 
      title="Holiday Calendar" 
      subtitle="Public holidays and company-wide closures." 
      icon={Calendar}
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      headerRight={
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            className="pl-9 h-9 w-64 text-xs" 
            placeholder="Search holidays..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      }
    >
      <div className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-4">Holiday Name</TableHead>
              <TableHead className="py-4">Date</TableHead>
              <TableHead className="py-4">Type</TableHead>
              <TableHead className="py-4">Action</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {holidays.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-400 italic font-medium">No holidays found matching your search.</TableCell>
              </TableRow>
            )}
            {holidays.map(holiday => (
              <TableRow key={holiday.id}>
                <TableCell className="py-5 font-bold text-slate-800">{holiday.name}</TableCell>
                <TableCell className="py-5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-sm font-normal">{new Date(holiday.date).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  <Badge variant="outline" className="text-xs font-semibold text-slate-500">{holiday.type || 'Public'}</Badge>
                </TableCell>
                <TableCell className="py-5">
                  {hasPermission('hr', 'holidays.manage') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-slate-300 hover:text-rose-600"
                      onClick={() => deleteHoliday(holiday.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </PremiumCard>
  );
};

export default HolidaysTab;
