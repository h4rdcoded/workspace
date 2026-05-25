import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ConfigContext } from '../../Context/ConfigContext';

function UpdateProfile() {
  const navigate = useNavigate();
  const { leadCrmApiURL, staticFilesBaseURL, getCurrentUser, isLeadCrmAuthenticated } = useContext(ConfigContext);
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: ''
  });
  
  // Password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const currentUser = getCurrentUser();
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLeadCrmAuthenticated || !currentUser) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const token = localStorage.getItem('lead_crm_token');
        
        const response = await fetch(`${leadCrmApiURL}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.user) {
            const user = data.data.user;
            setUserData(user);
            setFormData({
              name: user.name || '',
              email: user.email || '',
              mobile: user.mobile || ''
            });
          } else {
            setError('Failed to load user data');
          }
        } else {
          setError('Failed to fetch user profile');
        }
      } catch (err) {
        
        setError('Error loading profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [leadCrmApiURL, isLeadCrmAuthenticated, currentUser]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };
  
  const handleCoverImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Check if user is EXEC and block profile updates (but allow TL to edit)
    if (userData && userData.role === 'EXEC') {
      toast.error('Profile updates are restricted for your role. Please contact administrator.');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setUpdating(true);
      const token = localStorage.getItem('lead_crm_token');
      
      // If we have profile or cover image to upload, we need to use FormData
      if (profileImage || coverImage) {
        const formDataWithFiles = new FormData();
        formDataWithFiles.append('name', formData.name);
        formDataWithFiles.append('email', formData.email);
        formDataWithFiles.append('mobile', formData.mobile || '');
        
        if (profileImage) {
          formDataWithFiles.append('profileImage', profileImage);
        }
        
        if (coverImage) {
          formDataWithFiles.append('coverImage', coverImage);
        }
        
        const response = await fetch(`${leadCrmApiURL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataWithFiles
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          toast.success('Profile updated successfully!');
          
          // Update local user data
          if (data.data && data.data.user) {
            setUserData(data.data.user);
          }
          
          // Clear image states
          setProfileImage(null);
          setCoverImage(null);
          
          // Optionally redirect to profile view
          setTimeout(() => {
            navigate('/UserProfile');
          }, 1500);
        } else {
          toast.error(data.message || 'Failed to update profile');
        }
      } else {
        // No images to upload, use regular JSON
        const response = await fetch(`${leadCrmApiURL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          toast.success('Profile updated successfully!');
          
          // Update local user data
          if (data.data && data.data.user) {
            setUserData(data.data.user);
          }
          
          // Optionally redirect to profile view
          setTimeout(() => {
            navigate('/UserProfile');
          }, 1500);
        } else {
          toast.error(data.message || 'Failed to update profile');
        }
      }
    } catch (error) {
      
      toast.error('Error updating profile');
    } finally {
      setUpdating(false);
    }
  };
  
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    if (!passwordData.newPassword) {
      toast.error('New password is required');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    try {
      setChangingPassword(true);
      const token = localStorage.getItem('lead_crm_token');
      
      const response = await fetch(`${leadCrmApiURL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      
      toast.error('Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };
  
  const calculateProfileCompletion = (user) => {
    if (!user) return 0;
    let completed = 0;
    const total = 6;
    
    if (user.name) completed++;
    if (user.email) completed++;
    if (user.mobile) completed++;
    if (user.role) completed++;
    if (user.isActive !== undefined) completed++;
    if (user.createdAt) completed++;
    
    return Math.round((completed / total) * 100);
  };
  
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-danger';
  };
  
  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'ADMIN': return 'Administrator';
      case 'TL': return 'Team Leader';
      case 'EXEC': return 'Employee';
      default: return role || 'User';
    }
  };
  
  if (loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="card border-danger">
                  <div className="card-body text-center">
                    <i className="ri-error-warning-line text-danger" style={{fontSize: '3rem'}}></i>
                    <h4 className="card-title text-danger mt-3">Error Loading Profile</h4>
                    <p className="text-muted">{error}</p>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => window.location.reload()}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="card">
                  <div className="card-body text-center">
                    <i className="ri-user-line" style={{fontSize: '3rem'}}></i>
                    <h4 className="card-title mt-3">No Profile Data</h4>
                    <p className="text-muted">No user data available to edit.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const profileCompletion = calculateProfileCompletion(userData);
  const isEmployeeOnly = userData && userData.role === 'EXEC';

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          {/* Background */}
          <div className="position-relative mx-n4 mt-n4">
            <div className="profile-wid-bg profile-setting-img">
              <img src="/assets/images/auth-one-bg.jpg" className="profile-wid-img" alt="" />
              <div className="overlay-content">
                <div className="text-end p-3">
                  <div className="p-0 ms-auto rounded-circle profile-photo-edit">
                    <input 
                      id="profile-foreground-img-file-input" 
                      type="file" 
                      className="profile-foreground-img-file-input" 
                      accept="image/*"
                      onChange={handleCoverImageChange}
                    />
                    <label htmlFor="profile-foreground-img-file-input" className="profile-photo-edit btn btn-light">
                      <i className="ri-image-edit-line align-bottom me-1" /> Change Cover
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            {/* Sidebar */}
            <div className="col-xxl-3">
              <div className="card mt-n5">
                <div className="card-body p-4">
                  <div className="text-center">
                    <div className="profile-user position-relative d-inline-block mx-auto mb-4">
                      <img 
                        src={profileImage ? URL.createObjectURL(profileImage) : (userData.profileImage ? `${staticFilesBaseURL}/${userData.profileImage}?t=${new Date().getTime()}` : "/assets/images/users/avatar-1.jpg")} 
                        className="rounded-circle avatar-xl img-thumbnail user-profile-image" 
                        alt="user-profile-image"
                        onError={(e) => {
                          
                          e.target.onerror = null;
                          e.target.src = "/assets/images/users/avatar-1.jpg";
                        }}
                      />
                      <div className="avatar-xs p-0 rounded-circle profile-photo-edit">
                        <input 
                          id="profile-img-file-input" 
                          type="file" 
                          className="profile-img-file-input" 
                          accept="image/*"
                          onChange={handleProfileImageChange}
                        />
                        <label htmlFor="profile-img-file-input" className="profile-photo-edit avatar-xs">
                          <span className="avatar-title rounded-circle bg-light text-body">
                            <i className="ri-camera-fill" />
                          </span>
                        </label>
                      </div>
                    </div>
                    <h5 className="fs-16 mb-1">{userData.name || 'User'}</h5>
                    <p className="text-muted mb-0">{getRoleDisplayName(userData.role)}</p>
                  </div>
                </div>
              </div>
              
              {/* Profile Completion */}
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-5">
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-0">Complete Your Profile</h5>
                    </div>
                  </div>
                  <div className="progress animated-progress custom-progress progress-label">
                    <div 
                      className={`progress-bar ${getProgressColor(profileCompletion)}`} 
                      role="progressbar" 
                      style={{width: `${profileCompletion}%`}} 
                      aria-valuenow={profileCompletion} 
                      aria-valuemin={0} 
                      aria-valuemax={100}
                    >
                      <div className="label">{profileCompletion}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="col-xxl-9">
              <div className="card mt-xxl-n5">
                <div className="card-header">
                  <ul className="nav nav-tabs-custom rounded card-header-tabs border-bottom-0" role="tablist">
                    <li className="nav-item">
                      <a className="nav-link active" data-bs-toggle="tab" href="#personalDetails" role="tab">
                        <i className="fas fa-home" /> Personal Details
                      </a>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" data-bs-toggle="tab" href="#changePassword" role="tab">
                        <i className="far fa-user" /> Change Password
                      </a>
                    </li>
                  </ul>
                </div>
                
                <div className="card-body p-4">
                  <div className="tab-content">
                    {/* Personal Details Tab */}
                    <div className="tab-pane active" id="personalDetails" role="tabpanel">
                      <form onSubmit={handleProfileUpdate}>
                        <div className="row">
                          <div className="col-lg-6">
                            <div className="mb-3">
                              <label htmlFor="name" className="form-label">Full Name *</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                id="name"
                                name="name"
                                placeholder="Enter your full name" 
                                value={formData.name}
                                onChange={handleInputChange}
                                required 
                                disabled={isEmployeeOnly}
                              />
                              {isEmployeeOnly && (
                                <div className="form-text">Contact administrator to update your name.</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="col-lg-6">
                            <div className="mb-3">
                              <label htmlFor="email" className="form-label">Email Address *</label>
                              <input 
                                type="email" 
                                className="form-control" 
                                id="email"
                                name="email"
                                placeholder="Enter your email" 
                                value={formData.email}
                                onChange={handleInputChange}
                                required 
                                disabled={isEmployeeOnly}
                              />
                              {isEmployeeOnly && (
                                <div className="form-text">Contact administrator to update your email.</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="col-lg-6">
                            <div className="mb-3">
                              <label htmlFor="mobile" className="form-label">Phone Number</label>
                              <input 
                                type="tel" 
                                className="form-control" 
                                id="mobile"
                                name="mobile"
                                placeholder="Enter your phone number" 
                                value={formData.mobile}
                                onChange={handleInputChange}
                                disabled={isEmployeeOnly}
                              />
                              {isEmployeeOnly && (
                                <div className="form-text">Contact administrator to update your phone number.</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="col-lg-6">
                            <div className="mb-3">
                              <label htmlFor="role" className="form-label">Role</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                id="role"
                                value={getRoleDisplayName(userData.role)}
                                disabled 
                              />
                              <div className="form-text">Role cannot be changed. Contact administrator for role changes.</div>
                            </div>
                          </div>
                          
                          <div className="col-lg-12">
                            <div className="hstack gap-2 justify-content-end">
                              <button 
                                type="submit" 
                                className="btn btn-outline-primary"
                                disabled={updating}
                              >
                                {updating ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Updating...
                                  </>
                                ) : (
                                  'Update Profile'
                                )}
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-soft-danger"
                                onClick={() => navigate('/UserProfile')}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                    
                    {/* Change Password Tab */}
                    <div className="tab-pane" id="changePassword" role="tabpanel">
                      <form onSubmit={handlePasswordUpdate}>
                        <div className="row g-2">
                          <div className="col-lg-4">
                            <div>
                              <label htmlFor="currentPassword" className="form-label">Current Password *</label>
                              <div className="position-relative auth-pass-inputgroup">
                                <input 
                                  type={showCurrentPassword ? "text" : "password"}
                                  className="form-control pe-5"
                                  id="currentPassword"
                                  name="currentPassword"
                                  placeholder="Enter current password"
                                  value={passwordData.currentPassword}
                                  onChange={handlePasswordChange}
                                  required 
                                />
                                <button
                                  className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  <i className={`ri-${showCurrentPassword ? 'eye-off' : 'eye'}-line`}></i>
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-lg-4">
                            <div>
                              <label htmlFor="newPassword" className="form-label">New Password *</label>
                              <div className="position-relative auth-pass-inputgroup">
                                <input 
                                  type={showNewPassword ? "text" : "password"}
                                  className="form-control pe-5"
                                  id="newPassword"
                                  name="newPassword"
                                  placeholder="Enter new password"
                                  value={passwordData.newPassword}
                                  onChange={handlePasswordChange}
                                  minLength={8}
                                  required 
                                />
                                <button
                                  className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  <i className={`ri-${showNewPassword ? 'eye-off' : 'eye'}-line`}></i>
                                </button>
                              </div>
                              <div className="form-text">Password must be at least 8 characters long.</div>
                            </div>
                          </div>
                          
                          <div className="col-lg-4">
                            <div>
                              <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
                              <div className="position-relative auth-pass-inputgroup">
                                <input 
                                  type={showConfirmPassword ? "text" : "password"}
                                  className="form-control pe-5"
                                  id="confirmPassword"
                                  name="confirmPassword"
                                  placeholder="Confirm password"
                                  value={passwordData.confirmPassword}
                                  onChange={handlePasswordChange}
                                  required 
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
                          </div>
                          
                          <div className="col-lg-12">
                            <div className="text-end mt-3">
                              <button 
                                type="submit" 
                                className="btn btn-outline-primary"
                                disabled={changingPassword}
                              >
                                {changingPassword ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Changing...
                                  </>
                                ) : (
                                  'Change Password'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
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

export default UpdateProfile;