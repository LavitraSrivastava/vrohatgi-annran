import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import { format } from 'date-fns';
import { BarChart, PieChart, ChevronRight, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Report = {
  id: string;
  title: string;
  site: string;
  type: string;
  status: string;
  created_at: string;
  created_by: string;
  user: {
    full_name: string;
  };
};

const Reports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sites, setSites] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      
      try {
        const isAdmin = user.role === 'admin';
        const isReviewer = user.role === 'reviewer' || user.role === 'admin';
        
        let query = supabase
          .from('audits')
          .select('*, user:created_by(full_name)')
          .order('created_at', { ascending: false });
          
        // Apply role-based filtering
        if (!isAdmin && !isReviewer) {
          // Regular auditors only see their own reports
          query = query.eq('created_by', user.id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setReports(data || []);
        
        // Extract unique sites and types for filters
        const uniqueSites = [...new Set(data?.map(r => r.site) || [])];
        const uniqueTypes = [...new Set(data?.map(r => r.type) || [])];
        
        setSites(uniqueSites);
        setTypes(uniqueTypes);
        
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [user]);
  
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSite = siteFilter === 'all' || report.site === siteFilter;
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    
    return matchesSearch && matchesSite && matchesType;
  });
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">View and analyze audit reports</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold">Audits by Type</h2>
          </div>
          
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Chart visualization coming soon...</p>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center mb-4">
            <PieChart className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold">Compliance Status</h2>
          </div>
          
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Chart visualization coming soon...</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative rounded-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-gray-500 mr-2" />
              <label htmlFor="site-filter" className="mr-2 text-sm text-gray-700">
                Site:
              </label>
              <select
                id="site-filter"
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
              >
                <option value="all">All Sites</option>
                {sites.map(site => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="type-filter" className="mr-2 text-sm text-gray-700">
                Type:
              </label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
              >
                <option value="all">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No reports match your search criteria
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{report.site}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{report.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{report.user.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(report.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'approved' ? 'bg-green-100 text-green-800' :
                          report.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/reports/${report.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                      >
                        View
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;