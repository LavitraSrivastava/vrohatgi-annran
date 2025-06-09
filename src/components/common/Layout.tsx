import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ClipboardCheck, BarChart3, Settings, User, Home, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Sidebar */}
      <aside className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white w-72 flex-shrink-0 shadow-2xl hidden md:block border-r border-slate-700">
        <div className="p-8 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                V ROHATGI
              </h1>
              <p className="text-slate-400 text-sm font-medium">Audit Excellence</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 rounded-xl group ${
                  isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : ''
                }`
              }
            >
              <Home className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Dashboard</span>
            </NavLink>
            
            <NavLink 
              to="/audits" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 rounded-xl group ${
                  isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : ''
                }`
              }
            >
              <ClipboardCheck className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Audits</span>
            </NavLink>
            
            <NavLink 
              to="/reports" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 rounded-xl group ${
                  isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : ''
                }`
              }
            >
              <BarChart3 className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Reports</span>
            </NavLink>
            
            {user.role === 'admin' && (
              <NavLink 
                to="/admin" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 rounded-xl group ${
                    isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : ''
                  }`
                }
              >
                <Settings className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Administration</span>
              </NavLink>
            )}
          </div>
        </nav>
        
        <div className="absolute bottom-0 w-72 bg-slate-950 p-6 border-t border-slate-700">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-semibold text-white">{user.fullName}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all duration-200"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Mobile header */}
      <div className="md:hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white w-full p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">V ROHATGI</h1>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-grow p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;