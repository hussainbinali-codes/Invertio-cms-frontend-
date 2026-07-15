import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { LayoutDashboard, Plus, AlertCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';

const GlobalBoardsTab = ({
  projects,
  canCreate,
  handleViewTasks,
  handleCreateTask
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="py-4 w-[60%]">Project Boards</TableHead>
          <TableHead className="py-4 w-[15%]">Status</TableHead>
          <TableHead className="py-4 w-[25%]">Institutional Actions</TableHead>
        </TableRow>
      </TableHeader>
      <tbody>
        {projects.map((project) => {
          const isBlocked = project.status?.includes('Blocked');
          return (
            <TableRow key={project.id} className={cn("group", isBlocked ? "bg-rose-50/20" : "")}>
              <TableCell className="py-5">
                <div className="font-bold text-slate-900">{project.name}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5 tracking-wider">{project.tech_stack || 'Standard Pipeline'}</div>
              </TableCell>
              <TableCell className="py-5">
                {isBlocked ? (
                  <Badge variant="destructive" className="flex items-center w-fit gap-1 text-xs font-semibold text-slate-500">
                    <AlertCircle className="w-3 h-3" />
                    {project.status}
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-xs font-semibold text-slate-500">Active</Badge>
                )}
              </TableCell>
              <TableCell className="py-5">
                <div className="flex justify-start gap-2">
                   <Button 
                     size="sm" 
                     variant="ghost"
                     className="h-8 text-xs font-semibold text-slate-500 text-slate-600 hover:bg-slate-100 px-3"
                     onClick={() => handleViewTasks(project)}
                   >
                     <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                     Open Board
                   </Button>
                   {canCreate && (
                     <Button 
                       size="sm" 
                       variant="ghost"
                       className={cn(
                         "h-8 text-xs font-semibold text-slate-500 px-3",
                         isBlocked ? "text-rose-500 hover:bg-rose-50 cursor-not-allowed" : "text-primary-600 hover:bg-primary-50"
                       )}
                       onClick={() => handleCreateTask(project)}
                       disabled={isBlocked}
                     >
                       <Plus className="w-3.5 h-3.5 mr-1.5" />
                       {isBlocked ? "Blocked" : "Add Task"}
                     </Button>
                   )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  );
};

export default GlobalBoardsTab;
