import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Form, Modal, Spinner } from 'react-bootstrap';
import PageTitle from '../../Components/PageTitle';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MetaLeadsTeamLeader = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [teamExecutives, setTeamExecutives] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('assigned-leads');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [assignmentType, setAssignmentType] = useState('manual');
  const [selectedExecutive, setSelectedExecutive] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const leadCrmApiURL = process.env.REACT_APP_LEAD_CRM_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDashboardStats();
    fetchAssignedLeads();
    fetchTeamExecutives();
  }, []);

  useEffect(() => {
    fetchAssignedLeads();
  }, [currentPage, statusFilter, campaignFilter, dateFromFilter, dateToFilter]);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(
        `${leadCrmApiURL}/v1/meta-leads-tl/dashboard-stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`
          }
        }
      );
      
      if (response.data.success) {
        setDashboardStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to fetch dashboard statistics');
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
        date_from: dateFromFilter,
        date_to: dateToFilter
      });

      const response = await axios.get(
        `${leadCrmApiURL}/v1/meta-leads-tl/assigned-leads?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`
          }
        }
      );
      
      if (response.data.success) {
        setAssignedLeads(response.data.data.leads);
        setTotalPages(response.data.data.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
      setError('Failed to fetch assigned leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamExecutives = async () => {
    try {
      const response = await axios.get(
        `${leadCrmApiURL}/v1/meta-leads-tl/team-executives`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`
          }
        }
      );
      
      if (response.data.success) {
        setTeamExecutives(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching team executives:', error);
    }
  };

  const fetchAssignmentHistory = async () => {
    try {
      const response = await axios.get(
        `${leadCrmApiURL}/v1/meta-leads-tl/assignment-history`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`
          }
        }
      );
      
      if (response.data.success) {
        setAssignmentHistory(response.data.data.assignments);
      }
    } catch (error) {
      console.error('Error fetching assignment history:', error);
    }
  };

  const handleLeadSelection = (leadId) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const unassignedLeads = assignedLeads
        .filter(lead => !lead.executive_id)
        .map(lead => lead.id);
      setSelectedLeads(unassignedLeads);
    } else {
      setSelectedLeads([]);
    }
  };

  const assignLeadsToExecutives = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select leads to assign');
      return;
    }

    if (assignmentType === 'manual' && !selectedExecutive) {
      toast.error('Please select an executive for manual assignment');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${leadCrmApiURL}/v1/meta-leads-tl/assign-to-executives`,
        {
          lead_ids: selectedLeads,
          executive_id: assignmentType === 'manual' ? selectedExecutive : null,
          assignment_type: assignmentType
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Successfully assigned ${selectedLeads.length} leads`);
        setShowAssignModal(false);
        setSelectedLeads([]);
        setSelectedExecutive('');
        fetchAssignedLeads();
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error assigning leads:', error);
      toast.error(error.response?.data?.message || 'Failed to assign leads');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'NEW': return 'primary';
      case 'ASSIGNED': return 'info';
      case 'CONTACTED': return 'warning';
      case 'INTERESTED': return 'success';
      case 'NOT_INTERESTED': return 'danger';
      default: return 'secondary';
    }
  };

  const unassignedLeads = assignedLeads.filter(lead => !lead.executive_id);

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
      <PageTitle title="Meta Leads - Team Leader" primary="Lead Management" />
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Dashboard Stats */}
      {dashboardStats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="avatar-sm mx-auto mb-3">
                  <span className="avatar-title rounded-circle bg-primary text-white fs-4">
                    <i className="ri-user-line"></i>
                  </span>
                </div>
                <h4 className="mb-1 text-primary">{dashboardStats.overview.total_assigned || 0}</h4>
                <p className="text-muted mb-0">Total Assigned</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="avatar-sm mx-auto mb-3">
                  <span className="avatar-title rounded-circle bg-success text-white fs-4">
                    <i className="ri-user-add-line"></i>
                  </span>
                </div>
                <h4 className="mb-1 text-success">{dashboardStats.overview.assigned_to_executives || 0}</h4>
                <p className="text-muted mb-0">Assigned to Executives</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="avatar-sm mx-auto mb-3">
                  <span className="avatar-title rounded-circle bg-warning text-white fs-4">
                    <i className="ri-user-unfollow-line"></i>
                  </span>
                </div>
                <h4 className="mb-1 text-warning">{dashboardStats.overview.unassigned_to_executives || 0}</h4>
                <p className="text-muted mb-0">Pending Assignment</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="avatar-sm mx-auto mb-3">
                  <span className="avatar-title rounded-circle bg-info text-white fs-4">
                    <i className="ri-calendar-line"></i>
                  </span>
                </div>
                <h4 className="mb-1 text-info">{dashboardStats.overview.processed_today || 0}</h4>
                <p className="text-muted mb-0">Processed Today</p>
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
              <ul className="nav nav-tabs card-header-tabs" role="tablist">
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
                    className={`nav-link ${activeTab === 'team-performance' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('team-performance');
                    }}
                  >
                    <i className="ri-team-line me-1"></i>
                    Team Performance
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'assignment-history' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('assignment-history');
                      fetchAssignmentHistory();
                    }}
                  >
                    <i className="ri-history-line me-1"></i>
                    Assignment History
                  </button>
                </li>
              </ul>
            </Card.Header>
            
            <Card.Body>
              {/* Assigned Leads Tab */}
              {activeTab === 'assigned-leads' && (
                <div>
                  {/* Filters */}
                  <Row className="mb-3">
                    <Col md={2}>
                      <Form.Select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="NEW">New</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="INTERESTED">Interested</option>
                        <option value="NOT_INTERESTED">Not Interested</option>
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Control
                        type="text"
                        placeholder="Campaign filter"
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
                    <Col md={4} className="text-end">
                      {unassignedLeads.length > 0 && (
                        <Button 
                          variant="primary" 
                          onClick={() => setShowAssignModal(true)}
                          disabled={selectedLeads.length === 0}
                        >
                          <i className="ri-user-add-line me-1"></i>
                          Assign to Executives ({selectedLeads.length})
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
                                checked={selectedLeads.length === unassignedLeads.length && unassignedLeads.length > 0}
                              />
                            </th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Campaign</th>
                            <th>Status</th>
                            <th>Executive</th>
                            <th>Assigned Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignedLeads.map((lead) => (
                            <tr key={lead.id}>
                              <td>
                                <Form.Check
                                  type="checkbox"
                                  checked={selectedLeads.includes(lead.id)}
                                  onChange={() => handleLeadSelection(lead.id)}
                                  disabled={!!lead.executive_id}
                                />
                              </td>
                              <td>{lead.name || '-'}</td>
                              <td>{lead.email || '-'}</td>
                              <td>{lead.phone || '-'}</td>
                              <td>{lead.campaign_name || '-'}</td>
                              <td>
                                <Badge bg={getStatusBadgeColor(lead.status)}>
                                  {lead.status || 'UNKNOWN'}
                                </Badge>
                              </td>
                              <td>
                                {lead.executive_name ? (
                                  <span className="text-success">
                                    <i className="ri-user-line me-1"></i>
                                    {lead.executive_name}
                                  </span>
                                ) : (
                                  <span className="text-muted">
                                    <i className="ri-user-unfollow-line me-1"></i>
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td>{formatDate(lead.assigned_at)}</td>
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
                              {[...Array(totalPages)].map((_, index) => (
                                <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                  <button 
                                    className="page-link" 
                                    onClick={() => setCurrentPage(index + 1)}
                                  >
                                    {index + 1}
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
                      <p className="text-muted">No Meta leads have been assigned to your team yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Team Performance Tab */}
              {activeTab === 'team-performance' && dashboardStats && (
                <div>
                  <h5 className="mb-4">Team Executive Performance</h5>
                  
                  {dashboardStats.executives.length > 0 ? (
                    <div className="table-responsive">
                      <Table className="table-striped table-bordered">
                        <thead>
                          <tr>
                            <th>Executive</th>
                            <th>Email</th>
                            <th>Assigned Leads</th>
                            <th>Contacted</th>
                            <th>Interested</th>
                            <th>Processed Today</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardStats.executives.map((exec) => (
                            <tr key={exec.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="ri-user-line text-primary me-2"></i>
                                  {exec.name}
                                </div>
                              </td>
                              <td>{exec.email}</td>
                              <td>
                                <Badge bg="info">{exec.assigned_leads || 0}</Badge>
                              </td>
                              <td>
                                <Badge bg="warning">{exec.contacted_leads || 0}</Badge>
                              </td>
                              <td>
                                <Badge bg="success">{exec.interested_leads || 0}</Badge>
                              </td>
                              <td>
                                <Badge bg={exec.processed_today > 0 ? 'primary' : 'secondary'}>
                                  {exec.processed_today || 0}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="avatar-md mx-auto mb-4">
                        <div className="avatar-title bg-light text-muted rounded-circle fs-36">
                          <i className="ri-team-line"></i>
                        </div>
                      </div>
                      <h5 className="mb-3">No Team Members</h5>
                      <p className="text-muted">No executives assigned to your team.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Assignment History Tab */}
              {activeTab === 'assignment-history' && (
                <div>
                  <h5 className="mb-4">Assignment History</h5>
                  
                  {assignmentHistory.length > 0 ? (
                    <div className="table-responsive">
                      <Table className="table-striped table-bordered">
                        <thead>
                          <tr>
                            <th>Lead</th>
                            <th>Campaign</th>
                            <th>Executive</th>
                            <th>Assignment Type</th>
                            <th>Assigned Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignmentHistory.map((assignment, index) => (
                            <tr key={index}>
                              <td>
                                <div>
                                  <strong>{assignment.lead_name || '-'}</strong>
                                  <br />
                                  <small className="text-muted">{assignment.lead_email}</small>
                                </div>
                              </td>
                              <td>{assignment.campaign_name || '-'}</td>
                              <td>
                                <i className="ri-user-line text-success me-1"></i>
                                {assignment.executive_name}
                              </td>
                              <td>
                                <Badge bg={assignment.assignment_type === 'auto' ? 'info' : 'primary'}>
                                  {assignment.assignment_type === 'auto' ? 'Automatic' : 'Manual'}
                                </Badge>
                              </td>
                              <td>{formatDate(assignment.assigned_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="avatar-md mx-auto mb-4">
                        <div className="avatar-title bg-light text-muted rounded-circle fs-36">
                          <i className="ri-history-line"></i>
                        </div>
                      </div>
                      <h5 className="mb-3">No Assignment History</h5>
                      <p className="text-muted">No lead assignments have been made yet.</p>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Assignment Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Leads to Executives</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Assignment Type</Form.Label>
              <Form.Select 
                value={assignmentType} 
                onChange={(e) => setAssignmentType(e.target.value)}
              >
                <option value="manual">Manual Assignment</option>
                <option value="auto">Automatic Assignment</option>
              </Form.Select>
              <Form.Text className="text-muted">
                {assignmentType === 'auto' 
                  ? 'Leads will be automatically assigned to the executive with the least workload.'
                  : 'You can manually select which executive to assign the leads to.'
                }
              </Form.Text>
            </Form.Group>

            {assignmentType === 'manual' && (
              <Form.Group className="mb-3">
                <Form.Label>Select Executive</Form.Label>
                <Form.Select 
                  value={selectedExecutive} 
                  onChange={(e) => setSelectedExecutive(e.target.value)}
                >
                  <option value="">Choose an executive...</option>
                  {teamExecutives.map(exec => (
                    <option key={exec.id} value={exec.id}>
                      {exec.name} (Current: {exec.current_meta_leads} leads)
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Alert variant="info">
              <i className="ri-information-line me-2"></i>
              You are about to assign <strong>{selectedLeads.length}</strong> leads to 
              {assignmentType === 'auto' ? ' the system-selected executive' : ' the selected executive'}.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={assignLeadsToExecutives}
            disabled={loading || (assignmentType === 'manual' && !selectedExecutive)}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Assigning...
              </>
            ) : 'Assign Leads'}
          </Button>
        </Modal.Footer>
      </Modal>
        </div>
      </div>
    </div>
  );
};

export default MetaLeadsTeamLeader;