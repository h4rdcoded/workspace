import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DepartmentManagerTaskFiles = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false); // Add this state
  const [newFileData, setNewFileData] = useState({ name: '' }); // Add this state
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(15);

  // Check if user is department manager or team leader
  const isDepartmentManager = leadCrmUser?.role === 'DEPARTMENT_MANAGER' || leadCrmUser?.role === 'TL';

  useEffect(() => {
    if (isDepartmentManager) {
      fetchAssignedFiles();
    }
  }, [isDepartmentManager]);

  const fetchAssignedFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${leadCrmApiURL}/department-manager/task-files`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Sort by date - newest first
        const sortedFiles = (data.data.files || []).sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setFiles(sortedFiles);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fetch assigned task files');
      }
    } catch (error) {
      console.error('Error fetching assigned task files:', error);
      toast.error('Error fetching assigned task files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    // Check if file is Excel format
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['xlsx', 'xls', 'csv'];
    
    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error('Only Excel files (.xlsx, .xls, .csv) are allowed');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${leadCrmApiURL}/department-manager/task-files`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('File uploaded successfully');
        setSelectedFile(null);
        fetchAssignedFiles(); // Refresh the file list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  // Add this new function to create a task file without uploading
  const handleCreateTaskFile = async (e) => {
    e.preventDefault();
    if (!newFileData.name) {
      toast.error('Please enter a file name');
      return;
    }

    setUploading(true);
    try {
      // Create a task file without uploading an Excel file
      const response = await fetch(`${leadCrmApiURL}/department-manager/task-files/create-empty`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: newFileData.name })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Task file created successfully');
        setNewFileData({ name: '' });
        setShowCreateModal(false);
        fetchAssignedFiles(); // Refresh the file list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create task file');
      }
    } catch (error) {
      console.error('Error creating task file:', error);
      toast.error('Error creating task file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file? This will also delete all related tasks.')) {
      return;
    }

    setDeleting(fileId);
    try {
      const response = await fetch(`${leadCrmApiURL}/department-manager/task-files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('File deleted successfully');
        fetchAssignedFiles(); // Refresh the file list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Error deleting file');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get current files for pagination
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = files.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.ceil(files.length / filesPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!isDepartmentManager) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="alert alert-danger">
                      <h4>Access Denied</h4>
                      <p>This page is only accessible to department managers and team leaders.</p>
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

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 className="mb-sm-0">Assigned Task Files</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Department Manager</li>
                    <li className="breadcrumb-item active">Task Files</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="card-title mb-0">Manage Task Files</h5>
                    <div>
                     
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-8">
                      <form onSubmit={handleFileUpload}>
                        <div className="row">
                          <div className="col-md-8">
                            <input
                              type="file"
                              className="form-control"
                              accept=".xlsx,.xls,.csv"
                              onChange={(e) => setSelectedFile(e.target.files[0])}
                            />
                            <small className="text-muted">Supported formats: Excel files only (.xlsx, .xls, .csv)</small>
                          </div>
                          <div className="col-md-4">
                            <button 
                              type="submit" 
                              className="btn btn-outline-success"
                              disabled={uploading || !selectedFile}
                            >
                              {uploading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <i className="ri-upload-line me-1"></i>
                                  Upload File
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Assigned Task Files</h5>
                    <button 
                        className="btn btn-outline-primary me-2"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <i className="ri-add-line me-1"></i>
                        Create Task File
                      </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <table className="table table-striped table-hover">
                          <thead>
                            <tr>
                              <th>File Name</th>
                              <th>Assigned By</th>
                              <th>Assigned At</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentFiles.length > 0 ? (
                              currentFiles.map((file) => (
                                <tr key={file.id}>
                                  <td>{file.filename}</td>
                                  <td>{file.assigned_by_name || 'N/A'}</td>
                                  <td>{formatDateTime(file.assigned_at)}</td>
                                  <td>
                                    <span className={`badge ${
                                      file.status === 'ASSIGNED' ? 'bg-primary' : 
                                      file.status === 'PROCESSING' ? 'bg-warning' : 
                                      file.status === 'COMPLETED' ? 'bg-success' : 
                                      'bg-secondary'
                                    }`}>
                                      {file.status}
                                    </span>
                                  </td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-outline-success me-1"
                                      onClick={() => navigate(`/department-manager/task-file/${file.id}`)}
                                    >
                                      <i className="ri-eye-line me-1"></i>
                                      View Details
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-danger"
                                      disabled={deleting === file.id}
                                      onClick={() => handleDeleteFile(file.id)}
                                    >
                                      {deleting === file.id ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        </>
                                      ) : (
                                        <>
                                          <i className="ri-delete-bin-line me-1"></i>
                                          Delete
                                        </>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center">
                                  No task files assigned to you. Files assigned by admin will appear here.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                          <nav aria-label="Page navigation">
                            <ul className="pagination">
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                                  Previous
                                </button>
                              </li>
                              
                              {[...Array(totalPages)].map((_, index) => {
                                const pageNumber = index + 1;
                                // Show first, last, current, and nearby pages
                                if (
                                  pageNumber === 1 ||
                                  pageNumber === totalPages ||
                                  (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                                ) {
                                  return (
                                    <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                      <button className="page-link" onClick={() => paginate(pageNumber)}>
                                        {pageNumber}
                                      </button>
                                    </li>
                                  );
                                } else if (
                                  pageNumber === currentPage - 3 ||
                                  pageNumber === currentPage + 3
                                ) {
                                  return (
                                    <li key={pageNumber} className="page-item disabled">
                                      <span className="page-link">...</span>
                                    </li>
                                  );
                                }
                                return null;
                              })}
                              
                              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                                  Next
                                </button>
                              </li>
                            </ul>
                          </nav>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Create Task File Modal */}
      {showCreateModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Task File</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowCreateModal(false);
                  setNewFileData({ name: '' });
                }}></button>
              </div>
              <form onSubmit={handleCreateTaskFile}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Task File Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newFileData.name}
                      onChange={(e) => setNewFileData({ ...newFileData, name: e.target.value })}
                      placeholder="Enter task file name"
                      required
                    />
                    <small className="text-muted">This will create an empty task file that you can add tasks to later</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewFileData({ name: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-outline-primary"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Task File'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagerTaskFiles;