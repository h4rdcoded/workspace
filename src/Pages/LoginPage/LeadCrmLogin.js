import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigContext } from '../../Context/ConfigContext';
import Swal from 'sweetalert2';

function LeadCrmLogin() {
  const navigate = useNavigate();
  const { leadCrmApiURL, handleLeadCrmLogin } = useContext(ConfigContext);
  
  const [currentStep, setCurrentStep] = useState('email'); // 'email', 'setPassword', 'login'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [userInfo, setUserInfo] = useState(null);
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  // Check email existence
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    if (!validateEmail(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${leadCrmApiURL}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (data.success) {
        setUserInfo(data.data);
        
        if (!data.data.passwordSet) {
          setCurrentStep('setPassword');
        } else {
          setCurrentStep('login');
        }
      } else {
        setErrors({ email: data.message });
      }
    } catch (error) {
      
      setErrors({ email: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Set password for first-time users
  const handleSetPassword = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${leadCrmApiURL}/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Password Set Successfully!',
          text: 'You can now login with your credentials.',
          confirmButtonText: 'Login Now'
        });
        
        setCurrentStep('login');
        setFormData(prev => ({ ...prev, confirmPassword: '' }));
      } else {
        setErrors({ general: data.message });
      }
    } catch (error) {

      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.password) {
      setErrors({ password: 'Password is required' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${leadCrmApiURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        const redirectPath = handleLeadCrmLogin(data.data.user, data.data.token, data.data.redirectTo);
        
        await Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: `Welcome back, ${data.data.user.name}`,
          timer: 1500,
          showConfirmButton: false
        });
        
        navigate(redirectPath || '/dashboard');
      } else {
        if (response.status === 423) {
          setErrors({ general: data.message });
        } else {
          setErrors({ password: data.message });
        }
      }
    } catch (error) {
      
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setCurrentStep('email');
    setFormData({ email: '', password: '', confirmPassword: '' });
    setUserInfo(null);
    setErrors({});
  };

  return (
    <div className="auth-page-wrapper py-5 d-flex justify-content-center align-items-center min-vh-100\">
      <div className="auth-page-content overflow-hidden pt-lg-5\">
        <div className="container\">
          <div className="row\">
            <div className="col-lg-12\">
              <div className="card overflow-hidden\">
                <div className="row g-0\">
                  {/* Left side - Branding */}
                  <div className="col-lg-6\">
                    <div 
                       className="p-lg-5 p-4 auth-one-bg h-100"
                       style={{ 
                         backgroundImage: "url('/assets/images/ip-bg.jpg')", 
                         backgroundPosition: "center", 
                         backgroundSize: "cover" 
                       }}
                     >
                      <div className="bg-overlay\"></div>
                      <div className="position-relative h-100 d-flex flex-column\">
                        <div className="mb-4\">
                          <h3 className="text-white mb-1\">Lead Management CRM</h3>
                          <p className="text-white-75\">Professional lead processing and management system</p>
                        </div>
                        <div className="mt-auto\">
                          <div className="mb-3\">
                            <i className="ri-double-quotes-l display-4 text-success\"></i>
                          </div>
                          <div id="qoutescarouselIndicators\" className="carousel slide\" data-bs-ride="carousel\">
                            <div className="carousel-inner text-white-50\">
                              <div className="carousel-item active\">
                                <div className="qoutes-content\">
                                  <p className="fs-15 fst-italic\">\"Streamline your lead management process with our three-level role-based system. From import to conversion, manage your leads efficiently.\"</p>
                                  <h6 className="text-white mb-0\">- Lead CRM Team</h6>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Login Form */}
                  <div className="col-lg-6\">
                    <div className="p-lg-5 p-4\">
                      <div>
                        <h5 className="text-primary mb-3\">
                          {currentStep === 'email' && 'Welcome to Lead CRM'}
                          {currentStep === 'setPassword' && 'Set Your Password'}
                          {currentStep === 'login' && 'Enter Your Password'}
                        </h5>
                        <p className="text-muted\">
                          {currentStep === 'email' && 'Enter your email to get started'}
                          {currentStep === 'setPassword' && 'Create a secure password for your account'}
                          {currentStep === 'login' && `Welcome back, ${userInfo?.name || 'User'}`}
                        </p>
                      </div>

                      <div className="mt-4\">
                        {/* Email Step */}
                        {currentStep === 'email' && (
                          <form onSubmit={handleEmailSubmit}>
                            <div className="mb-3\">
                              <label htmlFor="email\" className="form-label\">Email Address</label>
                              <input
                                type="email\"
                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                id="email\"
                                name="email\"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email\"
                                disabled={loading}
                              />
                              {errors.email && (
                                <div className="invalid-feedback\">{errors.email}</div>
                              )}
                            </div>

                            <div className="mt-4\">
                              <button
                                className="btn btn-success w-100\"
                                type="submit\"
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2\" role="status\" aria-hidden="true\"></span>
                                    Checking...
                                  </>
                                ) : (
                                  'Continue'
                                )}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Set Password Step */}
                        {currentStep === 'setPassword' && (
                          <form onSubmit={handleSetPassword}>
                            <div className="mb-3\">
                              <label className="form-label\">Email</label>
                              <div className="input-group\">
                                <input
                                  type="email\"
                                  className="form-control\"
                                  value={formData.email}
                                  disabled
                                />
                                <button
                                  type="button\"
                                  className="btn btn-outline-secondary\"
                                  onClick={handleReset}
                                >
                                  <i className="ri-edit-line\"></i>
                                </button>
                              </div>
                            </div>

                            <div className="mb-3\">
                              <label htmlFor="password\" className="form-label\">New Password</label>
                              <input
                                type="password\"
                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                id="password\"
                                name="password\"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Create a strong password\"
                                disabled={loading}
                              />
                              {errors.password && (
                                <div className="invalid-feedback\">{errors.password}</div>
                              )}
                              <div className="form-text\">
                                Password must be at least 8 characters with uppercase, lowercase, and numbers.
                              </div>
                            </div>

                            <div className="mb-3\">
                              <label htmlFor="confirmPassword\" className="form-label\">Confirm Password</label>
                              <input
                                type="password\"
                                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                id="confirmPassword\"
                                name="confirmPassword\"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Confirm your password\"
                                disabled={loading}
                              />
                              {errors.confirmPassword && (
                                <div className="invalid-feedback\">{errors.confirmPassword}</div>
                              )}
                            </div>

                            {errors.general && (
                              <div className="alert alert-danger\" role="alert\">
                                {errors.general}
                              </div>
                            )}

                            <div className="mt-4\">
                              <button
                                className="btn btn-success w-100\"
                                type="submit\"
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2\" role="status\" aria-hidden="true\"></span>
                                    Setting Password...
                                  </>
                                ) : (
                                  'Set Password'
                                )}
                              </button>
                            </div>

                            <div className="mt-3\">
                              <button
                                type="button\"
                                className="btn btn-link w-100\"
                                onClick={handleReset}
                                disabled={loading}
                              >
                                <i className="ri-arrow-left-line me-1\"></i>
                                Back to Email
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Login Step */}
                        {currentStep === 'login' && (
                          <form onSubmit={handleLogin}>
                            <div className="mb-3\">
                              <label className="form-label\">Email</label>
                              <div className="input-group\">
                                <input
                                  type="email\"
                                  className="form-control\"
                                  value={formData.email}
                                  disabled
                                />
                                <button
                                  type="button\"
                                  className="btn btn-outline-secondary\"
                                  onClick={handleReset}
                                >
                                  <i className="ri-edit-line\"></i>
                                </button>
                              </div>
                            </div>

                            {userInfo && (
                              <div className="mb-3\">
                                <div className="alert alert-info\" role="alert\">
                                  <i className="ri-information-line me-2\"></i>
                                  Role: <strong>{userInfo.role}</strong>
                                </div>
                              </div>
                            )}

                            <div className="mb-3\">
                              <label htmlFor="loginPassword\" className="form-label\">Password</label>
                              <input
                                type="password\"
                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                id="loginPassword\"
                                name="password\"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter your password\"
                                disabled={loading}
                              />
                              {errors.password && (
                                <div className="invalid-feedback\">{errors.password}</div>
                              )}
                            </div>

                            {errors.general && (
                              <div className="alert alert-danger\" role="alert\">
                                <i className="ri-error-warning-line me-2\"></i>
                                {errors.general}
                              </div>
                            )}

                            <div className="mt-4\">
                              <button
                                className="btn btn-success w-100\"
                                type="submit\"
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2\" role="status\" aria-hidden="true\"></span>
                                    Signing In...
                                  </>
                                ) : (
                                  'Sign In'
                                )}
                              </button>
                            </div>

                            <div className="mt-3\">
                              <button
                                type="button\"
                                className="btn btn-link w-100\"
                                onClick={handleReset}
                                disabled={loading}
                              >
                                <i className="ri-arrow-left-line me-1\"></i>
                                Back to Email
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeadCrmLogin;