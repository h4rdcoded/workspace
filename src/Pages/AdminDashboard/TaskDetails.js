import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { useParams, useLocation } from 'react-router-dom';

const TaskDetails = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const { taskId } = useParams();
  const location = useLocation();
  const [task, setTask] = useState(null);
  const [leads, setLeads] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLeads: 0,
    limit: 50
  });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [highlightedLead, setHighlightedLead] = useState(null);

  // Extract highlightLead parameter from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const leadId = params.get('highlightLead');
    if (leadId) {
      setHighlightedLead(leadId);
    }
  }, [location.search]);

  // Check if user is admin
  const isAdmin = leadCrmUser?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin && taskId) {
      fetchTaskDetails(1);
    }
  }, [isAdmin, taskId]);

  const fetchTaskDetails = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${leadCrmApiURL}/admin/task/${taskId}?page=${page}&limit=10`, { // Change limit to 10
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data.data.task);
        setLeads(data.data.leads || []);
        setColumns(data.data.columns || []);
        setPagination(data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalLeads: data.data.leads?.length || 0,
          limit: 10 // Change default limit to 10
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch task details');
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      setError('Error fetching task details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'IN_PROGRESS': return 'bg-info';
      case 'SUBMITTED': return 'bg-primary';
      case 'COMPLETED': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getLeadStatusBadgeClass = (status) => {
    switch (status) {
      case 'UNPROCESSED': return 'bg-secondary';
      case 'INTERESTED': return 'bg-success';
      case 'NOT_INTERESTED': return 'bg-danger';
      case 'BUSY': return 'bg-warning';
      case 'CALL_LATER': return 'bg-info';
      case 'INVALID': return 'bg-dark';
      case 'DO_NOT_DISTURB': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const toggleRowExpansion = (leadId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(leadId)) {
      newExpandedRows.delete(leadId);
    } else {
      newExpandedRows.add(leadId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTaskDetails(newPage);
    }
  };

  // Function to get value from raw payload by column name
  const getRawPayloadValue = (rawPayload, columnName) => {
    return rawPayload[columnName] || 'N/A';
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
                  <p className="mt-2">Loading task details...</p>
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
                  <button className="btn btn-primary" onClick={() => fetchTaskDetails(1)}>
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

  if (!task) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="alert alert-warning">
                  <h4>Task Not Found</h4>
                  <p>The requested task could not be found.</p>
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
                <h4 className="mb-sm-0">Task Details</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Admin</li>
                    <li className="breadcrumb-item">Task Management</li>
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
                      <h5 className="card-title mb-1">Task #{task.id}</h5>
                      <p className="text-muted mb-0">Task Details</p>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-lg-6">
                      <div className="card border">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">Task Information</h6>
                        </div>
                        <div className="card-body">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td className="fw-medium">Task ID</td>
                                <td>{task.id}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Part</td>
                                <td>Part #{task.partIndex + 1} (Rows {task.rowStart}-{task.rowEnd})</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">File</td>
                                <td>{task.filename}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Total Leads</td>
                                <td>{pagination.totalLeads}</td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Status</td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                    {task.status}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Assigned At</td>
                                <td>{formatDate(task.assignedAt)}</td>
                              </tr>
                              {task.startedAt && (
                                <tr>
                                  <td className="fw-medium">Started At</td>
                                  <td>{formatDate(task.startedAt)}</td>
                                </tr>
                              )}
                              {task.submittedAt && (
                                <tr>
                                  <td className="fw-medium">Submitted At</td>
                                  <td>{formatDate(task.submittedAt)}</td>
                                </tr>
                              )}
                              {task.completedAt && (
                                <tr>
                                  <td className="fw-medium">Completed At</td>
                                  <td>{formatDate(task.completedAt)}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-6">
                      <div className="card border">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">Assignment Information</h6>
                        </div>
                        <div className="card-body">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td className="fw-medium">Assigned To</td>
                                <td>
                                  {task.assignedTo.name}
                                  <span className="badge bg-info ms-1">{task.assignedTo.role}</span>
                                  <div className="small text-muted">{task.assignedTo.email}</div>
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Assigned By</td>
                                <td>
                                  {task.assignedBy.name}
                                  <div className="small text-muted">{task.assignedBy.email}</div>
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-medium">Team Leader</td>
                                <td>{task.teamLeader.name || 'N/A'}</td>
                              </tr>
                              {task.note && (
                                <tr>
                                  <td className="fw-medium">Note</td>
                                  <td>{task.note}</td>
                                </tr>
                              )}
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
                          <h6 className="mb-0">Leads in this Task</h6>
                          <span className="badge bg-primary">{pagination.totalLeads} Leads</span>
                        </div>
                        <div className="card-body">
                          {leads.length > 0 ? (
                            <>
                              {highlightedLead && (
                                <div className="alert alert-info mb-3">
                                  <h5>Lead Search Result</h5>
                                  <p>The lead you searched for is highlighted in the table below.</p>
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => setHighlightedLead(null)}
                                  >
                                    Clear Highlight
                                  </button>
                                </div>
                              )}
                              <div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <table className="table table-striped table-hover">
                                  <thead>
                                    <tr>
                                      <th></th>
                                      <th>#</th>
                                      <th>Row Index</th>
                                      <th>Name</th>
                                      <th>Email</th>
                                      <th>Phone</th>
                                      <th>Company</th>
                                      <th>Status</th>
                                      <th>Created At</th>
                                      <th>Updated At</th>
                                      {/* Dynamically add all columns from the CSV file */}
                                      {columns.map((column, index) => (
                                        <th key={index}>{column}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {leads.map((lead) => {
                                      const isExpanded = expandedRows.has(lead.id);
                                      const isHighlighted = highlightedLead === lead.id;
                                      return (
                                        <>
                                          <tr key={lead.id} className={isHighlighted ? 'table-warning' : ''}>
                                            <td>
                                              <button 
                                                className="btn btn-sm btn-light"
                                                onClick={() => toggleRowExpansion(lead.id)}
                                              >
                                                <i className={`ri-${isExpanded ? 'subtract' : 'add'}-line`}></i>
                                              </button>
                                            </td>
                                            <td>{lead.id.substring(0, 8)}...</td>
                                            <td>{lead.rowIndex}</td>
                                            <td>{lead.primaryName || 'N/A'}</td>
                                            <td>{lead.primaryEmail || 'N/A'}</td>
                                            <td>{lead.primaryPhone || 'N/A'}</td>
                                            <td>{lead.companyName || 'N/A'}</td>
                                            <td>
                                              <span className={`badge ${getLeadStatusBadgeClass(lead.currentStatus)}`}>
                                                {lead.currentStatus}
                                              </span>
                                            </td>
                                            <td>{formatDate(lead.createdAt)}</td>
                                            <td>{formatDate(lead.updatedAt)}</td>
                                            {/* Dynamically add all column values from the CSV file */}
                                            {columns.map((column, index) => (
                                              <td key={index} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {getRawPayloadValue(lead.rawPayload, column)}
                                              </td>
                                            ))}
                                          </tr>
                                          {isExpanded && (
                                            <tr>
                                              <td colSpan={10 + columns.length}>
                                                <div className="p-3 bg-light">
                                                  <h6>Raw Payload</h6>
                                                  <pre style={{ 
                                                    whiteSpace: 'pre-wrap', 
                                                    wordBreak: 'break-word',
                                                    maxHeight: '200px',
                                                    overflow: 'auto'
                                                  }}>
                                                    {JSON.stringify(lead.rawPayload, null, 2) || 'No raw payload available'}
                                                  </pre>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Pagination */}
                              {pagination.totalPages > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                  <div>
                                    Showing {(pagination.currentPage - 1) * pagination.limit + 1} to {
                                      Math.min(pagination.currentPage * pagination.limit, pagination.totalLeads)
                                    } of {pagination.totalLeads} leads
                                  </div>
                                  <div className="btn-group">
                                    <button 
                                      className="btn btn-outline-primary"
                                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                                      disabled={pagination.currentPage === 1}
                                    >
                                      Previous
                                    </button>
                                    <button className="btn btn-primary" disabled>
                                      Page {pagination.currentPage} of {pagination.totalPages}
                                    </button>
                                    <button 
                                      className="btn btn-outline-primary"
                                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                                      disabled={pagination.currentPage === pagination.totalPages}
                                    >
                                      Next
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <p className="mb-0">No leads found for this task</p>
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

export default TaskDetails;