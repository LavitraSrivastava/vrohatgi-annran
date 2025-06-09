import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-2xl">
            <Shield className="h-16 w-16 text-white" />
          </div>
        </div>
        <h2 className="mt-8 text-center text-4xl font-bold text-white">
          V ROHATGI
        </h2>
        <p className="mt-2 text-center text-lg text-blue-200">
          Professional Audit Management System
        </p>
        <p className="mt-4 text-center text-sm text-blue-300">
          Sign in to access your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/10 backdrop-blur-lg py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20">
          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full pl-10 sm:text-sm rounded-lg py-3"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full pl-10 sm:text-sm rounded-lg py-3"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/30 rounded bg-white/10"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-blue-200">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-300 hover:text-blue-200 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-blue-200">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/signup')}
                className="w-full flex justify-center py-3 px-4 border border-white/30 rounded-lg shadow-sm bg-white/10 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/20 transition-all duration-200"
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;