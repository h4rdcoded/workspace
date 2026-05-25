import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';

const FileManagement = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignedTo, setFilterAssignedTo] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedFiles, setExpandedFiles] = useState(new Set());

  // Check if user is admin
  const isAdmin = leadCrmUser?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      fetchAllFiles();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterFiles();
  }, [files, searchTerm, filterStatus, filterAssignedTo, startDate, endDate]);

  const fetchAllFiles = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`${leadCrmApiURL}/admin/all-files?${params.toString()}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.data.files || []);
        setFilteredFiles(data.data.files || []);
      } else {
        console.error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let result = files;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(file => 
        file.filename?.toLowerCase().includes(term) ||
        file.assignedTo?.toLowerCase().includes(term) ||
        file.teamLeader?.toLowerCase().includes(term)
      );
    }

    // Filter by assigned to role
    if (filterAssignedTo !== 'all') {
      result = result.filter(file => file.assignedToRole === filterAssignedTo);
    }

    setFilteredFiles(result);
  };

  const handleFileClick = (fileId) => {
    // Navigate to file details on the same page
    window.location.href = `/admin/file/${fileId}`;
  };

  const toggleFileExpansion = (fileId) => {
    const newExpandedFiles = new Set(expandedFiles);
    if (newExpandedFiles.has(fileId)) {
      newExpandedFiles.delete(fileId);
    } else {
      newExpandedFiles.add(fileId);
    }
    setExpandedFiles(newExpandedFiles);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'IN_PROGRESS': return 'bg-info';
      case 'COMPLETED': return 'bg-success';
      case 'ASSIGNED': return 'bg-primary';
      case 'UNASSIGNED': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleSearchLead = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${leadCrmApiURL}/admin/search-leads?query=${encodeURIComponent(searchTerm)}&limit=5`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.leads && data.data.leads.length > 0) {
          // For now, we'll navigate to the first lead's file
          const firstLead = data.data.leads[0];
          if (firstLead.fileId) {
            // Navigate to the file details page with lead information in URL
            window.location.href = `/admin/file/${firstLead.fileId}?highlightLead=${firstLead.leadId}`;
          }
        } else {
          alert('No leads found matching your search criteria.');
        }
      } else {
        console.error('Failed to search for leads');
      }
    } catch (error) {
      console.error('Error searching for lead:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="alert alert-danger">
        <h4>Access Denied</h4>
        <p>This page is only accessible to administrators.</p>
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
                <h4 className="mb-sm-0">File Management</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Admin</li>
                    <li className="breadcrumb-item active">File Management</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">All Files</h5>
                    <button 
                      className="btn btn-primary" 
                      onClick={fetchAllFiles}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Loading...
                        </>
                      ) : (
                        <>
                          <i className="ri-refresh-line me-1"></i>
                          Refresh
                        </>
                      )}
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="row mb-3">
                    <div className="col-md-3">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search files or leads..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              // If search term looks like an email or company name, search for leads
                              if (searchTerm.includes('@') || searchTerm.length > 3) {
                                handleSearchLead();
                              }
                            }
                          }}
                        />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={handleSearchLead}
                        >
                          <i className="ri-search-line"></i>
                        </button>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <input
                        type="date"
                        className="form-control"
                        placeholder="Start Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <input
                        type="date"
                        className="form-control"
                        placeholder="End Date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="UNASSIGNED">Unassigned</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <select
                        className="form-select"
                        value={filterAssignedTo}
                        onChange={(e) => setFilterAssignedTo(e.target.value)}
                      >
                        <option value="all">All Roles</option>
                        <option value="TL">Team Leaders</option>
                        <option value="EXEC">Executives</option>
                      </select>
                    </div>
                    <div className="col-md-1">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                          setFilterStatus('all');
                          setFilterAssignedTo('all');
                          setSearchTerm('');
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Files Table */}
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th></th>
                            <th>File Name</th>
                            <th>Team Leader</th>
                            <th>Parts</th>
                            <th>Leads</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFiles.length > 0 ? (
                            filteredFiles.map((file) => {
                              const isExpanded = expandedFiles.has(file.id);
                              return (
                                <React.Fragment key={file.id}>
                                  <tr>
                                    <td>
                                      <button 
                                        className="btn btn-sm btn-light"
                                        onClick={() => toggleFileExpansion(file.id)}
                                      >
                                        <i className={`ri-${isExpanded ? 'subtract' : 'add'}-line`}></i>
                                      </button>
                                    </td>
                                    <td>{file.filename}</td>
                                    <td>{file.teamLeader || 'N/A'}</td>
                                    <td>{file.partCount}</td>
                                    <td>{file.leadCount}</td>
                                    <td>{formatDate(file.createdAt)}</td>
                                    <td>
                                      <button 
                                        className="btn btn-sm btn-primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFileClick(file.id);
                                        }}
                                      >
                                        <i className="ri-eye-line"></i> View
                                      </button>
                                    </td>
                                  </tr>
                                  {isExpanded && file.parts && file.parts.length > 0 && (
                                    <tr>
                                      <td colSpan="7">
                                        <div className="p-3 bg-light">
                                          <h6>File Parts Details</h6>
                                          <div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                            <table className="table table-bordered table-sm">
                                              <thead>
                                                <tr>
                                                  <th>Part #</th>
                                                  <th>Rows</th>
                                                  <th>Leads</th>
                                                  <th>Assigned To</th>
                                                  <th>Assigned By</th>
                                                  <th>Status</th>
                                                  <th>Assigned At</th>
                                                  <th>Started At</th>
                                                  <th>Submitted At</th>
                                                  <th>Completed At</th>
                                                  <th>Note</th>
                                                  <th>Actions</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {file.parts.map((part) => (
                                                  <tr key={part.id}>
                                                    <td>{part.partIndex + 1}</td>
                                                    <td>{part.rowStart}-{part.rowEnd} ({part.totalRows} rows)</td>
                                                    <td>{part.leadCount}</td>
                                                    <td>
                                                      {part.assignedTo.name !== 'Unassigned' ? (
                                                        <>
                                                          {part.assignedTo.name}
                                                          <span className="badge bg-info ms-1">{part.assignedTo.role}</span>
                                                        </>
                                                      ) : (
                                                        'Unassigned'
                                                      )}
                                                    </td>
                                                    <td>{part.assignedBy.name || 'N/A'}</td>
                                                    <td>
                                                      <span className={`badge ${getStatusBadgeClass(part.status)}`}>
                                                        {part.status}
                                                      </span>
                                                    </td>
                                                    <td>{formatDate(part.assignedAt)}</td>
                                                    <td>{formatDate(part.startedAt)}</td>
                                                    <td>{formatDate(part.submittedAt)}</td>
                                                    <td>{formatDate(part.completedAt)}</td>
                                                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                      {part.note || 'N/A'}
                                                    </td>
                                                    <td>
                                                      {part.taskId && (
                                                        <button 
                                                          className="btn btn-sm btn-outline-primary"
                                                          onClick={() => window.location.href = `/admin/task/${part.taskId}`}
                                                        >
                                                          <i className="ri-eye-line"></i> Task
                                                        </button>
                                                      )}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="7" className="text-center">
                                No files found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      Showing {filteredFiles.length} of {files.length} files
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
};

export default FileManagement;