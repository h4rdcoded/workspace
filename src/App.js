import './App.css';
import './styles/badge-responsive.css';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet
} from "react-router-dom"
import Page404 from './Layout/Page404';
import {ConfigProvider, ConfigContext} from '../src/Context/ConfigContext'
import React, { useContext, useMemo } from 'react';

import routes from './Routes/Routes'
import AppLayout from './Layout/AppLayout';
import Login from './Pages/LoginPage/Login';

import SetPassword from './Pages/LoginPage/SetPassword';
import FirstUserSignup from './Pages/LoginPage/FirstUserSignup'; // Import the new component
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
          <h1>🚨 Something went wrong</h1>
          <p>The application encountered an error and could not render properly.</p>
          <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', textAlign: 'left', maxWidth: '600px', margin: '20px auto', overflow: 'auto' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route Component
function ProtectedRoute() {
  const context = useContext(ConfigContext);
  
  if (!context || !context.isInitialized) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'relative',
          marginBottom: '20px'
        }}>
          <img 
            src="/assets/ip.png" 
            alt="Loading" 
            style={{
              maxWidth: '200px',
              animation: 'pulse 1.5s infinite ease-in-out'
            }} 
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            animation: 'overlay-pulse 1.5s infinite ease-in-out'
          }}></div>
        </div>
        <h3 style={{ color: '#333', marginTop: '15px' }}>Loading your workspace...</h3>
        <style jsx="true">{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes overlay-pulse {
            0% { opacity: 0.1; }
            50% { opacity: 0.3; }
            100% { opacity: 0.1; }
          }
        `}</style>
      </div>
    );
  }
  
  const isAuthenticated = context.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }
  
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
    
  );
}

// Public Route Component (for login pages)
function PublicRoute() {
  const context = useContext(ConfigContext);
  
  if (!context || !context.isInitialized) {
    return (
       <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'relative',
          marginBottom: '20px'
        }}>
          <img 
            src="/assets/ip.png" 
            alt="Loading" 
            style={{
              maxWidth: '200px',
              animation: 'pulse 1.5s infinite ease-in-out'
            }} 
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            animation: 'overlay-pulse 1.5s infinite ease-in-out'
          }}></div>
        </div>
        <h3 style={{ color: '#333', marginTop: '15px' }}>Loading your workspace...</h3>
        <style jsx="true">{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes overlay-pulse {
            0% { opacity: 0.1; }
            50% { opacity: 0.3; }
            100% { opacity: 0.1; }
          }
        `}</style>
      </div>
    );
  }
  
  const isAuthenticated = context.isAuthenticated();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}

// Open Route Component (allows both authenticated and unauthenticated users)
function OpenRoute() {
  const context = useContext(ConfigContext);
  
  if (!context || !context.isInitialized) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'relative',
          marginBottom: '20px'
        }}>
          <img 
            src="/assets/ip.png" 
            alt="Loading" 
            style={{
              maxWidth: '200px',
              animation: 'pulse 1.5s infinite ease-in-out'
            }} 
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            animation: 'overlay-pulse 1.5s infinite ease-in-out'
          }}></div>
        </div>
        <h3 style={{ color: '#333', marginTop: '15px' }}>Loading your workspace...</h3>
        <style jsx="true">{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes overlay-pulse {
            0% { opacity: 0.1; }
            50% { opacity: 0.3; }
            100% { opacity: 0.1; }
          }
        `}</style>
      </div>
    );
  }
  
  return <Outlet />;
}

// Main App Router Component that uses Context
function AppRouter() {
  const context = useContext(ConfigContext);
  
  
  
  // Force logout function for debugging
  window.forceLogout = () => {
    
    if (context && context.handleLogout) {
      context.handleLogout();
    } else {
      localStorage.clear();
    }
    window.location.reload();
  };
  
  // Create stable router configuration
  const router = useMemo(() => {
    return createBrowserRouter([
      {
        path: "/",
        element: <ProtectedRoute />,
        errorElement: <Page404 />,
        children: routes
      },
      {
        path: "/auth",
        element: <PublicRoute />,
        children: [
          { path: "login", element: <Login /> },
    
          { path: "set-password", element: <SetPassword /> },
          { path: "first-admin-signup", element: <FirstUserSignup /> } // Add the new route
        ]
      },
      {
        path: "/Login",
        element: <PublicRoute />,
        children: [
          { index: true, element: <Login /> }
        ]
      },
     
      {
        path: "/SetPassword",
        element: <PublicRoute />,
        children: [
          { index: true, element: <SetPassword /> }
        ]
      },
      {
        path: "/FirstUserSignup", // Add direct access route
        element: <PublicRoute />,
        children: [
          { index: true, element: <FirstUserSignup /> }
        ]
      },
      {
        path: "*",
        element: <Navigate to="/Login" replace />
      }
    ]);
  }, []); // Empty dependency array makes this stable
  
  return (
    <div style={{ minHeight: '100vh' }}>
      <RouterProvider router={router} />
      <ToastContainer 
        position="bottom-left"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <AppRouter />
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;