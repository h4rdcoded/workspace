import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { useParams } from 'react-router-dom';

const FileDetails = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const { fileId } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is admin
  const isAdmin = leadCrmUser?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin && fileId) {
      fetchFileDetails();
    }
  }, [isAdmin, fileId]);

  const fetchFileDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${leadCrmApiURL}/admin/file/${fileId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFile(data.data.file);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch file details');
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      setError('Error fetching file details');
    } finally {
      setLoading(false);
    }
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
    return new Date(dateString).toLocaleString();
  };

  if (!isAdmin) {
    return (
      <div className="alert alert-danger">
        <h4>Access Denied</h4>
        <p>This page is only accessible to administrators.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading file details...</p>
                </div>
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
            <div className="row">
              <div className="col-12">
                <div className="alert alert-danger">
                  <h4>Error</h4>
                  <p>{error}</p>
                  <button className="btn btn-primary" onClick={fetchFileDetails}>
                    <i className="ri-refresh-line me-1"></i>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="alert alert-warning">
                  <h4>File Not Found</h4>
                  <p>The requested file could not be found.</p>
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
                <h4 className="mb-sm-0">File Details</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Admin</li>
                    <li className="breadcrumb-item">File Management</li>
                    <li className="breadcrumb-item active">Details</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <h5 className="card-title mb-1">{file.filename}</h5>
                      <p className="text-muted mb-0">File Details</p>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-lg-6">
                      <div className="card border">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">File Information</h6>
                        </div>
                        <div className="card-body">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td className="fw-medium">File ID</td>
                                <td>{file.id}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Total Rows</td>
                                <td>{file.totalRows}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Parts</td>
                                <td>{file.partCount}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Total Leads</td>
                                <td>{file.leadCount}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Created At</td>
                                <td>{formatDate(file.createdAt)}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Last Updated</td>
                                <td>{formatDate(file.updatedAt)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-6">
                      <div className="card border">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">Team Leader Information</h6>
                        </div>
                        <div className="card-body">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td className="fw-medium">Name</td>
                                <td>{file.teamLeader.name}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Email</td>
                                <td>{file.teamLeader.email || 'N/A'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="card border">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">File Parts</h6>
                          <span className="badge bg-primary">{file.partCount} Parts</span>
                        </div>
                        <div className="card-body">
                          {file.parts && file.parts.length > 0 ? (
                            <div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                              <table className="table table-striped table-hover">
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
                                            {part.assignedTo.email && (
                                              <div className="small text-muted">{part.assignedTo.email}</div>
                                            )}
                                          </>
                                        ) : (
                                          'Unassigned'
                                        )}
                                      </td>
                                      <td>
                                        {part.assignedBy.name || 'N/A'}
                                        {part.assignedBy.email && (
                                          <div className="small text-muted">{part.assignedBy.email}</div>
                                        )}
                                      </td>
                                      <td>
                                        <div>
                                          <span className={`badge ${getStatusBadgeClass(part.status)}`}>
                                            {part.status}
                                          </span>
                                        </div>
                                        {part.status === 'IN_PROGRESS' && part.startedAt && (
                                          <div className="small text-muted">
                                            Started: {formatDate(part.startedAt)}
                                          </div>
                                        )}
                                        {part.status === 'COMPLETED' && part.completedAt && (
                                          <div className="small text-muted">
                                            Completed: {formatDate(part.completedAt)}
                                          </div>
                                        )}
                                      </td>
                                      <td>{formatDate(part.assignedAt)}</td>
                                      <td>{formatDate(part.startedAt)}</td>
                                      <td>{formatDate(part.submittedAt)}</td>
                                      <td>{formatDate(part.completedAt)}</td>
                                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {part.note || 'N/A'}
                                      </td>
                                      <td>
                                        {part.taskId ? (
                                          <button 
                                            className="btn btn-sm btn-primary"
                                            onClick={() => window.location.href = `/admin/task/${part.taskId}`}
                                          >
                                            <i className="ri-eye-line me-1"></i>
                                            View Task
                                          </button>
                                        ) : (
                                          <span className="text-muted">No task</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="mb-0">No parts found for this file</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-3">
                    <button 
                      className="btn btn-primary"
                      onClick={() => window.history.back()}
                    >
                      <i className="ri-arrow-left-line me-1"></i>
                      Back to File Management
                    </button>
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

export default FileDetails;