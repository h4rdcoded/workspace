import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const LeadAssignments = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const [searchParams] = useSearchParams();
  const [importRecords, setImportRecords] = useState([]);
  const [detailedAssignments, setDetailedAssignments] = useState([]);
  const [assignmentSummary, setAssignmentSummary] = useState(null);
  const [assignmentAnalytics, setAssignmentAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, detailed, analytics
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [currentStage, setCurrentStage] = useState(1); // 1: Upload, 2: Split, 3: Assign
  const [uploadedFile, setUploadedFile] = useState(null);
  const [splitConfig, setSplitConfig] = useState({ chunks: 2 });
  const [splitParts, setSplitParts] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [batchData, setBatchData] = useState(null);
  
  // Get URL parameters for specific highlighting/navigation
  const highlightLeadId = searchParams.get('leadId');
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    executiveId: '',
    status: '',
    page: 1,
    limit: 20,
    sortBy: 'assigned_at',
    sortOrder: 'DESC'
  });

  useEffect(() => {
    if (leadCrmUser?.role === 'TL') {
      fetchImportRecords();
      fetchExecutives();
      fetchDetailedAssignments();
      fetchAssignmentAnalytics();
      
      // Show notification if coming from search results
      if (highlightLeadId) {
        toast.info(`Search results for lead: ${highlightLeadId}`, {
          position: "top-right",
          autoClose: 3000
        });
      }
    }
  }, [leadCrmUser, highlightLeadId]);

  useEffect(() => {
    if (activeTab === 'detailed') {
      fetchDetailedAssignments();
    } else if (activeTab === 'analytics') {
      fetchAssignmentAnalytics();
    }
  }, [filters, activeTab]);

  const fetchImportRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${leadCrmApiURL}/leads/records?limit=20`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setImportRecords(data.data.records || []);
      } else {
        console.error('Failed to fetch import records');
      }
    } catch (error) {
      console.error('Error fetching import records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetailedAssignments = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        `${leadCrmApiURL}/leads/assignments/detailed?${queryParams.toString()}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setDetailedAssignments(data.data.assignments || []);
        setAssignmentSummary(data.data.summary || null);
      } else {
        console.error('Failed to fetch detailed assignments');
      }
    } catch (error) {
      console.error('Error fetching detailed assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignmentAnalytics = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('groupBy', 'date');

      const response = await fetch(
        `${leadCrmApiURL}/leads/assignments/analytics?${queryParams.toString()}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setAssignmentAnalytics(data.data || null);
      } else {
        console.error('Failed to fetch assignment analytics');
      }
    } catch (error) {
      console.error('Error fetching assignment analytics:', error);
    }
  };

  const fetchExecutives = async () => {
    try {
      const teamLeaderId = leadCrmUser.uuid || leadCrmUser.id;
      
      const response = await fetch(`${leadCrmApiURL}/teams/${teamLeaderId}/executives`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const executivesData = data.data || [];
        if (Array.isArray(executivesData)) {
          setExecutives(executivesData);
        } else {
          setExecutives([]);
        }
      } else {
        setExecutives([]);
      }
    } catch (error) {
      console.error('Error fetching executives:', error);
      setExecutives([]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('leadFile', file);

    try {
      const response = await fetch(`${leadCrmApiURL}/leads/import`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setBatchData(data.data.batch);
        setUploadedFile(file);
        setCurrentStage(2);
        toast.success('File uploaded successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file');
    }
  };

  const handleSplitFile = async () => {
    if (!batchData || !splitConfig.chunks) return;

    try {
      const response = await fetch(`${leadCrmApiURL}/leads/split`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchId: batchData.id,
          parts: parseInt(splitConfig.chunks)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSplitParts(data.data.parts);
        setCurrentStage(3);
        await fetchExecutives();
        toast.success('File split successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to split file');
      }
    } catch (error) {
      console.error('Error splitting file:', error);
      toast.error('Error splitting file');
    }
  };

  const handleAssignments = async () => {
    try {
      const assignmentPromises = splitParts.map((part, index) => {
        const executiveId = assignments[part.id];
        const note = `Part ${part.partIndex} - ${part.totalRows} leads to process`;
        
        if (!executiveId) return Promise.resolve();

        return fetch(`${leadCrmApiURL}/leads/assign`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            partId: part.id,
            executiveId: executiveId,
            note: note
          })
        });
      });

      const results = await Promise.all(assignmentPromises);
      const successCount = results.filter(r => r && r.ok).length;
      
      if (successCount > 0) {
        toast.success(`Successfully assigned ${successCount} parts to executives!`);
        setShowUploadModal(false);
        resetModal();
        fetchImportRecords();
        fetchDetailedAssignments();
        fetchAssignmentAnalytics();
      } else {
        toast.error('Failed to assign parts to executives');
      }
    } catch (error) {
      console.error('Error assigning parts:', error);
      toast.error('Error assigning parts');
    }
  };

  const resetModal = () => {
    setCurrentStage(1);
    setUploadedFile(null);
    setSplitConfig({ chunks: 2 });
    setSplitParts([]);
    setAssignments({});
    setBatchData(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-success';
      case 'IN_PROGRESS': return 'bg-primary';
      case 'SUBMITTED': return 'bg-info';
      case 'PENDING': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatProgress = (progress) => {
    return {
      completed: progress?.completionRate || 0,
      converted: progress?.conversionRate || 0,
      processed: progress?.processed || 0,
      total: progress?.totalAssigned || 0,
      interested: progress?.interested || 0
    };
  };

  if (leadCrmUser?.role !== 'TL') {
    return (
      <div className="alert alert-warning">
        <h4>Access Denied</h4>
        <p>This page is only accessible to Team Leaders.</p>
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
                <h4 className="mb-sm-0">Lead Assignments Management</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Dashboard</li>
                    <li className="breadcrumb-item active">Lead Assignments</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          {assignmentSummary && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="ri-bar-chart-line me-2"></i>
                      Assignment Overview
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-xl-2 col-md-4 col-6">
                        <div className="card border-primary border-opacity-25">
                          <div className="card-body text-center p-3">
                            <h4 className="text-primary mb-1">{assignmentSummary.totalAssignments}</h4>
                            <p className="text-muted mb-0 small">Total Assignments</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-2 col-md-4 col-6">
                        <div className="card border-success border-opacity-25">
                          <div className="card-body text-center p-3">
                            <h4 className="text-success mb-1">{assignmentSummary.completedAssignments}</h4>
                            <p className="text-muted mb-0 small">Completed</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-2 col-md-4 col-6">
                        <div className="card border-info border-opacity-25">
                          <div className="card-body text-center p-3">
                            <h4 className="text-info mb-1">{assignmentSummary.inProgressAssignments}</h4>
                            <p className="text-muted mb-0 small">In Progress</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-2 col-md-4 col-6">
                        <div className="card border-warning border-opacity-25">
                          <div className="card-body text-center p-3">
                            <h4 className="text-warning mb-1">{assignmentSummary.pendingAssignments}</h4>
                            <p className="text-muted mb-0 small">Pending</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-2 col-md-4 col-6">
                        <div className="card border-secondary border-opacity-25">
                          <div className="card-body text-center p-3">
                            <h4 className="text-secondary mb-1">{assignmentSummary.uniqueExecutives}</h4>
                            <p className="text-muted mb-0 small">Active Executives</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-2 col-md-4 col-6">
                        <div className="card border-dark border-opacity-25">
                          <div className="card-body text-center p-3">
                            <h4 className="text-dark mb-1">{assignmentSummary.totalLeadsAssigned.toLocaleString()}</h4>
                            <p className="text-muted mb-0 small">Total Leads</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title mb-1">Import & Assign Leads</h5>
                      <p className="text-muted mb-0">Upload CSV files and assign them to your team executives</p>
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowUploadModal(true)}
                    >
                      <i className="ri-upload-cloud-line me-1"></i>
                      Import New Leads
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <ul className="nav nav-tabs card-header-tabs" role="tablist">
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                      >
                        <i className="ri-dashboard-line me-1"></i>
                        Recent Imports
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'detailed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('detailed')}
                      >
                        <i className="ri-list-check-3 me-1"></i>
                        Detailed Assignments
                      </button>
                    </li>
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                      >
                        <i className="ri-bar-chart-box-line me-1"></i>
                        Analytics
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="card-body">
                  {/* Tab Content */}
                  {activeTab === 'overview' && (
                    <div>
                      {isLoading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : importRecords.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-striped table-hover">
                            <thead>
                              <tr>
                                <th>File Name</th>
                                <th>Total Rows</th>
                                <th>Status</th>
                                <th>Parts</th>
                                <th>Assigned</th>
                                <th>Imported At</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importRecords.map((record, index) => (
                                <tr key={index}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <i className="ri-file-text-line text-muted me-2"></i>
                                      <span>{record.filename}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge bg-info">{record.totalRows}</span>
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      record.status === 'COMPLETED' ? 'bg-success' : 
                                      record.status === 'PROCESSING' ? 'bg-warning' : 'bg-danger'
                                    }`}>
                                      {record.status}
                                    </span>
                                  </td>
                                  <td>{record.partsCount}</td>
                                  <td>{record.assignedTasks}</td>
                                  <td>{formatDate(record.importedAt)}</td>
                                  <td>
                                    <div className="dropdown">
                                      <button 
                                        className="btn btn-soft-secondary btn-sm dropdown-toggle" 
                                        type="button" 
                                        data-bs-toggle="dropdown"
                                      >
                                        Actions
                                      </button>
                                      <ul className="dropdown-menu dropdown-menu-end">
                                        <li>
                                          <button className="dropdown-item" onClick={() => {
                                            // This would open a batch details modal - implement if needed
                                            console.log('View batch details:', record.id);
                                          }}>
                                            <i className="ri-eye-line me-2"></i>View Details
                                          </button>
                                        </li>
                                      </ul>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="avatar-md mx-auto mb-4">
                            <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-36">
                              <i className="ri-file-list-3-line"></i>
                            </div>
                          </div>
                          <h5 className="mb-3">No Import Records</h5>
                          <p className="text-muted">
                            No lead files have been imported today. Click the "Import New Leads" button to get started.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'detailed' && (
                    <div>
                      {/* Filters */}
                      <div className="row mb-4">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-body p-3">
                              <div className="row g-3">
                                <div className="col-md-3">
                                  <label className="form-label small">From Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small">To Date</label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small">Executive</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={filters.executiveId}
                                    onChange={(e) => handleFilterChange('executiveId', e.target.value)}
                                  >
                                    <option value="">All Executives</option>
                                    {executives.map(exec => (
                                      <option key={exec.executiveId} value={exec.executiveId}>
                                        {exec.executiveName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small">Status</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                  >
                                    <option value="">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="COMPLETED">Completed</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Assignments Table */}
                      {isLoading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : detailedAssignments.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-striped table-hover">
                            <thead>
                              <tr>
                                <th>Executive</th>
                                <th>File Name</th>
                                <th>Part Details</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Assigned Date</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedAssignments.map((assignment, index) => {
                                const progress = formatProgress(assignment.progress);
                                return (
                                  <tr key={index}>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="avatar-xs me-2">
                                          <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-12">
                                            {assignment.executive?.name?.charAt(0) || 'U'}
                                          </div>
                                        </div>
                                        <div>
                                          <h6 className="mb-0">{assignment.executive?.name || 'Unassigned'}</h6>
                                          <small className="text-muted">{assignment.executive?.email || ''}</small>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        <span className="fw-medium">{assignment.batch?.filename}</span>
                                        <br />
                                        <small className="text-muted">{assignment.batch?.totalRows} total rows</small>
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        <span className="badge bg-light text-dark">Part {assignment.part?.index}</span>
                                        <br />
                                        <small className="text-muted">
                                          Rows {assignment.part?.rowStart}-{assignment.part?.rowEnd} 
                                          ({assignment.part?.totalRows} leads)
                                        </small>
                                      </div>
                                    </td>
                                    <td>
                                      <span className={`badge ${getStatusBadgeClass(assignment.status)}`}>
                                        {assignment.status}
                                      </span>
                                    </td>
                                    <td>
                                      <div>
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                          <small>Completion</small>
                                          <small>{progress.completed}%</small>
                                        </div>
                                        <div className="progress progress-sm mb-2">
                                          <div 
                                            className="progress-bar bg-success" 
                                            style={{ width: `${progress.completed}%` }}
                                          ></div>
                                        </div>
                                        <div className="d-flex justify-content-between text-muted">
                                          <small>{progress.processed}/{progress.total} processed</small>
                                          <small>{progress.interested} interested</small>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        <span>{formatDate(assignment.assignedAt)}</span>
                                        {assignment.submittedAt && (
                                          <><br /><small className="text-muted">Submitted: {formatDate(assignment.submittedAt)}</small></>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="dropdown">
                                        <button 
                                          className="btn btn-soft-secondary btn-sm dropdown-toggle" 
                                          type="button" 
                                          data-bs-toggle="dropdown"
                                        >
                                          Actions
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end">
                                          <li>
                                            <button 
                                              className="dropdown-item"
                                              onClick={() => handleViewDetails(assignment)}
                                            >
                                              <i className="ri-eye-line me-2"></i>View Details
                                            </button>
                                          </li>
                                          {assignment.executive?.id && (
                                            <li>
                                              <button 
                                                className="dropdown-item"
                                                onClick={() => {
                                                  // Navigate to executive history
                                                  console.log('View executive history:', assignment.executive.id);
                                                }}
                                              >
                                                <i className="ri-history-line me-2"></i>Executive History
                                              </button>
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="avatar-md mx-auto mb-4">
                            <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-36">
                              <i className="ri-task-line"></i>
                            </div>
                          </div>
                          <h5 className="mb-3">No Assignments Found</h5>
                          <p className="text-muted">
                            No assignments match the current filters. Try adjusting your search criteria.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'analytics' && (
                    <div>
                      {assignmentAnalytics ? (
                        <div>
                          {/* Date-wise Analytics */}
                          {assignmentAnalytics.analytics && assignmentAnalytics.analytics.length > 0 && (
                            <div className="row mb-4">
                              <div className="col-12">
                                <h6 className="mb-3">Date-wise Assignment Trends</h6>
                                <div className="table-responsive">
                                  <table className="table table-striped">
                                    <thead>
                                      <tr>
                                        <th>Date</th>
                                        <th>Total Assignments</th>
                                        <th>Completed</th>
                                        <th>In Progress</th>
                                        <th>Pending</th>
                                        <th>Leads Assigned</th>
                                        <th>Completion Rate</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {assignmentAnalytics.analytics.map((item, index) => (
                                        <tr key={index}>
                                          <td>{new Date(item.assignment_date).toLocaleDateString()}</td>
                                          <td>{item.total_assignments}</td>
                                          <td>
                                            <span className="badge bg-success">{item.completed_assignments}</span>
                                          </td>
                                          <td>
                                            <span className="badge bg-primary">{item.in_progress_assignments}</span>
                                          </td>
                                          <td>
                                            <span className="badge bg-warning">{item.pending_assignments}</span>
                                          </td>
                                          <td>{item.total_leads_assigned}</td>
                                          <td>
                                            <div className="d-flex align-items-center">
                                              <div className="progress progress-sm flex-grow-1 me-2">
                                                <div 
                                                  className="progress-bar bg-success" 
                                                  style={{ width: `${item.completion_rate}%` }}
                                                ></div>
                                              </div>
                                              <span className="small">{item.completion_rate}%</span>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Top Performers */}
                          {assignmentAnalytics.topPerformers && assignmentAnalytics.topPerformers.length > 0 && (
                            <div className="row">
                              <div className="col-12">
                                <h6 className="mb-3">Top Performing Executives</h6>
                                <div className="table-responsive">
                                  <table className="table table-striped">
                                    <thead>
                                      <tr>
                                        <th>Executive</th>
                                        <th>Total Assignments</th>
                                        <th>Completed</th>
                                        <th>Conversions</th>
                                        <th>Completion Rate</th>
                                        <th>Avg Completion Time</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {assignmentAnalytics.topPerformers.map((performer, index) => (
                                        <tr key={index}>
                                          <td>
                                            <div className="d-flex align-items-center">
                                              <div className="avatar-xs me-2">
                                                <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-12">
                                                  {performer.executive_name?.charAt(0) || 'U'}
                                                </div>
                                              </div>
                                              <span>{performer.executive_name}</span>
                                            </div>
                                          </td>
                                          <td>{performer.total_assignments}</td>
                                          <td>
                                            <span className="badge bg-success">{performer.completed_assignments}</span>
                                          </td>
                                          <td>
                                            <span className="badge bg-info">{performer.total_conversions}</span>
                                          </td>
                                          <td>
                                            <div className="d-flex align-items-center">
                                              <div className="progress progress-sm flex-grow-1 me-2">
                                                <div 
                                                  className="progress-bar bg-success" 
                                                  style={{ width: `${performer.completion_rate}%` }}
                                                ></div>
                                              </div>
                                              <span className="small">{performer.completion_rate}%</span>
                                            </div>
                                          </td>
                                          <td>
                                            <span className="badge bg-light text-dark">
                                              {performer.avg_completion_hours}h
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="avatar-md mx-auto mb-4">
                            <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-36">
                              <i className="ri-bar-chart-line"></i>
                            </div>
                          </div>
                          <h5 className="mb-3">No Analytics Data</h5>
                          <p className="text-muted">
                            No assignment data available for analytics. Start by importing and assigning leads.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detail Modal */}
          {showDetailModal && selectedAssignment && (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-xl">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      <i className="ri-eye-line me-2"></i>
                      Assignment Details
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close"
                      onClick={() => setShowDetailModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row">
                      {/* Assignment Info */}
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-header">
                            <h6 className="card-title mb-0">Assignment Information</h6>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-sm-6">
                                <p className="mb-2"><strong>Status:</strong></p>
                                <span className={`badge ${getStatusBadgeClass(selectedAssignment.status)}`}>
                                  {selectedAssignment.status}
                                </span>
                              </div>
                              <div className="col-sm-6">
                                <p className="mb-2"><strong>Assigned Date:</strong></p>
                                <p className="text-muted mb-0">{formatDate(selectedAssignment.assignedAt)}</p>
                              </div>
                            </div>
                            <hr />
                            <div className="row">
                              <div className="col-sm-6">
                                <p className="mb-2"><strong>Started:</strong></p>
                                <p className="text-muted mb-0">
                                  {selectedAssignment.startedAt ? formatDate(selectedAssignment.startedAt) : 'Not started'}
                                </p>
                              </div>
                              <div className="col-sm-6">
                                <p className="mb-2"><strong>Submitted:</strong></p>
                                <p className="text-muted mb-0">
                                  {selectedAssignment.submittedAt ? formatDate(selectedAssignment.submittedAt) : 'Not submitted'}
                                </p>
                              </div>
                            </div>
                            {selectedAssignment.note && (
                              <>
                                <hr />
                                <p className="mb-2"><strong>Note:</strong></p>
                                <p className="text-muted mb-0">{selectedAssignment.note}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Executive Info */}
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-header">
                            <h6 className="card-title mb-0">Executive Information</h6>
                          </div>
                          <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                              <div className="avatar-sm me-3">
                                <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-16">
                                  {selectedAssignment.executive?.name?.charAt(0) || 'U'}
                                </div>
                              </div>
                              <div>
                                <h6 className="mb-1">{selectedAssignment.executive?.name || 'Unassigned'}</h6>
                                <p className="text-muted mb-0">{selectedAssignment.executive?.email || ''}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row mt-3">
                      {/* File & Part Info */}
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-header">
                            <h6 className="card-title mb-0">File & Part Details</h6>
                          </div>
                          <div className="card-body">
                            <p className="mb-2"><strong>File Name:</strong></p>
                            <p className="text-muted mb-3">{selectedAssignment.batch?.filename}</p>
                            
                            <p className="mb-2"><strong>Part Information:</strong></p>
                            <div className="row">
                              <div className="col-6">
                                <span className="badge bg-light text-dark">Part {selectedAssignment.part?.index}</span>
                              </div>
                              <div className="col-6">
                                <span className="badge bg-info">{selectedAssignment.part?.totalRows} leads</span>
                              </div>
                            </div>
                            <p className="text-muted mt-2 mb-0">
                              Rows {selectedAssignment.part?.rowStart} - {selectedAssignment.part?.rowEnd}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Details */}
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-header">
                            <h6 className="card-title mb-0">Progress Details</h6>
                          </div>
                          <div className="card-body">
                            {(() => {
                              const progress = formatProgress(selectedAssignment.progress);
                              return (
                                <div>
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span>Completion Rate</span>
                                    <span className="fw-bold">{progress.completed}%</span>
                                  </div>
                                  <div className="progress mb-3">
                                    <div 
                                      className="progress-bar bg-success" 
                                      style={{ width: `${progress.completed}%` }}
                                    ></div>
                                  </div>
                                  
                                  <div className="row text-center">
                                    <div className="col-4">
                                      <h6 className="text-primary">{progress.processed}</h6>
                                      <p className="text-muted mb-0 small">Processed</p>
                                    </div>
                                    <div className="col-4">
                                      <h6 className="text-success">{progress.interested}</h6>
                                      <p className="text-muted mb-0 small">Interested</p>
                                    </div>
                                    <div className="col-4">
                                      <h6 className="text-info">{progress.converted}%</h6>
                                      <p className="text-muted mb-0 small">Conversion</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowDetailModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Import & Assign Leads</h5>
                    <button 
                      type="button" 
                      className="btn-close"
                      onClick={() => {
                        setShowUploadModal(false);
                        resetModal();
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {/* Progress Steps */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="d-flex justify-content-between">
                          <div className={`text-center ${currentStage >= 1 ? 'text-primary' : 'text-muted'}`}>
                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                              currentStage >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'
                            }`} style={{ width: '40px', height: '40px' }}>
                              <i className="ri-upload-line"></i>
                            </div>
                            <div className="mt-2">
                              <small>Upload File</small>
                            </div>
                          </div>
                          <div className={`text-center ${currentStage >= 2 ? 'text-primary' : 'text-muted'}`}>
                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                              currentStage >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'
                            }`} style={{ width: '40px', height: '40px' }}>
                              <i className="ri-scissors-line"></i>
                            </div>
                            <div className="mt-2">
                              <small>Select Chunks</small>
                            </div>
                          </div>
                          <div className={`text-center ${currentStage >= 3 ? 'text-primary' : 'text-muted'}`}>
                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                              currentStage >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'
                            }`} style={{ width: '40px', height: '40px' }}>
                              <i className="ri-user-add-line"></i>
                            </div>
                            <div className="mt-2">
                              <small>Assign Parts</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stage 1: Upload File */}
                    {currentStage === 1 && (
                      <div>
                        <h6 className="mb-3">Step 1: Upload Excel/CSV File</h6>
                        <div className="border-dashed border-2 border-primary rounded p-4 text-center">
                          <input
                            type="file"
                            accept=".csv,.xls,.xlsx,.xlsm,.xltx,.xltm"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const allowedExtensions = ['.csv', '.xls', '.xlsx', '.xlsm', '.xltx', '.xltm'];
                                const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                                
                                if (allowedExtensions.includes(fileExtension)) {
                                  handleFileUpload(file);
                                } else {
                                  toast.error('Please upload a valid file format (CSV, XLS, XLSX, XLSM, XLTX, XLTM)');
                                  e.target.value = '';
                                }
                              }
                            }}
                            className="d-none"
                            id="fileInput"
                          />
                          <label htmlFor="fileInput" className="cursor-pointer">
                            <i className="ri-upload-cloud-2-line fs-1 text-primary"></i>
                            <div className="mt-3">
                              <h6>Click to upload Excel/CSV file</h6>
                              <p className="text-muted mb-0">Supported: CSV, XLS, XLSX, XLSM, XLTX, XLTM (Max: 10MB)</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Stage 2: Select Chunks */}
                    {currentStage === 2 && (
                      <div>
                        <h6 className="mb-3">Step 2: Select Number of Chunks</h6>
                        {batchData && (
                          <div className="alert alert-info">
                            <strong>File:</strong> {batchData.filename}<br/>
                            <strong>Total Rows:</strong> {batchData.totalRows}
                          </div>
                        )}
                        <div className="mb-3">
                          <label className="form-label">Number of Chunks</label>
                          <input
                            type="number"
                            className="form-control"
                            min="2"
                            max={batchData?.totalRows || 10}
                            value={splitConfig.chunks}
                            onChange={(e) => setSplitConfig({ chunks: parseInt(e.target.value) })}
                          />
                          <div className="form-text">
                            Each chunk will have approximately {batchData ? Math.floor(batchData.totalRows / splitConfig.chunks) : 0} rows
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary"
                          onClick={handleSplitFile}
                        >
                          Split File
                        </button>
                      </div>
                    )}

                    {/* Stage 3: Assign Parts */}
                    {currentStage === 3 && (
                      <div>
                        <h6 className="mb-3">Step 3: Assign Parts to Executives</h6>
                        
                        {executives.length === 0 && (
                          <div className="alert alert-warning">
                            <i className="ri-alert-line me-2"></i>
                            <strong>No Executives Available</strong><br/>
                            You don't have any executives assigned to your team yet.
                            <div className="mt-3">
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={fetchExecutives}
                              >
                                <i className="ri-refresh-line me-1"></i>
                                Refresh Executive List
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {executives.length > 0 && splitParts.map((part, index) => (
                          <div key={part.id} className="card mb-3">
                            <div className="card-body">
                              <div className="row align-items-center">
                                <div className="col-md-6">
                                  <h6 className="mb-1">Part {part.partIndex}</h6>
                                  <small className="text-muted">
                                    Rows {part.rowStart} - {part.rowEnd} ({part.totalRows} leads)
                                  </small>
                                </div>
                                <div className="col-md-6">
                                  <select
                                    className="form-select"
                                    value={assignments[part.id] || ''}
                                    onChange={(e) => setAssignments({
                                      ...assignments,
                                      [part.id]: e.target.value
                                    })}
                                  >
                                    <option value="">Select Executive</option>
                                    {Array.isArray(executives) && executives.map(exec => (
                                      <option key={exec.executiveId} value={exec.executiveId}>
                                        {exec.executiveName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {executives.length > 0 && (
                          <button 
                            className="btn btn-success"
                            onClick={handleAssignments}
                            disabled={splitParts.some(part => !assignments[part.id])}
                          >
                            Complete Assignment
                          </button>
                        )}
                        
                        {executives.length === 0 && (
                          <button 
                            className="btn btn-secondary"
                            disabled
                          >
                            Complete Assignment
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadAssignments;