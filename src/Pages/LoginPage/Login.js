import React, { useContext, useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import withRouter from "../../Utils/withRouter";
import { ConfigContext } from "../../Context/ConfigContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { toast } from 'react-toastify';

const Login = () => {
  const context = useContext(ConfigContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authStep, setAuthStep] = useState('email'); // 'email' | 'password' | 'set-password'
  const [userInfo, setUserInfo] = useState(null);
  
  // Initialize particles effect
  useEffect(() => {
    // Check if particlesJS is available and element exists
    const initParticles = () => {
      if (typeof window.particlesJS !== 'undefined' && document.getElementById('auth-particles')) {
        window.particlesJS("auth-particles", {
          particles: {
            number: {
              value: 19,
              density: {
                enable: true,
                value_area: 300
              }
            },
            color: {
              value: "#ffffff"
            },
            shape: {
              type: "star",
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
  
  // Set document title for login page
  useDocumentTitle(" ipshopy workspace");
  
  // All hooks must be called before any conditional returns
  useEffect(() => {
    setErrorMessage("");
  }, [email, password]);
  
  // Check for session expiration message on page load
  useEffect(() => {
    console.log('🔍 Checking for session expiration message...');
    const sessionExpiredMessage = sessionStorage.getItem('session_expired_message');
    console.log('Session expired message found:', sessionExpiredMessage);
    
    if (sessionExpiredMessage) {
      console.log('Setting error message:', sessionExpiredMessage);
      
      // Show toast notification
      toast.error(sessionExpiredMessage, {
        position: 'top-center',
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Also set as error message to display in the alert box (lines 507-509)
      setErrorMessage(sessionExpiredMessage);
      
      // Clear the message from sessionStorage so it doesn't show again
      sessionStorage.removeItem('session_expired_message');
      
      console.log('Error message set and sessionStorage cleared');
    }
  }, []);
  
  // Debug logging - always log what we have

  
  // Simplified rendering - always show something
  if (!context) {
    
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
  
  // Show a basic debug screen first
  const debugMode = !context.leadCrmApiURL || !context.handleLeadCrmLogin;
  
  if (debugMode) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <h2>🔧 Debug Mode - Login Component</h2>
        <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>Context Debug Info:</h3>
          <pre>{JSON.stringify({
            hasContext: !!context,
            leadCrmApiURL: context?.leadCrmApiURL,
            hasHandleLeadCrmLogin: !!context?.handleLeadCrmLogin,
            isInitialized: context?.isInitialized,
            contextKeys: context ? Object.keys(context) : 'No context'
          }, null, 2)}</pre>
        </div>
        <button 
          style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }
  
  const { leadCrmApiURL, handleLeadCrmLogin } = context;

  const togglePassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage("Please enter your email address");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const response = await fetch(`${leadCrmApiURL}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUserInfo(data.data.user);
        
        if (data.data.hasPassword) {
          // User exists with password - show password field
          setAuthStep('password');
        } else {
          // User exists but no password set - redirect to set password
          navigate('/SetPassword', {
            state: {
              email: email,
              userData: data.data.user
            }
          });
        }
      } else {
        // User not found
        setErrorMessage(data.message || "No user found with this email address. Please check your email or contact your administrator.");
      }
    } catch (error) {
      
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    
    if (!password.trim()) {
      setErrorMessage("Please enter your password");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${leadCrmApiURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const userData = data.data.user;
        const token = data.data.token;
        const redirectPath = data.data.redirectTo;
        
        
        
        // Store authentication data using Lead CRM handler
        handleLeadCrmLogin(userData, token, redirectPath);
        
        // Clear form
        setEmail("");
        setPassword("");
        setAuthStep('email');
        
       
        
        // Navigate using React Router to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        if (response.status === 423) {
          setErrorMessage(data.message || "Account is locked due to multiple failed login attempts.");
        } else if (response.status === 403) {
          setErrorMessage(data.message || "Account is deactivated.");
        } else {
          setErrorMessage(data.message || "Invalid password. Please try again.");
        }
      }
    } catch (error) {
      
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setErrorMessage("Network error. Please check your connection and try again.");
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToEmail = () => {
    setAuthStep('email');
    setPassword("");
    setErrorMessage("");
    setUserInfo(null);
  };

  return (
    <div className="auth-page-wrapper pt-5 min-vh-100 d-flex flex-column">
      <div 
        className="auth-one-bg-position auth-one-bg" 
        id="auth-particles"
        style={{ 
          backgroundImage: "url('/assets/images/ip-bg.jpg')", 
          backgroundPosition: "center", 
          backgroundSize: "cover" 
        }}
      >
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-primary bg-opacity-75"></div>
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
      
      <div className="auth-page-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="text-center mt-sm-5 mb-4 text-white-50">
                <div className="d-inline-block auth-logo">
                  {/* <img src="/assets/images/ip1.png" alt="" height="80" /> */}
                </div>
                <p className="mt-3 fs-15 fw-medium">ipshopy workspace </p>
              </div>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6 col-xl-5">
              <div className="card mt-4">
                <div className="card-body p-4">
                  <div className="text-center mt-2">
                    {authStep === 'email' ? (
                      <>
                        <h5 className="text-primary">Welcome!</h5>
                        <p className="text-muted">
                          Enter your email address to continue
                        </p>
                      </>
                    ) : (
                      <>
                        {/* Display user profile picture and name */}
                        <div className="d-flex flex-column align-items-center mb-3">
                          <div className="mb-2">
                            <img 
                              src={userInfo?.profile ? `${leadCrmApiURL.replace('/api/v1', '')}/${userInfo.profile}` : "/assets/ip.png"} 
                              alt="Profile" 
                              className="rounded-circle" 
                              style={{ width: '130px', height: '130px', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/assets/ip.png";
                              }}
                            />
                          </div>
                          <h5 className="text-primary">Welcome {userInfo?.name}!</h5>
                        </div>
                       
                      </>
                    )}
                  </div>

                  <div className="p-2 mt-4">
                    {authStep === 'email' ? (
                      <form onSubmit={handleEmailSubmit}>
                        <div className="mb-3">
                          {/* <label htmlFor="email" className="form-label">
                            Email Address
                          </label> */}
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={handleEmailChange}
                            autoComplete="email"
                            autoFocus
                            required
                          />
                        </div>
                        
                        {errorMessage && (
                          <div className="alert alert-danger" role="alert">
                            {errorMessage}
                          </div>
                        )}
                        
          
                        
                        <div className="mt-4">
                          <button
                            className="btn btn-success w-100"
                            type="submit"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Checking...
                              </>
                            ) : (
                              'Continue'
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handlePasswordSubmit}>
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <button
                              type="button"
                              className="btn btn-link p-0 me-2"
                              onClick={handleBackToEmail}
                            >
                              <i className="ri-arrow-left-line"></i>
                            </button>
                            <small className="text-muted">{email}</small>
                          </div>
                          
                          <label className="form-label" htmlFor="password-input">
                            Password
                          </label>
                          <div className="position-relative auth-pass-inputgroup">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="form-control pe-5 password-input"
                              placeholder="Enter your password"
                              id="password-input"
                              value={password}
                              onChange={handlePasswordChange}
                              autoComplete="current-password"
                              autoFocus
                              required
                            />
                            <button
                              className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted password-addon"
                              type="button"
                              onClick={togglePassword}
                            >
                              <i className={`ri-${showPassword ? 'eye-off' : 'eye'}-fill align-middle`}></i>
                            </button>
                          </div>
                        </div>
                        
                        {errorMessage && (
                          <div className="alert alert-danger" role="alert">
                            {errorMessage}
                          </div>
                        )}
                        
                        {/* <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={rememberMe}
                            id="auth-remember-check"
                            onChange={handleRememberMeChange}
                          />
                          <label className="form-check-label" htmlFor="auth-remember-check">
                            Remember me
                          </label>
                        </div> */}
                        
                        <div className="mt-4">
                          <button
                            className="btn btn-success w-100"
                            type="submit"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Signing In...
                              </>
                            ) : (
                              'Sign In'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Add link to First Admin Signup */}
              {/* <div className="mt-4 text-center">
                <p className="mb-0">
                 New setup? Proceed with  {" "}
                  <a href="/FirstUserSignup" className="fw-semibold text-primary ">
                  Admin 
                  </a>
                   {" "}Onboarding
                </p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="footer mt-auto" style={{ backgroundColor: "transparent", position: "relative", left: 0, right: 0, width: "100%", paddingBottom: "20px", height: "auto" }}>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="text-center">
                <p className="mb-0 text-muted">
                  &copy; {new Date().getFullYear()} Ipshopy Workspace. <br className="d-sm-none" /> Developed by <a href="https://webjerry.rf.gd/" target="_blank" rel="noopener noreferrer" style={{ cursor: 'pointer' }}>webjerry ∵</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default withRouter(Login);