import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ConfigContext } from '../../Context/ConfigContext';
import { toast } from 'react-toastify';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SetPassword = () => {
  const { leadCrmApiURL, handleLeadCrmLogin } = useContext(ConfigContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState("");

  // Set document title for set password page
  useDocumentTitle("Set Password");
  
  // Initialize particles effect
  useEffect(() => {
    // Check if particlesJS is available and element exists
    const initParticles = () => {
      if (typeof window.particlesJS !== 'undefined' && document.getElementById('auth-particles')) {
        window.particlesJS("auth-particles", {
          particles: {
            number: {
              value: 90,
              density: {
                enable: true,
                value_area: 800
              }
            },
            color: {
              value: "#ffffff"
            },
            shape: {
              type: "circle",
              stroke: {
                width: 0,
                color: "#000000"
              },
              polygon: {
                nb_sides: 5
              },
              image: {
                src: "img/github.svg",
                width: 100,
                height: 100
              }
            },
            opacity: {
              value: 0.8,
              random: true,
              anim: {
                enable: true,
                speed: 1,
                opacity_min: 0,
                sync: false
              }
            },
            size: {
              value: 4,
              random: true,
              anim: {
                enable: false,
                speed: 4,
                size_min: 0.2,
                sync: false
              }
            },
            line_linked: {
              enable: false,
              distance: 150,
              color: "#ffffff",
              opacity: 0.4,
              width: 1
            },
            move: {
              enable: true,
              speed: 2,
              direction: "none",
              random: false,
              straight: false,
              out_mode: "out",
              attract: {
                enable: false,
                rotateX: 600,
                rotateY: 1200
              }
            }
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: {
                enable: true,
                mode: "bubble"
              },
              onclick: {
                enable: true,
                mode: "repulse"
              },
              resize: true
            },
            modes: {
              grab: {
                distance: 400,
                line_linked: {
                  opacity: 1
                }
              },
              bubble: {
                distance: 400,
                size: 4,
                duration: 2,
                opacity: 0.8,
                speed: 3
              },
              repulse: {
                distance: 200
              },
              push: {
                particles_nb: 4
              },
              remove: {
                particles_nb: 2
              }
            }
          },
          retina_detect: true,
          config_demo: {
            hide_card: false,
            background_color: "#b61924",
            background_image: "",
            background_position: "50% 50%",
            background_repeat: "no-repeat",
            background_size: "cover"
          }
        });
      }
    };
    
    // Initialize particles with a small delay to ensure DOM is ready
    const timer = setTimeout(initParticles, 100);
    
    // Cleanup function to destroy particles when component unmounts
    return () => {
      clearTimeout(timer);
      if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
      }
    };
  }, []);

  useEffect(() => {
    // Get email from navigation state or URL params
    const email = location.state?.email || new URLSearchParams(location.search).get('email');
    const userData = location.state?.userData;
    
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
    
    if (userData) {
      setUserInfo(userData);
    }
    
    if (!email) {
      // If no email provided, redirect to login
      navigate('/Login');
    }
  }, [location, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    if (password.length < minLength) errors.push(`At least ${minLength} characters`);
    if (!hasUpperCase) errors.push('One uppercase letter');
    if (!hasLowerCase) errors.push('One lowercase letter');
    if (!hasNumbers) errors.push('One number');
    if (!hasSpecialChar) errors.push('One special character');
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Validate password strength
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      toast.error(`Password must contain: ${passwordErrors.join(', ')}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${leadCrmApiURL}/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Password set successfully! Logging you in...');
        
        // Auto-login after password is set
        const userData = data.data.user;
        const token = data.data.token;
        const redirectPath = data.data.redirectTo;
        
        // Store authentication data
        handleLeadCrmLogin(userData, token, redirectPath);
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate(redirectPath || '/dashboard');
        }, 1500);
        
      } else {
        toast.error(data.message || 'Failed to set password');
      }
    } catch (error) {
      console.error('Error setting password:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    const errors = validatePassword(password);
    if (!password) return { strength: 0, text: '', color: '' };
    
    const strength = Math.max(0, 5 - errors.length);
    const strengthTexts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['danger', 'warning', 'info', 'success', 'success'];
    
    return {
      strength: (strength / 4) * 100,
      text: strengthTexts[strength - 1] || 'Very Weak',
      color: strengthColors[strength - 1] || 'danger'
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <>
      <div className="auth-page-wrapper pt-5">
        <div 
        className="auth-one-bg-position auth-one-bg" 
        id="auth-particles"
        style={{ 
          backgroundImage: "url('/assets/images/ip-bg.jpg')", 
          backgroundPosition: "center", 
          backgroundSize: "cover" 
        }}
      >
          <div className="bg-overlay"></div>
          <div className="shape">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 1440 120"
            >
              <path d="M 0,36 C 144,53.6 432,123.2 720,124 C 1008,124.8 1296,56.8 1440,40L1440 140L0 140z"></path>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="auth-page-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="text-center mt-sm-5 mb-4 text-white-50">
                <div className="d-inline-block auth-logo">
                  <img src="assets/images/car7-Logo.png" alt="" height="80" />
                </div>
                <p className="mt-3 fs-15 fw-medium">ipshopy workspace</p>
              </div>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6 col-xl-5">
              <div className="card mt-4">
                <div className="card-body p-4">
                  <div className="text-center mt-2">
                    {/* Display user profile picture and name */}
                    <div className="d-flex flex-column align-items-center mb-3">
                      <div className="mb-2">
                        <img 
                          src={userInfo?.profile ? `${leadCrmApiURL.replace('/api/v1', '')}/${userInfo.profile}` : "/assets/ip.png"} 
                          alt="Profile" 
                          className="rounded-circle" 
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/assets/ip.png";
                          }}
                        />
                      </div>
                      <h5 className="text-primary">Welcome {userInfo?.name || 'ipshopy user'}!</h5>
                    </div>
                    {/* <p className="text-muted">
                      Set your password to complete your account setup
                    </p> */}
                  </div>

                  {userInfo && (
                    <div className="alert alert-info" role="alert">
                      <div className="d-flex">
                        <div className="flex-shrink-0">
                          <i className="ri-information-line"></i>
                        </div>
                        <div className="flex-grow-1 ms-2">
                         
                          <small>Hello, <b>{userInfo?.name || 'ipshopy user'} </b>greetings from <b>Ipshopy Team </b></small>
                          <small>your role is {userInfo.role} to continue onboarding please complete you account setup</small>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-2 mt-4">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Your email address"
                          disabled
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                          New Password <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative auth-pass-inputgroup">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-control pe-5 password-input"
                            placeholder="Create a strong password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                          />
                          <button
                            className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <i className={`ri-${showPassword ? 'eye-off' : 'eye'}-fill align-middle`}></i>
                          </button>
                        </div>
                        
                        {formData.password && (
                          <div className="mt-2">
                            <div className="progress" style={{ height: '6px' }}>
                              <div
                                className={`progress-bar bg-${passwordStrength.color}`}
                                role="progressbar"
                                style={{ width: `${passwordStrength.strength}%` }}
                                aria-valuenow={passwordStrength.strength}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                            <small className={`text-${passwordStrength.color}`}>
                              {passwordStrength.text}
                            </small>
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">
                          Confirm Password <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative auth-pass-inputgroup">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="form-control pe-5"
                            placeholder="Confirm your password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                          />
                          <button
                            className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            <i className={`ri-${showConfirmPassword ? 'eye-off' : 'eye'}-fill align-middle`}></i>
                          </button>
                        </div>
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                          <small className="text-danger">Passwords do not match</small>
                        )}
                      </div>


                      <div className="mt-4">
                        <button
                          className="btn btn-success w-100"
                          type="submit"
                          disabled={isLoading || formData.password !== formData.confirmPassword}
                        >
                          {isLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Setting Password...
                            </>
                          ) : (
                            'Set Password & Login'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="mb-0 text-white-50">
                  Need help? Contact your administrator or{' '}
                  <button
                    className="fw-semibold text-primary text-decoration-underline btn btn-link p-0"
                    onClick={() => navigate('/Login')}
                  >
                    Return to Login
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetPassword;