import React from 'react';
import PremiumCard from '../../../components/ui/PremiumCard';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { UserCheck, Briefcase, Plus } from 'lucide-react';
import { cn } from '../../../utils/cn';

const PerformanceTab = ({
  employees,
  selectedUserForPerf,
  setSelectedUserForPerf,
  fetchPerfData,
  performanceData,
  setPerfModalType,
  setShowPerfModal
}) => {
  const perfEndRef = React.useRef(null);

  const scrollToBottom = () => {
    perfEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (selectedUserForPerf) {
      scrollToBottom();
    }
  }, [performanceData, selectedUserForPerf]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Left: Employee List */}
      <PremiumCard 
        title="Team Performance" 
        subtitle="Select an employee to manage" 
        icon={UserCheck}
        className="lg:col-span-1 h-[70vh]"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-slate-100">
            {employees.map(emp => (
              <button 
                key={emp.id} 
                onClick={() => {
                  setSelectedUserForPerf(emp);
                  fetchPerfData(emp.user_id);
                }}
                className={cn(
                  "w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center gap-3",
                  selectedUserForPerf?.id === emp.id ? "bg-blue-50/20 border-r-4 border-blue-600" : ""
                )}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shadow-sm border border-white">
                  {emp.name?.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{emp.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{emp.designation}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PremiumCard>

      {/* Right: Performance History */}
      {selectedUserForPerf ? (
        <PremiumCard
          title={selectedUserForPerf.name}
          subtitle={`${selectedUserForPerf.email} • ${selectedUserForPerf.department}`}
          icon={UserCheck}
          className="lg:col-span-2 h-[70vh]"
          headerRight={
            <div className="flex gap-2">
              <Button size="sm" className="text-xs font-semibold text-slate-500" onClick={() => { setPerfModalType('rating'); setShowPerfModal(true); }}>
                <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Rate
              </Button>
              <Button size="sm" variant="success" className="text-xs font-semibold text-slate-500" onClick={() => { setPerfModalType('bonus'); setShowPerfModal(true); }}>
                <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Bonus
              </Button>
              <Button size="sm" variant="outline" className="text-xs font-semibold text-slate-500" onClick={() => { setPerfModalType('hike'); setShowPerfModal(true); }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Hike
              </Button>
            </div>
          }
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
              <div className="space-y-8">
                {/* Ratings History */}
                <div>
                  <h3 className="text-sm font-normal text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Review History
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {performanceData.reviews.length === 0 && <p className="text-xs italic text-slate-400 p-4 bg-white rounded-xl border border-dashed">No reviews logged yet.</p>}
                    {performanceData.reviews.map(rev => (
                      <div key={rev.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-normal text-slate-900 uppercase">{rev.period}</span>
                            <Badge variant="primary" className="text-[10px] font-bold">{rev.rating}/5 Rating</Badge>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">{rev.comments}</p>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{new Date(rev.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bonus History */}
                <div>
                  <h3 className="text-sm font-normal text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Bonus Payouts
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {performanceData.bonuses.length === 0 && <p className="text-xs italic text-slate-400 p-4 bg-white rounded-xl border border-dashed">No bonuses recorded.</p>}
                    {performanceData.bonuses.map(bonus => (
                      <div key={bonus.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 uppercase tracking-tight">₹{parseFloat(bonus.amount).toLocaleString()}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{bonus.bonus_type} • {bonus.reason}</div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="text-xs text-slate-500 font-medium mb-1">{new Date(bonus.payout_date).toLocaleDateString()}</div>
                          <Badge variant="outline" className="text-[8px] font-bold uppercase text-emerald-600 border-emerald-100 bg-emerald-50">Paid</Badge>
                          {bonus.document_url && (
                             <a 
                               href={bonus.document_url} 
                               target="_blank" 
                               rel="noreferrer"
                               className="text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-1 mt-1"
                             >
                               VIEW PROOF
                             </a>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* Hike History */}
                <div>
                  <h3 className="text-sm font-normal text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Salary Trajectory
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {performanceData.hikes.length === 0 && <p className="text-xs italic text-slate-400 p-4 bg-white rounded-xl border border-dashed">Initial salary baseline set.</p>}
                    {performanceData.hikes.map(hike => (
                      <div key={hike.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                            <Plus className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-normal text-slate-900 uppercase">
                              ₹{parseFloat(hike.previous_salary).toLocaleString()} → ₹{parseFloat(hike.new_salary).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">+{hike.percentage}% Hike • {hike.reason}</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{new Date(hike.effective_date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                <div ref={perfEndRef} />
              </div>
            </div>
          </div>
        </PremiumCard>
      ) : (
        <PremiumCard 
          title="Performance Trajectory" 
          subtitle="Select employee to view rating timeline"
          icon={UserCheck} 
          className="lg:col-span-2 h-[70vh]"
        >
          <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No Selection</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Select an employee from the left panel to view their performance history and log new actions.</p>
          </div>
        </PremiumCard>
      )}
    </div>
  );
};

export default PerformanceTab;
