import React, { useEffect } from 'react';
import './SessionExpiredModal.css';

const SessionExpiredModal = ({ onClose }) => {
  const handleLogin = () => {
    // Clear any auth tokens and user data
    localStorage.removeItem('token');
    localStorage.removeItem('lead_crm_token');
    localStorage.removeItem('lead_crm_user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_info');
    
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('lead_crm_token');
    sessionStorage.removeItem('lead_crm_user');
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('user_info');
    
    // Close the modal
    onClose();
    
    // Redirect to login page using window.location instead of navigate
    window.location.href = '/login';
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    // Also close on clicking outside the modal
    const handleClickOutside = (event) => {
      if (event.target.classList.contains('modal')) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    document.addEventListener('click', handleClickOutside);
    
    // Focus the modal for accessibility
    document.activeElement.blur();
    
    // Ensure modal is visible
    document.body.style.overflow = 'hidden';
    
    // Add class to body to prevent scrolling
    document.body.classList.add('modal-open');
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  return (
    <div 
      className="modal-backdrop show" 
      style={{ 
        display: 'block', 
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 999999,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        className="modal show" 
        style={{ 
          display: 'block',
          zIndex: 1000000,
          transform: 'scale(1)',
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
          opacity: 1,
          pointerEvents: 'auto'
        }} 
        tabIndex="-1"
        role="dialog"
        aria-labelledby="sessionExpiredModalLabel"
        aria-modal="true"
      >
        <div 
          className="modal-dialog modal-dialog-centered" 
          style={{ maxWidth: '480px' }}
        >
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-header bg-gradient-danger text-white border-0 position-relative" 
                 style={{ 
                   background: 'linear-gradient(135deg, #dc3545 0%, #a71d2a 100%)',
                   padding: '1.75rem'
                 }}>
              <div className="text-center w-100">
                
                <h4 className="modal-title fw-bold mb-0" id="sessionExpiredModalLabel">
                  Session Expired
                </h4>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white position-absolute end-0 top-0 m-3" 
                onClick={onClose} 
                aria-label="Close"
                style={{ filter: 'invert(1)' }}
              ></button>
            </div>
            <div className="modal-body text-center py-4 px-4">
              <div className="mb-3">
                <div className="avatar-lg mx-auto mb-3">
                  <div className="avatar-title bg-light-subtle text-danger rounded-circle" style={{ width: '4.5rem', height: '4.5rem' }}>
                    <i className="ri-alert-line ri-2x"></i>
                  </div>
                </div>
              </div>
              <h5 className="mb-2">Your Session Has Expired</h5>
              <p className="text-muted mb-0">
                For security reasons, you have been automatically logged out. Please log in again to continue.
              </p>
            </div>
            <div className="modal-footer border-0 justify-content-center py-3 bg-light bg-opacity-50">
              <button 
                type="button" 
                className="btn btn-outline-secondary me-3 rounded-pill px-4 py-2"
                onClick={onClose}
                style={{ minWidth: '100px' }}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn btn-primary rounded-pill px-4 py-2 d-flex align-items-center"
                onClick={handleLogin}
                style={{ minWidth: '160px' }}
              >
                <i className="ri-login-box-line me-2"></i>
                Log In Again
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-open {
          padding-right: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default SessionExpiredModal;