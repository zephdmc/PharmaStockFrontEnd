// frontend/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginForm from '../components/auth/LoginForm';
import { Package, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading, error: authError } = useSelector((state) => state.auth);
  
  // Multi-stage loading simulation
  const [loginStage, setLoginStage] = useState(null); // null, 'server', 'credentials', 'device', 'dashboard'
  const [stageError, setStageError] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Stages definition
  const stages = [
    { id: 'server', label: 'Connecting to secure server...', icon: Loader2 },
    { id: 'credentials', label: 'Verifying login credentials...', icon: Loader2 },
    { id: 'device', label: 'Checking device security...', icon: Loader2 },
    { id: 'dashboard', label: 'Preparing dashboard...', icon: Loader2 }
  ];

  // Redirect when authenticated (bypass simulation if already logged in)
  useEffect(() => {
    if (isAuthenticated && user && !isSimulating) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'pos_agent') navigate('/pos');
    }
  }, [isAuthenticated, user, navigate, isSimulating]);

  // Listen for global login start event (triggered by LoginForm)
  useEffect(() => {
    const handleLoginStart = () => {
      // Reset and start simulation only if not already simulating
      if (!isSimulating && !isAuthenticated) {
        setLoginStage(null);
        setStageError(null);
        setIsSimulating(true);
        runStages();
      }
    };
    window.addEventListener('pharmastock-login-start', handleLoginStart);
    return () => window.removeEventListener('pharmastock-login-start', handleLoginStart);
  }, [isSimulating, isAuthenticated]);

  const runStages = async () => {
    for (const stage of stages) {
      setLoginStage(stage.id);
      // Simulate realistic delay (300–800ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
    }
    // Stages finished; real authentication is already handled by LoginForm
    // The success redirect will happen via the useEffect above.
  };

  // When auth error occurs, stop simulation and show error
  useEffect(() => {
    if (authError && isSimulating) {
      setStageError(authError);
      setIsSimulating(false);
      setLoginStage(null);
    }
  }, [authError, isSimulating]);

  // Reset simulation when login form is shown again (e.g., retry)
  const resetSimulation = () => {
    setIsSimulating(false);
    setLoginStage(null);
    setStageError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo & Brand */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-3 rounded-2xl shadow-lg">
              <Package className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">PharmaStock</h2>
          <p className="mt-2 text-sm text-gray-600">
            by <span className="font-semibold text-indigo-600">Zeph Product</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Censured · Transparent · Inventory & POS
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          {!isSimulating ? (
            <LoginForm onLoginStart={() => window.dispatchEvent(new Event('pharmastock-login-start'))} />
          ) : (
            // Multi‑stage loading UI
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50">
                  <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">Authenticating...</p>
              </div>
              <div className="space-y-3">
                {stages.map((stage) => {
                  const isActive = loginStage === stage.id;
                  const isCompleted = stages.findIndex(s => s.id === loginStage) > stages.findIndex(s => s.id === stage.id);
                  const Icon = stage.icon;
                  return (
                    <div key={stage.id} className="flex items-center space-x-3 text-sm">
                      <div className="flex-shrink-0 w-5">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : isActive ? (
                          <Icon className="h-4 w-4 text-indigo-500 animate-spin" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-200" />
                        )}
                      </div>
                      <span className={`text-gray-600 ${isActive ? 'font-medium text-gray-900' : ''}`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {stageError && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{stageError}</span>
                </div>
              )}
              <button
                onClick={resetSimulation}
                className="mt-4 w-full text-sm text-indigo-600 hover:text-indigo-500 text-center"
              >
                ← Back to login
              </button>
            </div>
          )}
        </div>

        {/* Footer / Contact */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Secure login • 256‑bit SSL</p>
          <p className="mt-1">
            Need help? <a href="https://wa.me/2347062780839" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">WhatsApp Zeph Product</a>
          </p>
          <p className="mt-2">© 2025 PharmaStock — All rights reserved</p>
        </div>
      </div>

      {/* Simple background pattern (optional) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>
    </div>
  );
};

export default LoginPage;