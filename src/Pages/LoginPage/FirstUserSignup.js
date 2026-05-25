import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ConfigContext } from "../../Context/ConfigContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const FirstUserSignup = () => {
  const navigate = useNavigate();
  const context = useContext(ConfigContext);
  
  // Set document title for first user signup page
  useDocumentTitle("First Admin Signup");
  
  // Get the API URL from context
  const { leadCrmApiURL } = context || { leadCrmApiURL: process.env.REACT_APP_SERVER_URL + "/api/v1" };
  
  // States for the two-step process
  const [step, setStep] = useState(1); // 1 for secret code, 2 for signup form
  const [secretCode, setSecretCode] = useState("");
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Initialize particles effect
  React.useEffect(() => {
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
  
  // Handle secret code submission
  const handleSecretCodeSubmit = (e) => {
    e.preventDefault();
    
    if (!secretCode.trim()) {
      setError("Please enter the secret code");
      return;
    }
    
    // Validate secret code
    if (secretCode === "IpshopyTask2025") {
      setStep(2);
      setError("");
    } else {
      setError("Invalid secret code. Please try again.");
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError("");
  };

  // Handle signup form submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    if (!formData.email.trim()) {
      setError("Please enter your email");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (!formData.password) {
      setError("Please enter a password");
      return;
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Make API call to create first admin user
      const response = await fetch(`${leadCrmApiURL}/auth/first-admin-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include', // Include credentials for cookie handling
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "ADMIN"
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Admin user created successfully!");
        
        // Handle authentication like regular login
        // The server already set the authToken cookie, so we just need to update the context
        if (context && context.handleLeadCrmLogin && data.data) {
          const { user, token, redirectTo } = data.data;
          context.handleLeadCrmLogin(user, token, redirectTo);
        }
        
        // Redirect to dashboard (use replace to prevent going back to signup)
        navigate("/dashboard", { replace: true });
      } else {
        setError(data.message || "Failed to create admin user");
      }
    } catch (err) {
      
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
                <p className="mt-3 fs-15 fw-medium">Ipshopy Workspace</p>
              </div>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6 col-xl-5">
              <div className="card mt-4">
                <div className="card-body p-4">
                  <div className="text-center mt-2">
                    <h5 className="text-primary">
                      {step === 1 ? "First Admin Setup" : "Create Admin Account"}
                    </h5>
                    <p className="text-muted">
                      {step === 1 
                        ? "Enter the secret code to proceed with admin setup" 
                        : "Create your admin account"}
                    </p>
                  </div>

                  <div className="p-2 mt-4">
                    {step === 1 ? (
                      // Secret Code Form
                      <form onSubmit={handleSecretCodeSubmit}>
                        <div className="mb-3">
                          <label htmlFor="secretCode" className="form-label">
                            Ip Workspace Code
                          </label>
                          <div className="position-relative auth-pass-inputgroup">
                            <input
                              type={showSecretCode ? "text" : "password"}
                              className="form-control pe-5"
                              id="secretCode"
                              placeholder="Enter Ip code"
                              value={secretCode}
                              onChange={(e) => setSecretCode(e.target.value)}
                              autoFocus
                            />
                            <button
                              className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                              type="button"
                              onClick={() => setShowSecretCode(!showSecretCode)}
                            >
                              <i className={`ri-${showSecretCode ? 'eye-off' : 'eye'}-line`}></i>
                            </button>
                          </div>
                        </div>

                        {error && (
                          <div className="alert alert-danger" role="alert">
                            {error}
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
                                Validating...
                              </>
                            ) : (
                              'Validate Code'
                            )}
                          </button>
                        </div>
                        
                        <div className="mt-4 text-center">
                          <p className="mb-0">
                            <a href="/Login" className="fw-semibold text-primary ">
                             
                              Back to Login
                            </a>
                          </p>
                        </div>
                      </form>
                    ) : (
                      // Signup Form
                      <form onSubmit={handleSignupSubmit}>
                        <div className="mb-3">
                          <label htmlFor="name" className="form-label">
                            Full Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleInputChange}
                            autoFocus
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="email" className="form-label">
                            Email Address
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            placeholder="Enter your email address"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label" htmlFor="password">
                            Password
                          </label>
                          <div className="position-relative auth-pass-inputgroup">
                            <input
                              type={showPassword ? "text" : "password"}
                              className="form-control pe-5"
                              id="password"
                              name="password"
                              placeholder="Enter your password"
                              value={formData.password}
                              onChange={handleInputChange}
                            />
                            <button
                              className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              <i className={`ri-${showPassword ? 'eye-off' : 'eye'}-line`}></i>
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label" htmlFor="confirmPassword">
                            Confirm Password
                          </label>
                          <div className="position-relative auth-pass-inputgroup">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              className="form-control pe-5"
                              id="confirmPassword"
                              name="confirmPassword"
                              placeholder="Confirm your password"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                            />
                            <button
                              className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              <i className={`ri-${showConfirmPassword ? 'eye-off' : 'eye'}-line`}></i>
                            </button>
                          </div>
                        </div>

                        {error && (
                          <div className="alert alert-danger" role="alert">
                            {error}
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
                                Creating Account...
                              </>
                            ) : (
                              'Create Admin Account'
                            )}
                          </button>
                        </div>
                        
                        <div className="mt-4 text-center">
                          <button 
                            type="button" 
                            className="btn btn-link"
                            onClick={() => setStep(1)}
                          >
                            Back to Secret Code
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
      
     <footer className="footer" style={{ backgroundColor: "transparent" }}>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
               <div className="text-center" style={{ marginRight: "16rem" }}>
                <p className="mb-0 text-muted">
                  &copy; {new Date().getFullYear()} Ipshopy Workspace. Developed by <a href="https://webjerry.rf.gd/" target="_blank" rel="noopener noreferrer"style={{ cursor: 'pointer' }}>webjerry ∵</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default FirstUserSignup;