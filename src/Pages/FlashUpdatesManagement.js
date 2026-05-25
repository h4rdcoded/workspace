import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../config/api';

const FlashUpdatesManagement = () => {
  const PASSWORD = '@Webjerry7757';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [flashUpdates, setFlashUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    content: '',
    is_active: true,
    image: null,
    animation_style: 'flashGlow',
    text_color: '#0d6efd',
    background_color: '#e7f1ff',
    font_family: 'inherit',
    font_size: '0.8rem',
    font_weight: '600'
  });

  // Animation styles available
  const animationStyles = [
    { value: 'flashGlow', label: '✨ Glow Pulse', description: 'Soft glowing pulse effect' },
    { value: 'flashBounce', label: '🎾 Bounce', description: 'Bouncing animation' },
    { value: 'flashShake', label: '🔔 Shake', description: 'Shake to grab attention' },
    { value: 'flashFade', label: '💫 Fade Pulse', description: 'Smooth fade in/out' },
    { value: 'flashSlide', label: '➡️ Slide', description: 'Sliding animation' },
    { value: 'flashScale', label: '📈 Scale Pulse', description: 'Scale up/down effect' },
    { value: 'flashRotate', label: '🌀 Rotate Glow', description: 'Rotating with glow' },
    { value: 'flashNeon', label: '💡 Neon Flash', description: 'Bright neon flash effect' },
    { value: 'flashWave', label: '🌊 Wave', description: 'Wave animation' },
    { value: 'flashRainbow', label: '🌈 Rainbow', description: 'Rainbow color transition' },
    { value: 'flashTypewriter', label: '⌨️ Typewriter', description: 'Typing effect with blinking cursor' },
    { value: 'flashReveal', label: '🎭 Mask Reveal', description: 'Text reveal with mask animation' }
  ];

  // Hex to RGBA converter for animations
  const hexToRgba = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Generate CSS keyframes for animation preview
  const generatePreviewKeyframes = () => {
    const textColor = formData.text_color || '#0d6efd';
    const textColorRgba50 = hexToRgba(textColor, 0.5);
    const textColorRgba80 = hexToRgba(textColor, 0.8);
    
    return `
      @keyframes flashGlow-preview {
        0%, 100% {
          text-shadow: 0 0 5px ${textColorRgba50}, 0 0 10px ${textColorRgba50};
        }
        50% {
          text-shadow: 0 0 10px ${textColorRgba80}, 0 0 20px ${textColorRgba50}, 0 0 30px ${textColorRgba50};
        }
      }
      @keyframes flashBounce-preview {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      @keyframes flashShake-preview {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        75% { transform: translateX(3px); }
      }
      @keyframes flashFade-preview {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes flashSlide-preview {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(5px); }
      }
      @keyframes flashScale-preview {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes flashRotate-preview {
        0% { transform: rotate(0deg) scale(1); filter: hue-rotate(0deg); }
        50% { transform: rotate(5deg) scale(1.05); filter: hue-rotate(90deg); }
        100% { transform: rotate(0deg) scale(1); filter: hue-rotate(0deg); }
      }
      @keyframes flashNeon-preview {
        0%, 100% {
          text-shadow: 0 0 5px ${textColor}, 0 0 10px ${textColor}, 0 0 15px ${textColor};
          filter: brightness(1);
        }
        50% {
          text-shadow: 0 0 10px ${textColor}, 0 0 20px ${textColor}, 0 0 30px ${textColor}, 0 0 40px ${textColor};
          filter: brightness(1.5);
        }
      }
      @keyframes flashWave-preview {
        0%, 100% { transform: translateY(0) scaleY(1); }
        25% { transform: translateY(-3px) scaleY(1.05); }
        50% { transform: translateY(0) scaleY(1); }
        75% { transform: translateY(3px) scaleY(0.95); }
      }
      @keyframes flashRainbow-preview {
        0% { filter: hue-rotate(0deg); }
        25% { filter: hue-rotate(90deg); }
        50% { filter: hue-rotate(180deg); }
        75% { filter: hue-rotate(270deg); }
        100% { filter: hue-rotate(360deg); }
      }
      @keyframes flashTypewriter-preview {
        0% { width: 0; }
        100% { width: 100%; }
      }
      @keyframes flashReveal-preview {
        0% { clip-path: inset(0 100% 0 0); }
        100% { clip-path: inset(0 0 0 0); }
      }
    `;
  };

  // Inject keyframe animations for preview
  useEffect(() => {
    const styleId = 'flash-preview-keyframes';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = generatePreviewKeyframes();
  }, [formData.text_color]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFlashUpdates();
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === PASSWORD) {
      setIsAuthenticated(true);
      toast.success('Access granted');
    } else {
      toast.error('Incorrect password');
      setPassword('');
    }
  };

  const fetchFlashUpdates = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/flash-updates'), {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      if (data.success) {
        setFlashUpdates(data.data);
      } else {
        toast.error('Failed to fetch flash updates');
      }
    } catch (error) {
      toast.error('Failed to fetch flash updates');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      if (file) {
        setFormData(prev => ({ ...prev, [name]: file }));
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      content: '',
      is_active: true,
      image: null,
      animation_style: 'flashGlow',
      text_color: '#0d6efd',
      background_color: '#e7f1ff',
      font_family: 'inherit',
      font_size: '0.8rem',
      font_weight: '600'
    });
    setImagePreview(null);
    setSelectedUpdate(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (update) => {
    setFormData({
      title: update.title || '',
      message: update.message || '',
      content: update.content || '',
      is_active: update.is_active === 1 || update.is_active === true,
      image: null,
      animation_style: update.animation_style || 'flashGlow',
      text_color: update.text_color || '#0d6efd',
      background_color: update.background_color && update.background_color !== 'null' && update.background_color !== '' ? update.background_color : '#e7f1ff',
      font_family: update.font_family && update.font_family !== 'null' && update.font_family !== '' ? update.font_family : 'inherit',
      font_size: update.font_size || '0.8rem',
      font_weight: update.font_weight || '600'
    });
    // Build image URL using buildApiUrl helper
    const baseUrl = buildApiUrl('').replace('/api/v1', '');
    setImagePreview(update.image_path ? `${baseUrl}${update.image_path}` : null);
    setSelectedUpdate(update);
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('message', formData.message);
      submitFormData.append('content', formData.content || '');
      submitFormData.append('is_active', formData.is_active);
      submitFormData.append('animation_style', formData.animation_style || 'flashGlow');
      submitFormData.append('text_color', formData.text_color || '#0d6efd');
      submitFormData.append('background_color', formData.background_color === 'transparent' || formData.background_color === 'none' ? 'transparent' : (formData.background_color || '#e7f1ff'));
      submitFormData.append('font_family', formData.font_family || 'inherit');
      submitFormData.append('font_size', formData.font_size || '0.8rem');
      submitFormData.append('font_weight', formData.font_weight || '600');
      
      if (formData.image) {
        submitFormData.append('image', formData.image);
      }
      

      const url = selectedUpdate 
        ? buildApiUrl(`/flash-updates/${selectedUpdate.id}`)
        : buildApiUrl('/flash-updates');
      
      const method = selectedUpdate ? 'PUT' : 'POST';
      
      // For update, if no new image, we might need to handle differently
      if (selectedUpdate && !formData.image && !imagePreview) {
        submitFormData.append('remove_image', 'true');
      }

      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Authorization': getAuthHeaders().Authorization
        },
        body: submitFormData
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(selectedUpdate ? 'Flash update updated successfully' : 'Flash update created successfully');
        resetForm();
        setShowCreateModal(false);
        setShowEditModal(false);
        fetchFlashUpdates();
      } else {
        toast.error(data.message || 'Failed to save flash update');
      }
    } catch (error) {
      toast.error('Failed to save flash update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flash update?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/flash-updates/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Flash update deleted successfully');
        fetchFlashUpdates();
      } else {
        toast.error(data.message || 'Failed to delete flash update');
      }
    } catch (error) {
      toast.error('Failed to delete flash update');
    }
  };

  const toggleActive = async (update) => {
    try {
      const formData = new FormData();
      formData.append('is_active', !update.is_active);
      
      const response = await fetch(buildApiUrl(`/flash-updates/${update.id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Authorization': getAuthHeaders().Authorization
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Status updated successfully');
        fetchFlashUpdates();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row justify-content-center py-5">
              <div className="col-md-4">
                <div className="card shadow-lg border-0">
                  <div className="card-body p-4">
                    <div className="text-center mb-4">
                      <h3 className="mb-0">🔒 Access Required</h3>
                      <p className="text-muted mt-2">Please enter the password to access this page</p>
                    </div>
                    <form onSubmit={handlePasswordSubmit}>
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-control"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          required
                          autoFocus
                        />
                      </div>
                      <button type="submit" className="btn btn-primary w-100">
                        Access
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          {/* start page title */}
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 className="mb-sm-0">⚡ Flash Updates Management</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Admin Tools</li>
                    <li className="breadcrumb-item active">Flash Updates</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          {/* end page title */}

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">Flash Updates</h4>
                  <button className="btn btn-primary" onClick={handleCreate}>
                    <i className="ri-add-line me-2"></i>Create New Flash Update
                  </button>
                </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : flashUpdates.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="ri-inbox-line fs-1 mb-3 d-block"></i>
                  <p>No flash updates found. Create your first one!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Image</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flashUpdates.map((update) => (
                        <tr key={update.id}>
                          <td><strong>{update.title}</strong></td>
                          <td>{update.message.substring(0, 50)}...</td>
                          <td>
                            {update.image_path && (
                              <img 
                                src={`${buildApiUrl('').replace('/api/v1', '')}${update.image_path}`}
                                alt="Flash update"
                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                            )}
                          </td>
                          <td>
                            <span 
                              className={`badge ${update.is_active ? 'bg-success' : 'bg-secondary'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleActive(update)}
                            >
                              {update.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{new Date(update.created_at).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-info me-2"
                              onClick={() => handleEdit(update)}
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(update.id)}
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
          </div>

          {/* Create Modal */}
      {showCreateModal && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        >
          <div 
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Flash Update</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., New Update Coming, Version Updated"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Short Message *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="e.g., Look what's new!"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Detailed Content</label>
                    <textarea
                      className="form-control"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows="6"
                      placeholder="Write detailed information about the update..."
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Image/GIF</label>
                    <input
                      type="file"
                      className="form-control"
                      name="image"
                      accept="image/*"
                      onChange={handleInputChange}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '4px' }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Animation Style</label>
                      <select
                        className="form-select"
                        name="animation_style"
                        value={formData.animation_style}
                        onChange={handleInputChange}
                      >
                        {animationStyles.map((style) => (
                          <option key={style.value} value={style.value}>
                            {style.label} - {style.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Font Family</label>
                      <select
                        className="form-select"
                        name="font_family"
                        value={formData.font_family}
                        onChange={handleInputChange}
                      >
                        <option value="inherit">Inherit (Default)</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                        <option value="Impact, sans-serif">Impact</option>
                        <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                        <option value="'Arial Black', sans-serif">Arial Black</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Text Color</label>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        name="text_color"
                        value={formData.text_color}
                        onChange={handleInputChange}
                        title="Choose text color"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Background Color</label>
                      <div className="d-flex gap-2">
                        <input
                          type="color"
                          className="form-control form-control-color"
                          name="background_color"
                          value={formData.background_color === 'transparent' || formData.background_color === 'none' ? '#e7f1ff' : formData.background_color}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, background_color: e.target.value }));
                          }}
                          title="Choose background color"
                        />
                        <button
                          type="button"
                          className={`btn btn-sm ${formData.background_color === 'transparent' || formData.background_color === 'none' ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              background_color: prev.background_color === 'transparent' ? '#e7f1ff' : 'transparent' 
                            }));
                          }}
                          title="Toggle transparent background"
                        >
                          {formData.background_color === 'transparent' || formData.background_color === 'none' ? '✓ No BG' : 'No BG'}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Font Size</label>
                      <select
                        className="form-select"
                        name="font_size"
                        value={formData.font_size}
                        onChange={handleInputChange}
                      >
                        <option value="0.7rem">Small (0.7rem)</option>
                        <option value="0.8rem">Medium (0.8rem)</option>
                        <option value="0.9rem">Large (0.9rem)</option>
                        <option value="1rem">Extra Large (1rem)</option>
                        <option value="1.1rem">XX Large (1.1rem)</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Font Weight</label>
                      <select
                        className="form-select"
                        name="font_weight"
                        value={formData.font_weight}
                        onChange={handleInputChange}
                      >
                        <option value="300">Light (300)</option>
                        <option value="400">Normal (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semi Bold (600)</option>
                        <option value="700">Bold (700)</option>
                        <option value="800">Extra Bold (800)</option>
                        <option value="900">Black (900)</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="form-check mt-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          id="createActive"
                        />
                        <label className="form-check-label" htmlFor="createActive">
                          Active (visible to users)
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* Preview Section */}
                  <div className="mb-3">
                    <label className="form-label">Live Preview</label>
                    <div 
                      className="p-3 rounded border"
                      style={{ 
                        backgroundColor: formData.background_color === 'transparent' || formData.background_color === 'none' ? 'transparent' : formData.background_color,
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {imagePreview && (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ 
                            width: '28px', 
                            height: '28px', 
                            objectFit: 'contain', 
                            borderRadius: '6px',
                            marginRight: '10px'
                          }}
                        />
                      )}
                      <span 
                        style={{
                          color: formData.text_color,
                          fontFamily: formData.font_family,
                          fontSize: formData.font_size,
                          fontWeight: formData.font_weight,
                          animation: `${formData.animation_style}-preview 2s ease-in-out infinite`,
                          display: 'inline-block',
                          overflow: formData.animation_style === 'flashTypewriter' ? 'hidden' : 'visible',
                          whiteSpace: formData.animation_style === 'flashTypewriter' ? 'nowrap' : 'normal',
                          clipPath: formData.animation_style === 'flashReveal' ? 'inset(0 100% 0 0)' : 'none'
                        }}
                      >
                        {formData.message || 'Preview text will appear here...'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => {
            setShowEditModal(false);
            resetForm();
          }}
        >
          <div 
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Flash Update</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Short Message *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Detailed Content</label>
                    <textarea
                      className="form-control"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows="6"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Image/GIF</label>
                    <input
                      type="file"
                      className="form-control"
                      name="image"
                      accept="image/*"
                      onChange={handleInputChange}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger ms-2"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, image: null }));
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Animation Style</label>
                      <select
                        className="form-select"
                        name="animation_style"
                        value={formData.animation_style}
                        onChange={handleInputChange}
                      >
                        {animationStyles.map((style) => (
                          <option key={style.value} value={style.value}>
                            {style.label} - {style.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Font Family</label>
                      <select
                        className="form-select"
                        name="font_family"
                        value={formData.font_family}
                        onChange={handleInputChange}
                      >
                        <option value="inherit">Inherit (Default)</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                        <option value="Impact, sans-serif">Impact</option>
                        <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                        <option value="'Arial Black', sans-serif">Arial Black</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Text Color</label>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        name="text_color"
                        value={formData.text_color}
                        onChange={handleInputChange}
                        title="Choose text color"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Background Color</label>
                      <div className="d-flex gap-2">
                        <input
                          type="color"
                          className="form-control form-control-color"
                          name="background_color"
                          value={formData.background_color === 'transparent' || formData.background_color === 'none' ? '#e7f1ff' : formData.background_color}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, background_color: e.target.value }));
                          }}
                          title="Choose background color"
                        />
                        <button
                          type="button"
                          className={`btn btn-sm ${formData.background_color === 'transparent' || formData.background_color === 'none' ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              background_color: prev.background_color === 'transparent' ? '#e7f1ff' : 'transparent' 
                            }));
                          }}
                          title="Toggle transparent background"
                        >
                          {formData.background_color === 'transparent' || formData.background_color === 'none' ? '✓ No BG' : 'No BG'}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Font Size</label>
                      <select
                        className="form-select"
                        name="font_size"
                        value={formData.font_size}
                        onChange={handleInputChange}
                      >
                        <option value="0.7rem">Small (0.7rem)</option>
                        <option value="0.8rem">Medium (0.8rem)</option>
                        <option value="0.9rem">Large (0.9rem)</option>
                        <option value="1rem">Extra Large (1rem)</option>
                        <option value="1.1rem">XX Large (1.1rem)</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Font Weight</label>
                      <select
                        className="form-select"
                        name="font_weight"
                        value={formData.font_weight}
                        onChange={handleInputChange}
                      >
                        <option value="300">Light (300)</option>
                        <option value="400">Normal (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semi Bold (600)</option>
                        <option value="700">Bold (700)</option>
                        <option value="800">Extra Bold (800)</option>
                        <option value="900">Black (900)</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="form-check mt-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          id="editActive"
                        />
                        <label className="form-check-label" htmlFor="editActive">
                          Active (visible to users)
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* Preview Section */}
                  <div className="mb-3">
                    <label className="form-label">Live Preview</label>
                    <div 
                      className="p-3 rounded border"
                      style={{ 
                        backgroundColor: formData.background_color,
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {imagePreview && (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ 
                            width: '28px', 
                            height: '28px', 
                            objectFit: 'contain', 
                            borderRadius: '6px',
                            marginRight: '10px'
                          }}
                        />
                      )}
                      <span 
                        style={{
                          color: formData.text_color,
                          fontFamily: formData.font_family,
                          fontSize: formData.font_size,
                          fontWeight: formData.font_weight,
                          animation: `${formData.animation_style}-preview 2s ease-in-out infinite`,
                          display: 'inline-block',
                          overflow: formData.animation_style === 'flashTypewriter' ? 'hidden' : 'visible',
                          whiteSpace: formData.animation_style === 'flashTypewriter' ? 'nowrap' : 'normal',
                          clipPath: formData.animation_style === 'flashReveal' ? 'inset(0 100% 0 0)' : 'none'
                        }}
                      >
                        {formData.message || 'Preview text will appear here...'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

          </div>
        </div>
      </div>
    );
  };

export default FlashUpdatesManagement;
