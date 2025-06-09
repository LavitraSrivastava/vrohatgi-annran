import React from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const registered = queryParams.get('registered') === 'true';
  const confirmEmail = queryParams.get('confirmEmail') === 'true';
  
  return (
    <div>
      {registered && !confirmEmail && (
        <div className="fixed top-0 left-0 right-0 bg-green-100 p-4 z-10">
          <div className="flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-800 text-sm font-medium">
              Account created successfully! Please sign in with your credentials.
            </p>
          </div>
        </div>
      )}
      
      {confirmEmail && (
        <div className="fixed top-0 left-0 right-0 bg-blue-100 p-4 z-10">
          <div className="flex items-center justify-center">
            <Mail className="h-5 w-5 text-blue-500 mr-2" />
            <p className="text-blue-800 text-sm font-medium">
              Please check your email for a confirmation link before signing in.
            </p>
          </div>
        </div>
      )}
      
      <LoginForm />
    </div>
  );
};

export default Login;