import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Row, Col, Card, Button, Table, Badge, Form, Spinner, Modal } from 'react-bootstrap';

const MetaLeadsExecutive = () => {
  const { leadCrmApiURL, leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // UI states
  const [activeTab, setActiveTab] = useState('assigned-leads');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const statusOptions = [
    { value: 'INTERESTED', label: 'Interested', color: 'success' },
    { value: 'NOT_INTERESTED', label: 'Not Interested', color: 'danger' },
    { value: 'BUSY', label: 'Busy', color: 'warning' },
    { value: 'CALL_LATER', label: 'Call Later', color: 'info' },
    { value: 'INVALID', label: 'Invalid', color: 'dark' },
    { value: 'DO_NOT_DISTURB', label: 'Do Not Disturb', color: 'secondary' }
  ];

  useEffect(() => {
    if (leadCrmUser?.role === 'EXEC') {
      fetchDashboardStats();
      fetchAssignedLeads();
    }
  }, [leadCrmUser]);

  useEffect(() => {
    if (leadCrmUser?.role === 'EXEC') {
      fetchAssignedLeads();
    }
  }, [currentPage, statusFilter, campaignFilter, dateFromFilter, dateToFilter]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${leadCrmApiURL}/v1/meta-leads-exec/dashboard-stats`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.data);
      } else {
        throw new Error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    }
  };

  const fetchAssignedLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
        campaign: campaignFilter,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter
      });

      const response = await fetch(`${leadCrmApiURL}/v1/meta-leads-exec/assigned-leads?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignedLeads(data.data.leads);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        throw new Error('Failed to fetch assigned leads');
      }
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
      setError('Failed to load assigned leads');
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId, status, notes = '') => {
    try {
      const response = await fetch(`${leadCrmApiURL}/v1/meta-leads-exec/leads/${leadId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status, notes })
      });
      
      if (response.ok) {
        toast.success('Lead status updated successfully');
        fetchAssignedLeads();
        fetchDashboardStats();
      } else {
        throw new Error('Failed to update lead status');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedLeads.length === 0 || !bulkStatus) {
      toast.warning('Please select leads and status');
      return;
    }

    try {
      const response = await fetch(`${leadCrmApiURL}/v1/meta-leads-exec/leads/bulk-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          leadIds: selectedLeads,
          status: bulkStatus,
          notes: bulkNotes
        })
      });
      
      if (response.ok) {
        toast.success(`Successfully updated ${selectedLeads.length} leads`);
        setSelectedLeads([]);
        setBulkStatus('');
        setBulkNotes('');
        setShowBulkUpdate(false);
        fetchAssignedLeads();
        fetchDashboardStats();
      } else {
        throw new Error('Failed to bulk update leads');
      }
    } catch (error) {
      console.error('Error bulk updating leads:', error);
      toast.error('Failed to bulk update leads');
    }
  };

  const fetchLeadDetails = async (leadId) => {
    try {
      const response = await fetch(`${leadCrmApiURL}/v1/meta-leads-exec/leads/${leadId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedLead(data.data);
        setShowDetailsModal(true);
      } else {
        throw new Error('Failed to fetch lead details');
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast.error('Failed to load lead details');
    }
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const unprocessedLeads = assignedLeads.filter(lead => lead.status === 'UNPROCESSED');
      setSelectedLeads(unprocessedLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const getStatusBadgeColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'secondary';
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.label : status;
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCampaignFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
  };

  // Check if user is executive
  if (leadCrmUser?.role !== 'EXEC') {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="alert alert-warning">
              <h4>Access Denied</h4>
              <p>This page is only accessible to Executives.</p>
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
          {/* Page Title */}
          <div className="row">
            <div className="col-12">
              <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 className="mb-sm-0">Meta Leads - Executive</h4>
                <div className="page-title-right">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item">Dashboard</li>
                    <li className="breadcrumb-item active">Meta Leads</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          {dashboardStats && (
            <Row className="mb-4">
              <Col md={3}>
                <Card className="border-primary">
                  <Card.Body className="text-center">
                    <i className="ri-user-line display-6 text-primary"></i>
                    <h4 className="mt-2 mb-1">{dashboardStats.totalAssigned}</h4>
                    <p className="text-muted mb-0">Total Assigned</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-success">
                  <Card.Body className="text-center">
                    <i className="ri-check-line display-6 text-success"></i>
                    <h4 className="mt-2 mb-1">{dashboardStats.todayActivity}</h4>
                    <p className="text-muted mb-0">Processed Today</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-warning">
                  <Card.Body className="text-center">
                    <i className="ri-time-line display-6 text-warning"></i>
                    <h4 className="mt-2 mb-1">
                      {dashboardStats.statusBreakdown.find(s => s.status === 'UNPROCESSED')?.count || 0}
                    </h4>
                    <p className="text-muted mb-0">Pending</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-info">
                  <Card.Body className="text-center">
                    <i className="ri-heart-line display-6 text-info"></i>
                    <h4 className="mt-2 mb-1">
                      {dashboardStats.statusBreakdown.find(s => s.status === 'INTERESTED')?.count || 0}
                    </h4>
                    <p className="text-muted mb-0">Interested</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Navigation Tabs */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <ul className="nav nav-tabs card-header-tabs">
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'assigned-leads' ? 'active' : ''}`}
                        onClick={() => setActiveTab('assigned-leads')}
                      >
                        <i className="ri-user-line me-1"></i>
                        Assigned Leads ({assignedLeads.length})
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'performance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('performance')}
                      >
                        <i className="ri-bar-chart-line me-1"></i>
                        Performance
                      </button>
                    </li>
                  </ul>
                </Card.Header>

                {/* Assigned Leads Tab */}
                {activeTab === 'assigned-leads' && (
                  <Card.Body>
                    {/* Filters */}
                    <Row className="mb-3">
                      <Col md={2}>
                        <Form.Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Status</option>
                          <option value="UNPROCESSED">Unprocessed</option>
                          {statusOptions.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          type="text"
                          placeholder="Campaign"
                          value={campaignFilter}
                          onChange={(e) => setCampaignFilter(e.target.value)}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          type="date"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Control
                          type="date"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                        />
                      </Col>
                      <Col md={2}>
                        <Button variant="outline-secondary" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      </Col>
                      <Col md={2} className="text-end">
                        {selectedLeads.length > 0 && (
                          <Button 
                            variant="primary" 
                            onClick={() => setShowBulkUpdate(true)}
                          >
                            Bulk Update ({selectedLeads.length})
                          </Button>
                        )}
                      </Col>
                    </Row>

                    {/* Leads Table */}
                    {loading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2">Loading leads...</p>
                      </div>
                    ) : assignedLeads.length > 0 ? (
                      <div className="table-responsive">
                        <Table className="table-striped table-bordered">
                          <thead>
                            <tr>
                              <th>
                                <Form.Check
                                  type="checkbox"
                                  onChange={(e) => handleSelectAll(e.target.checked)}
                                  checked={selectedLeads.length > 0 && selectedLeads.length === assignedLeads.filter(lead => lead.status === 'UNPROCESSED').length}
                                />
                              </th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Phone</th>
                              <th>Campaign</th>
                              <th>Status</th>
                              <th>Assigned</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignedLeads.map((lead) => (
                              <tr key={lead.id}>
                                <td>
                                  <Form.Check
                                    type="checkbox"
                                    checked={selectedLeads.includes(lead.id)}
                                    onChange={() => handleSelectLead(lead.id)}
                                    disabled={lead.status !== 'UNPROCESSED'}
                                  />
                                </td>
                                <td>{lead.name || '-'}</td>
                                <td>{lead.email || '-'}</td>
                                <td>{lead.phone || '-'}</td>
                                <td>{lead.campaign_name || '-'}</td>
                                <td>
                                  <Badge bg={getStatusBadgeColor(lead.status)}>
                                    {getStatusLabel(lead.status)}
                                  </Badge>
                                </td>
                                <td>{new Date(lead.assigned_at).toLocaleDateString()}</td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline-info"
                                      onClick={() => fetchLeadDetails(lead.id)}
                                    >
                                      <i className="ri-eye-line"></i>
                                    </Button>
                                    {lead.status === 'UNPROCESSED' && (
                                      <div className="dropdown">
                                        <Button
                                          size="sm"
                                          variant="outline-primary"
                                          className="dropdown-toggle"
                                          data-bs-toggle="dropdown"
                                        >
                                          Update
                                        </Button>
                                        <ul className="dropdown-menu">
                                          {statusOptions.map(status => (
                                            <li key={status.value}>
                                              <button
                                                className="dropdown-item"
                                                onClick={() => updateLeadStatus(lead.id, status.value)}
                                              >
                                                <Badge bg={status.color} className="me-2"></Badge>
                                                {status.label}
                                              </button>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>

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
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="avatar-md mx-auto mb-4">
                          <div className="avatar-title bg-light text-muted rounded-circle fs-36">
                            <i className="ri-user-line"></i>
                          </div>
                        </div>
                        <h5 className="mb-3">No Assigned Leads</h5>
                        <p className="text-muted">No Meta leads have been assigned to you yet.</p>
                      </div>
                    )}
                  </Card.Body>
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && dashboardStats && (
                  <Card.Body>
                    <h5 className="mb-4">Performance Overview</h5>
                    
                    {/* Status Breakdown */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card>
                          <Card.Header>
                            <h6 className="mb-0">Status Breakdown</h6>
                          </Card.Header>
                          <Card.Body>
                            {dashboardStats.statusBreakdown.map((status) => (
                              <div key={status.status} className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                  <Badge bg={getStatusBadgeColor(status.status)} className="me-2"></Badge>
                                  {getStatusLabel(status.status)}
                                </div>
                                <span className="fw-bold">{status.count}</span>
                              </div>
                            ))}
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card>
                          <Card.Header>
                            <h6 className="mb-0">Campaign Performance</h6>
                          </Card.Header>
                          <Card.Body>
                            {dashboardStats.campaignBreakdown.slice(0, 5).map((campaign) => (
                              <div key={campaign.campaign_name} className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                  <span className="fw-medium">{campaign.campaign_name}</span>
                                  <small className="text-muted d-block">
                                    {campaign.interested_count} interested
                                  </small>
                                </div>
                                <span className="fw-bold">{campaign.count}</span>
                              </div>
                            ))}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Card.Body>
                )}
              </Card>
            </Col>
          </Row>

          {/* Bulk Update Modal */}
          <Modal show={showBulkUpdate} onHide={() => setShowBulkUpdate(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Bulk Status Update</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Update status for {selectedLeads.length} selected leads:</p>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                >
                  <option value="">Select Status</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Notes (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Add notes for this status update..."
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowBulkUpdate(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleBulkStatusUpdate}>
                Update {selectedLeads.length} Leads
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Lead Details Modal */}
          <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Lead Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedLead && (
                <div>
                  <Row>
                    <Col md={6}>
                      <h6>Lead Information</h6>
                      <p><strong>Name:</strong> {selectedLead.lead.name || '-'}</p>
                      <p><strong>Email:</strong> {selectedLead.lead.email || '-'}</p>
                      <p><strong>Phone:</strong> {selectedLead.lead.phone || '-'}</p>
                      <p><strong>Campaign:</strong> {selectedLead.lead.campaign_name || '-'}</p>
                      <p><strong>Status:</strong> 
                        <Badge bg={getStatusBadgeColor(selectedLead.lead.status)} className="ms-2">
                          {getStatusLabel(selectedLead.lead.status)}
                        </Badge>
                      </p>
                    </Col>
                    <Col md={6}>
                      <h6>Assignment Information</h6>
                      <p><strong>Assigned By:</strong> {selectedLead.assignment.assigned_by_name}</p>
                      <p><strong>Assigned At:</strong> {new Date(selectedLead.assignment.assigned_at).toLocaleString()}</p>
                      {selectedLead.lead.notes && (
                        <p><strong>Notes:</strong> {selectedLead.lead.notes}</p>
                      )}
                    </Col>
                  </Row>
                  
                  {selectedLead.statusHistory && selectedLead.statusHistory.length > 0 && (
                    <div className="mt-4">
                      <h6>Status History</h6>
                      <div className="table-responsive">
                        <Table size="sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>From</th>
                              <th>To</th>
                              <th>Changed By</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedLead.statusHistory.map((history, index) => (
                              <tr key={index}>
                                <td>{new Date(history.changed_at).toLocaleString()}</td>
                                <td>
                                  <Badge bg={getStatusBadgeColor(history.old_status)}>
                                    {getStatusLabel(history.old_status)}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg={getStatusBadgeColor(history.new_status)}>
                                    {getStatusLabel(history.new_status)}
                                  </Badge>
                                </td>
                                <td>{history.changed_by_name}</td>
                                <td>{history.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default MetaLeadsExecutive;