import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

type Audit = {
  id: string;
  title: string;
  site: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  type: string;
  updatedAt: string;
};

type StatusBadgeProps = {
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'draft':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          Draft
        </span>
      );
    case 'submitted':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Submitted
        </span>
      );
    case 'reviewed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Reviewed
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </span>
      );
    default:
      return null;
  }
};

type RecentAuditsProps = {
  audits: Audit[];
};

const RecentAudits: React.FC<RecentAuditsProps> = ({ audits }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Recent Audits</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Audit
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {audits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No recent audits found
                </td>
              </tr>
            ) : (
              audits.map((audit) => (
                <tr 
                  key={audit.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/audits/${audit.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{audit.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{audit.site}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{audit.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={audit.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(audit.updatedAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button 
          onClick={() => navigate('/audits')}
          className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
        >
          View all audits
        </button>
      </div>
    </div>
  );
};

export default RecentAudits;