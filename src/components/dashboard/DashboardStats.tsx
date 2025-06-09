import React from 'react';
import { ClipboardCheck, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

type StatsCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
      <div className={`rounded-full p-3 mr-4 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

type DashboardStatsProps = {
  totalAudits: number;
  completedAudits: number;
  pendingAudits: number;
  criticalFindings: number;
};

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalAudits,
  completedAudits,
  pendingAudits,
  criticalFindings,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Audits"
        value={totalAudits}
        icon={<ClipboardCheck className="h-6 w-6 text-blue-600" />}
        color="bg-blue-100"
      />
      <StatsCard
        title="Completed"
        value={completedAudits}
        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
        color="bg-green-100"
      />
      <StatsCard
        title="Pending"
        value={pendingAudits}
        icon={<Clock className="h-6 w-6 text-yellow-600" />}
        color="bg-yellow-100"
      />
      <StatsCard
        title="Critical Findings"
        value={criticalFindings}
        icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
        color="bg-red-100"
      />
    </div>
  );
};

export default DashboardStats;