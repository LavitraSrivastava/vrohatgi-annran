import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import ChecklistAudit from '../components/audits/ChecklistAudit';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const Audits: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('checklist');
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audits</h1>
        <p className="text-gray-600">Manage and review your audits</p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`${
                activeTab === 'checklist'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Checklist-Based Audits
            </button>
            <button
              onClick={() => setActiveTab('regular')}
              className={`${
                activeTab === 'regular'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Regular Audits
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'checklist' ? (
        <ChecklistAudit />
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-500">Regular audit functionality coming soon...</p>
        </div>
      )}
    </Layout>
  );
};

export default Audits;