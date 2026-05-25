import axios from 'axios';

// Removed SessionExpiredModal import as we're doing automatic logout now

// Function to handle automatic logout on session expiration
const handleAutomaticLogout = () => {
  console.log('Session expired - logging out user');
  
  // Clear all authentication data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('lead_crm_token');
  localStorage.removeItem('lead_crm_user');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_info');
  localStorage.removeItem('user_type');
  localStorage.removeItem('permissions');
  
  // Clear sessionStorage as well
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('lead_crm_token');
  sessionStorage.removeItem('lead_crm_user');
  sessionStorage.removeItem('user_role');
  sessionStorage.removeItem('user_info');
  
  // Store message to show on login page
  const message = 'Your session has expired. Please login again.';
  sessionStorage.setItem('session_expired_message', message);
  console.log('✅ Session expired message stored:', message);
  
  // Redirect to login page
  console.log('🔄 Redirecting to login page...');
  window.location.href = '/login';
};

// Setup axios response interceptor
const setupAxiosInterceptors = () => {
  console.log('🔒 Setting up axios interceptors for automatic logout on token expiration...');
  
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      console.log('🚨 Axios error intercepted:', error);
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      
      // Check if error is due to token expiration (401 Unauthorized) or forbidden access (403)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('401 or 403 error detected');
        console.log('Response headers:', error.response.headers);
        console.log('Response status text:', error.response.statusText);
        
        // Check if error message indicates token expiration or authentication issues
        // Handle multiple possible response structures
        const responseData = error.response.data;
        let errorMessage = '';
        
        console.log('Raw response data:', responseData);
        console.log('Response data type:', typeof responseData);
        
        // Try different possible response structures
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (responseData?.msg) {
          errorMessage = responseData.msg;
        } else if (typeof responseData === 'object' && responseData !== null) {
          // Try to stringify the object to search for keywords
          const stringified = JSON.stringify(responseData).toLowerCase();
          if (stringified.includes('no token') || stringified.includes('access denied')) {
            errorMessage = responseData.message || responseData.error || JSON.stringify(responseData);
          } else {
            errorMessage = error.response.statusText || '';
          }
        } else {
          errorMessage = error.response.statusText || '';
        }
        
        const lowerCaseMessage = (errorMessage || '').toLowerCase();
        
        console.log('Extracted error message:', errorMessage);
        console.log('Lowercase message:', lowerCaseMessage);
        
        // Debug: Check each keyword individually
        console.log('Keyword checks:');
        console.log('  - includes "no token":', lowerCaseMessage.includes('no token'));
        console.log('  - includes "access denied":', lowerCaseMessage.includes('access denied'));
        console.log('  - includes "expired":', lowerCaseMessage.includes('expired'));
        console.log('  - includes "authentication":', lowerCaseMessage.includes('authentication'));
        
        // Check for common session expiration indicators (EXPANDED LIST)
        const isSessionExpired = (
          lowerCaseMessage.includes('expired') || 
          lowerCaseMessage.includes('invalid token') ||
          lowerCaseMessage.includes('jwt expired') ||
          lowerCaseMessage.includes('not authenticated') ||
          lowerCaseMessage.includes('token required') ||
          lowerCaseMessage.includes('unauthorized') ||
          lowerCaseMessage.includes('forbidden') ||
          lowerCaseMessage.includes('access denied') ||
          lowerCaseMessage.includes('session') ||
          lowerCaseMessage.includes('authentication') ||
          lowerCaseMessage.includes('logged out') ||
          lowerCaseMessage.includes('no token') ||
          lowerCaseMessage.includes('user not found') ||
          lowerCaseMessage.includes('account deactiv') ||
          lowerCaseMessage.includes('access deni')
        );
        
        // Also check status text for common indicators
        const statusText = (error.response.statusText || '').toLowerCase();
        const isStatusSessionRelated = (
          statusText.includes('unauthorized') ||
          statusText.includes('forbidden') ||
          statusText.includes('authentication')
        );
        
        // Additional check for missing token scenarios
        const isTokenMissing = !localStorage.getItem('token') && !sessionStorage.getItem('token');
        
        console.log('Session expired checks:', {
          isSessionExpired,
          isStatusSessionRelated,
          isTokenMissing,
          statusCode: error.response.status
        });
        
        console.log('Final decision:', isSessionExpired || isStatusSessionRelated || isTokenMissing || error.response.status === 401);
        
        if (isSessionExpired || isStatusSessionRelated || isTokenMissing || error.response.status === 401) {
          console.log('Session expired detected - logging out user');
          // Automatic logout instead of showing modal
          handleAutomaticLogout();
          return Promise.reject(error);
        }
      }
      
      // Also check for network errors that might indicate session issues
      if (!error.response && error.request) {
        // Network error - might be due to session issues
        console.warn('Network error detected, possibly due to session expiration:', error.message);
        // Automatic logout for network errors as well
        handleAutomaticLogout();
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;