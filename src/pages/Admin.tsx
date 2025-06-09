import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import { Table as Tabs, Users, Settings } from 'lucide-react';
import TemplateBuilder from '../components/admin/TemplateBuilder';
import ChecklistManager from '../components/admin/ChecklistManager';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'templates' | 'checklists' | 'users' | 'settings'>('templates');
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">Manage templates, checklists, users, and system settings</p>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('templates')}
              className={`${
                activeTab === 'templates'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Tabs className="h-5 w-5 mr-2" />
              Audit Templates
            </button>

            <button
              onClick={() => setActiveTab('checklists')}
              className={`${
                activeTab === 'checklists'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Tabs className="h-5 w-5 mr-2" />
              Checklists
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Users className="h-5 w-5 mr-2" />
              User Management
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Settings className="h-5 w-5 mr-2" />
              System Settings
            </button>
          </nav>
        </div>
      </div>
      
      {activeTab === 'templates' && (
        <TemplateBuilder />
      )}

      {activeTab === 'checklists' && (
        <ChecklistManager />
      )}
      
      {activeTab === 'users' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">User Management</h2>
          <p className="text-gray-500">User management functionality coming soon...</p>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">System Settings</h2>
          <p className="text-gray-500">System settings functionality coming soon...</p>
        </div>
      )}
    </Layout>
  );
};

export default Admin;