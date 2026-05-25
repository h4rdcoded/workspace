import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const LeadManagement = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');

  const [task, setTask] = useState(null);
  const [leads, setLeads] = useState([]);
  const [statusSummary, setStatusSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');  
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState(null);
  const [updatingBulk, setUpdatingBulk] = useState(false);
  const [originalLeadStates, setOriginalLeadStates] = useState(new Map());
  const [pendingStatusChanges, setPendingStatusChanges] = useState(new Map()); // Store local changes
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const statusOptions = [
    { value: 'INTERESTED', label: 'Interested', color: 'success' },
    { value: 'NOT_INTERESTED', label: 'Not Interested', color: 'danger' },
    { value: 'BUSY', label: 'Busy', color: 'warning' },
    { value: 'CALL_LATER', label: 'Call Later', color: 'info' },
    { value: 'INVALID', label: 'Invalid', color: 'dark' },
    { value: 'DO_NOT_DISTURB', label: 'Do Not Disturb', color: 'secondary' }
  ];

  useEffect(() => {
    if (leadCrmUser?.role === 'EXEC' && taskId) {
      fetchTaskDetails();
    }
  }, [leadCrmUser, taskId, currentPage, statusFilter]);

  // Get dynamic columns from leads data
  const getDynamicColumns = (leadsData) => {
    if (!leadsData || leadsData.length === 0) return [];
    
    const sampleLead = leadsData[0];
    if (!sampleLead.rawData) return [];
    
    return Object.keys(sampleLead.rawData).filter(key => 
      key && key.trim() !== '' && sampleLead.rawData[key] !== null && sampleLead.rawData[key] !== undefined
    );
  };

  const fetchTaskDetails = async () => {
    setIsLoading(true);
    try {
      let url = `${leadCrmApiURL}/tasks/${taskId}?page=${currentPage}&limit=50`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data.data.task);
        const leadsData = data.data.leads || [];
        setLeads(leadsData);
        setStatusSummary(data.data.statusSummary || []);
        setTotalPages(data.data.pagination.totalPages);
        
        // Set dynamic columns from the first lead's raw data
        const columns = getDynamicColumns(leadsData);
        setDynamicColumns(columns);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fetch task details');
        navigate('/TodaysAssignedTasks');
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      toast.error('Error fetching task details');
    } finally {
      setIsLoading(false);
    }
  };

  // Update lead status locally (no server call - optimistic update)
  const updateLeadStatusLocally = (leadId, status, comment = '') => {
    console.log('Updating lead status locally:', { leadId, status, comment });
    
    // Store original state if not already stored
    const originalLead = leads.find(lead => lead.id === leadId);
    if (originalLead && !originalLeadStates.has(leadId)) {
      setOriginalLeadStates(prev => new Map(prev.set(leadId, {
        status: originalLead.currentStatus,
        originalData: { ...originalLead }
      })));
    }
    
    // Update the UI immediately (optimistic update)
    const newStatus = status === 'RESET' ? 'UNPROCESSED' : status;
    console.log('Local optimistic update to:', newStatus);
    
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId 
          ? { 
              ...lead, 
              currentStatus: newStatus,
              isLocallyModified: true // Flag to indicate local modification
            } 
          : lead
      )
    );
    
    // Store the pending change for batch submission
    setPendingStatusChanges(prev => {
      const newChanges = new Map(prev);
      newChanges.set(leadId, { 
        status, 
        comment: comment || `Status updated to ${getStatusLabel(newStatus)}`, 
        newStatus,
        timestamp: new Date().toISOString()
      });
      return newChanges;
    });
    
    // Update status summary immediately for better UX
    setStatusSummary(prevSummary => {
      const newSummary = [...prevSummary];
      const originalStatus = originalLeadStates.get(leadId)?.status || originalLead?.currentStatus;
      
      if (originalStatus) {
        // Decrease old status count
        const oldStatusIndex = newSummary.findIndex(s => s.status === originalStatus);
        if (oldStatusIndex !== -1) {
          newSummary[oldStatusIndex] = {
            ...newSummary[oldStatusIndex],
            count: Math.max(0, newSummary[oldStatusIndex].count - 1)
          };
        }
      }
      
      // Increase new status count
      const newStatusIndex = newSummary.findIndex(s => s.status === newStatus);
      if (newStatusIndex !== -1) {
        newSummary[newStatusIndex] = {
          ...newSummary[newStatusIndex],
          count: newSummary[newStatusIndex].count + 1
        };
      } else {
        // Add new status if it doesn't exist
        newSummary.push({ status: newStatus, count: 1 });
      }
      
      return newSummary.filter(s => s.count > 0);
    });
    
    // Close dropdown after selection
    const dropdownElement = document.querySelector(`#dropdown-${leadId}`);
    if (dropdownElement) {
      const dropdown = window.bootstrap?.Dropdown?.getInstance(dropdownElement);
      if (dropdown) {
        dropdown.hide();
      }
    }
    
    // Show local update notification
    toast.info(`Flag assigned locally: ${getStatusLabel(newStatus)}. Click Submit to save all changes.`, {
      autoClose: 2000
    });
  };

  const handleBulkUpdate = () => {
    if (selectedLeads.length === 0 || !bulkStatus) {
      toast.warning('Please select leads and choose a status');
      return;
    }
    
    // Apply bulk update locally (no server call)
    selectedLeads.forEach(leadId => {
      updateLeadStatusLocally(leadId, bulkStatus, `Bulk update to ${getStatusLabel(bulkStatus)}`);
    });
    
    // Reset bulk update UI
    setSelectedLeads([]);
    setBulkStatus('');
    setShowBulkUpdate(false);
    
    toast.success(`${selectedLeads.length} leads flagged locally. Click Submit to save all changes.`);
  };

  const submitTask = async () => {
    // Check if there are pending changes
    if (pendingStatusChanges.size === 0) {
      toast.warning('No flag assignments to save. Please assign flags to leads before submitting.');
      return;
    }

    setIsSubmittingTask(true);
    
    try {
      console.log('Submitting all pending flag assignments:', pendingStatusChanges);
      
      // Prepare updates for batch submission
      const updates = Array.from(pendingStatusChanges.entries()).map(([leadId, change]) => ({
        leadId,
        status: change.status,
        comment: change.comment || `Flag assigned: ${change.newStatus}`,
        timestamp: change.timestamp
      }));
      
      toast.info(`Saving ${updates.length} flag assignments to database...`, { autoClose: 3000 });
      
      // Submit all status changes in one batch
      const statusResponse = await fetch(`${leadCrmApiURL}/leads/bulk-status`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });
      
      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(errorData.message || 'Failed to save flag assignments');
      }
      
      console.log('Flag assignments saved successfully');
      toast.success(`Successfully saved ${updates.length} flag assignments!`, { autoClose: 3000 });
      
      // Clear pending changes after successful save
      setPendingStatusChanges(new Map());
      setOriginalLeadStates(new Map());
      
      // Update leads to remove local modification flags
      setLeads(prevLeads => 
        prevLeads.map(lead => ({
          ...lead,
          isLocallyModified: false
        }))
      );
      
      // Submit the task completion
      console.log('Submitting task completion...');
      const taskResponse = await fetch(`${leadCrmApiURL}/tasks/${taskId}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          note: `Task completed with ${updates.length} leads processed by executive` 
        })
      });

      if (taskResponse.ok) {
        toast.success('Task completed successfully!', { autoClose: 3000 });
        // Navigate back to assigned tasks after a short delay
        setTimeout(() => {
          navigate('/TodaysAssignedTasks');
        }, 1500);
      } else {
        const errorData = await taskResponse.json();
        toast.warning(`Flag assignments saved, but task submission failed: ${errorData.message || 'Unknown error'}`);
        // Don't navigate away if task submission fails
      }
    } catch (error) {
      console.error('Error submitting flag assignments:', error);
      toast.error(error.message || 'Error saving flag assignments');
      
      // Optionally refresh data to ensure consistency
      // fetchTaskDetails();
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const getStatusColor = (status) => {
    const statusData = statusOptions.find(s => s.value === status);
    if (statusData) {
      return statusData.color;
    }
    return status === 'UNPROCESSED' ? 'secondary' : 'light';
  };

  const getStatusBadge = (status) => {
    const statusData = statusOptions.find(s => s.value === status);
    if (statusData) {
      return `bg-${statusData.color}`;
    }
    return status === 'UNPROCESSED' ? 'bg-secondary' : 'bg-light text-dark';
  };

  const getStatusLabel = (status) => {
    const statusData = statusOptions.find(s => s.value === status);
    return statusData ? statusData.label : status;
  };

  const toggleLeadSelection = (leadId) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const selectAllLeads = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
  };

  if (leadCrmUser?.role !== 'EXEC') {
    return (
      <div className="alert alert-warning">
        <h4>Access Denied</h4>
        <p>This page is only accessible to Executives.</p>
      </div>
    );
  }

  if (!taskId) {
    return (
      <div className="alert alert-info">
        <h4>No Task Selected</h4>
        <p>Please select a task from your assigned tasks to manage leads.</p>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/TodaysAssignedTasks')}
        >
          Go to Assigned Tasks
        </button>
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
                <h4 className="mb-sm-0">Lead Management</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">
                      <button 
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => navigate('/TodaysAssignedTasks')}
                      >
                        Assigned Tasks
                      </button>
                    </li>
                    <li className="breadcrumb-item active">Lead Management</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Task Information */}
          {task && (
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="ri-file-list-3-line me-2"></i>
                      {task.filename} - Part {task.part.index}
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <p className="mb-2"><strong>From:</strong> {task.teamLeader}</p>
                        <p className="mb-2"><strong>Note:</strong> {task.note}</p>
                        <p className="mb-0"><strong>Assigned:</strong> {new Date(task.assignedAt).toLocaleString()}</p>
                      </div>
                      <div className="col-md-4">
                        <div className="text-end">
                          <span className={`badge ${task.status === 'PENDING' ? 'bg-warning' : task.status === 'IN_PROGRESS' ? 'bg-info' : 'bg-success'} fs-12 me-2`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          {(task.status === 'IN_PROGRESS' || task.status === 'PENDING') && (
                            <div className="d-flex gap-2">
                              {pendingStatusChanges.size > 0 && (
                                <span className="badge bg-warning text-dark align-self-center">
                                  {pendingStatusChanges.size} pending changes
                                </span>
                              )}
                              <button 
                                className={`btn btn-sm ${
                                  pendingStatusChanges.size > 0 
                                    ? 'btn-success' 
                                    : 'btn-outline-secondary'
                                }`}
                                onClick={submitTask}
                                disabled={isSubmittingTask || pendingStatusChanges.size === 0}
                                title={pendingStatusChanges.size === 0 ? 'No changes to submit' : `Submit ${pendingStatusChanges.size} flag assignments`}
                              >
                                {isSubmittingTask ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving Changes...
                                  </>
                                ) : (
                                  <>
                                    <i className="ri-save-line me-1"></i>
                                    Submit All Changes
                                    {pendingStatusChanges.size > 0 && ` (${pendingStatusChanges.size})`}
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <small className="text-muted">
                            Rows {task.part.rowStart} - {task.part.rowEnd} ({task.part.totalRows} leads)
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Changes Indicator */}
          {pendingStatusChanges.size > 0 && (
            <div className="row">
              <div className="col-12">
                <div className="alert alert-warning border-warning d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i className="ri-time-line me-2 fs-16"></i>
                    <div>
                      <strong>{pendingStatusChanges.size}</strong> flag assignments are pending locally.
                      <br />
                      <small className="text-muted">
                        These changes will be saved to the database when you click "Submit All Changes".
                      </small>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={submitTask}
                      disabled={isSubmittingTask}
                    >
                      {isSubmittingTask ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="ri-save-line me-1"></i>
                          Save Now
                        </>
                      )}
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        // Revert all pending changes
                        setPendingStatusChanges(new Map());
                        // Revert UI to original states
                        setLeads(prevLeads => 
                          prevLeads.map(lead => {
                            const originalData = originalLeadStates.get(lead.id);
                            return originalData 
                              
                             
                          })
                        );
                        setOriginalLeadStates(new Map());
                        // Refresh to get clean data from server
                        fetchTaskDetails();
                        toast.info('All pending flag assignments cleared');
                      }}
                      disabled={isSubmittingTask}
                    >
                      <i className="ri-close-line me-1"></i>
                      Discard Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Summary */}
          {statusSummary.length > 0 && (
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">Status Summary</h6>
                    <div className="row">
                      {statusSummary.map((status, index) => (
                        <div key={index} className="col-md-2 col-sm-4 col-6 mb-2">
                          <div className={`p-2 rounded text-center ${getStatusBadge(status.status)} text-white`}>
                            <div className="fw-bold">{status.count}</div>
                            <small>{getStatusLabel(status.status)}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Actions */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2 align-items-center">
                      <select 
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        <option value="all">All Status</option>
                        <option value="UNPROCESSED">Unprocessed</option>
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      {selectedLeads.length > 0 && (
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => setShowBulkUpdate(!showBulkUpdate)}
                        >
                          <i className="ri-flag-line me-1"></i>
                          Bulk Flag Assignment ({selectedLeads.length})
                        </button>
                      )}
                    </div>
                    <div>
                      <button 
                        className="btn btn-primary"
                        onClick={fetchTaskDetails}
                      >
                        <i className="ri-refresh-line"></i>
                      </button>
                    </div>
                  </div>

                  {/* Bulk Flag Assignment Section */}
                  {showBulkUpdate && (
                    <div className="mt-3 p-3 bg-light rounded border">
                      <h6 className="mb-3">
                        <i className="ri-flag-line me-2"></i>
                        Bulk Flag Assignment - {selectedLeads.length} leads selected
                      </h6>
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <label className="form-label">Select Flag to Assign:</label>
                          <select 
                            className="form-select"
                            value={bulkStatus}
                            onChange={(e) => setBulkStatus(e.target.value)}
                          >
                            <option value="">Choose a flag...</option>
                            {statusOptions.map(status => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex gap-2 mt-3 mt-md-0">
                            <button 
                              className="btn btn-success"
                              onClick={handleBulkUpdate}
                              disabled={!bulkStatus}
                            >
                              <i className="ri-flag-line me-1"></i>
                              Assign Flags to {selectedLeads.length} Leads
                            </button>
                            <button 
                              className="btn btn-secondary"
                              onClick={() => {
                                setShowBulkUpdate(false);
                                setSelectedLeads([]);
                                setBulkStatus('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <small className="text-muted">
                          <i className="ri-information-line me-1"></i>
                          Flags will be assigned locally and saved when you submit the task.
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : leads.length > 0 ? (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="showAllColumns" 
                            checked={showAllColumns}
                            onChange={(e) => setShowAllColumns(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="showAllColumns">
                            Show All Import Columns ({dynamicColumns.length} total)
                          </label>
                        </div>
                        <small className="text-muted">
                          {showAllColumns ? 'Showing all imported data columns' : 'Showing essential columns only'}
                        </small>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-striped table-hover">
                          <thead>
                            <tr>
                              <th>
                                <input
                                  type="checkbox"
                                  checked={selectedLeads.length === leads.length && leads.length > 0}
                                  onChange={selectAllLeads}
                                />
                              </th>
                              <th>Row</th>
                              {!showAllColumns && (
                                <>
                                  <th>Name</th>
                                  <th>Email</th>
                                  <th>Phone</th>
                                  <th>Company</th>
                                </>
                              )}
                              {showAllColumns && dynamicColumns.map((column, index) => (
                                <th key={index} style={{ minWidth: '120px' }}>
                                  {column.length > 15 ? `${column.substring(0, 15)}...` : column}
                                </th>
                              ))}
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leads.map((lead, index) => (
                              <tr key={lead.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedLeads.includes(lead.id)}
                                    onChange={() => toggleLeadSelection(lead.id)}
                                  />
                                </td>
                                <td>{lead.rowIndex}</td>
                                {!showAllColumns && (
                                  <>
                                    <td>{lead.primaryName || '-'}</td>
                                    <td>{lead.primaryEmail || '-'}</td>
                                    <td>{lead.primaryPhone || '-'}</td>
                                    <td>{lead.companyName || '-'}</td>
                                  </>
                                )}
                                {showAllColumns && dynamicColumns.map((column, colIndex) => (
                                  <td key={colIndex} title={lead.rawData[column]}>
                                    {lead.rawData[column] && lead.rawData[column].toString().length > 25 
                                      ? `${lead.rawData[column].toString().substring(0, 25)}...`
                                      : lead.rawData[column] || '-'
                                    }
                                  </td>
                                ))}
                                <td>
                                  <div className="d-flex align-items-center">
                                    <span className={`badge ${getStatusBadge(lead.currentStatus)} ${
                                      lead.isLocallyModified ? 'position-relative' : ''
                                    }`}>
                                      {getStatusLabel(lead.currentStatus)}
                                      {lead.isLocallyModified && (
                                        <span 
                                          className="position-absolute top-0 start-100 translate-middle p-1 bg-warning border border-light rounded-circle"
                                          title="Local change pending"
                                        >
                                          <span className="visually-hidden">Local change pending</span>
                                        </span>
                                      )}
                                    </span>
                                    {pendingStatusChanges.has(lead.id) && (
                                      <span className="badge bg-warning text-dark ms-2" title="Flag assignment pending - will be saved on submit">
                                        <i className="ri-time-line"></i> Pending
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="dropdown">
                                    <button 
                                      id={`dropdown-${lead.id}`}
                                      className={`btn btn-sm dropdown-toggle ${
                                        lead.currentStatus === 'UNPROCESSED' 
                                          ? 'btn-outline-primary' 
                                          : `btn-${getStatusColor(lead.currentStatus).replace('bg-', '')}`
                                      }`}
                                      data-bs-toggle="dropdown"
                                      type="button"
                                    >
                                      {lead.currentStatus === 'UNPROCESSED' ? 'Assign Flag' : 'Change Flag'}
                                    </button>
                                    <ul className="dropdown-menu">
                                      {lead.currentStatus === 'UNPROCESSED' ? (
                                        // Show all status options for unprocessed leads
                                        statusOptions.map(status => (
                                          <li key={status.value}>
                                            <button 
                                              className="dropdown-item d-flex align-items-center"
                                              onClick={() => updateLeadStatusLocally(lead.id, status.value)}
                                            >
                                              <span className={`badge bg-${status.color} me-2`}></span>
                                              {status.label}
                                            </button>
                                          </li>
                                        ))
                                      ) : (
                                        // For leads with existing status, show only other options and remove option
                                        <>
                                          {statusOptions
                                            .filter(status => status.value !== lead.currentStatus)
                                            .map(status => (
                                            <li key={status.value}>
                                              <button 
                                                className="dropdown-item d-flex align-items-center"
                                                onClick={() => updateLeadStatusLocally(lead.id, status.value)}
                                              >
                                                <span className={`badge bg-${status.color} me-2`}></span>
                                                {status.label}
                                              </button>
                                            </li>
                                          ))}
                                          <li><hr className="dropdown-divider" /></li>
                                          <li>
                                            <button 
                                              className="dropdown-item d-flex align-items-center text-danger"
                                              onClick={() => updateLeadStatusLocally(lead.id, 'RESET')}
                                            >
                                              <i className="ri-close-line me-2"></i>
                                              Remove Flag
                                            </button>
                                          </li>
                                        </>
                                      )}
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-3">
                          <nav>
                            <ul className="pagination">
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button 
                                  className="page-link"
                                  onClick={() => setCurrentPage(currentPage - 1)}
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </button>
                              </li>
                              {[...Array(totalPages)].map((_, i) => (
                                <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                  <button 
                                    className="page-link"
                                    onClick={() => setCurrentPage(i + 1)}
                                  >
                                    {i + 1}
                                  </button>
                                </li>
                              ))}
                              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button 
                                  className="page-link"
                                  onClick={() => setCurrentPage(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                </button>
                              </li>
                            </ul>
                          </nav>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="avatar-md mx-auto mb-4">
                        <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-36">
                          <i className="ri-file-list-line"></i>
                        </div>
                      </div>
                      <h5 className="mb-3">No Leads Found</h5>
                      <p className="text-muted">
                        {statusFilter === 'all' 
                          ? "No leads available for this task."
                          : `No leads found with status: ${getStatusLabel(statusFilter)}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadManagement;