import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import DashboardStats from '../components/dashboard/DashboardStats';
import RecentAudits from '../components/dashboard/RecentAudits';
import { Plus, Upload, TrendingUp, Award, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalAudits: 0,
    completedAudits: 0,
    pendingAudits: 0,
    criticalFindings: 0,
  });
  
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Fetch checklist audits stats
        const { data: checklistAudits, error: checklistError } = await supabase
          .from('checklist_audits')
          .select('id, status')
          .eq('auditor_id', user.id);
          
        if (checklistError) throw checklistError;

        // Fetch regular audits stats
        const { data: auditsData, error: auditsError } = await supabase
          .from('audits')
          .select('id, status')
          .eq('created_by', user.id);
          
        if (auditsError) throw auditsError;
        
        // Combine both types of audits
        const allAudits = [...(checklistAudits || []), ...(auditsData || [])];
        
        const { data: criticalData, error: criticalError } = await supabase
          .from('checklist_audit_items')
          .select('id')
          .eq('remark', 'no')
          .in('audit_id', checklistAudits?.map(a => a.id) || []);
          
        if (criticalError) throw criticalError;
        
        setStats({
          totalAudits: allAudits.length,
          completedAudits: allAudits.filter(a => a.status === 'approved' || a.status === 'submitted').length,
          pendingAudits: allAudits.filter(a => a.status === 'in_progress' || a.status === 'draft').length,
          criticalFindings: criticalData?.length || 0,
        });
        
        // Fetch recent audits (combining both types)
        const { data: recentChecklistAudits, error: recentChecklistError } = await supabase
          .from('checklist_audits')
          .select('id, title, status, updated_at')
          .eq('auditor_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3);

        const { data: recentRegularAudits, error: recentRegularError } = await supabase
          .from('audits')
          .select('id, title, site, status, type, updated_at')
          .eq('created_by', user.id)
          .order('updated_at', { ascending: false })
          .limit(2);
          
        if (recentChecklistError) throw recentChecklistError;
        if (recentRegularError) throw recentRegularError;
        
        const combinedRecent = [
          ...(recentChecklistAudits || []).map(audit => ({
            id: audit.id,
            title: audit.title,
            site: 'Checklist Audit',
            status: audit.status,
            type: 'Checklist',
            updatedAt: audit.updated_at,
          })),
          ...(recentRegularAudits || []).map(audit => ({
            id: audit.id,
            title: audit.title,
            site: audit.site,
            status: audit.status,
            type: audit.type,
            updatedAt: audit.updated_at,
          }))
        ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
        
        setRecentAudits(combinedRecent);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Welcome back, {user?.fullName}
            </h1>
            <p className="text-gray-600 mt-2">Here's what's happening with your audits today</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/audits')}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Checklist
            </button>
            
            <button
              onClick={() => navigate('/audits/new')}
              className="flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Audit
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalAudits}</div>
                <div className="text-sm text-gray-500">Total Audits</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-xl">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.completedAudits}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.pendingAudits}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-xl">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.criticalFindings}</div>
                <div className="text-sm text-gray-500">Issues Found</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentAudits audits={recentAudits} />
          </div>
          
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/audits')}
                  className="w-full flex items-center p-3 text-left border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                >
                  <Upload className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Upload Checklist</div>
                    <div className="text-sm text-gray-500">Start a new checklist audit</div>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/reports')}
                  className="w-full flex items-center p-3 text-left border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all duration-200"
                >
                  <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">View Reports</div>
                    <div className="text-sm text-gray-500">Analyze audit results</div>
                  </div>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-600">Available</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sync Status</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-600">Up to date</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;