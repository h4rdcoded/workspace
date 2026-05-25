import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Form, Modal, Spinner } from 'react-bootstrap';
import PageTitle from '../../Components/PageTitle';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ConfigContext } from '../../Context/ConfigContext';

const MetaLeadsManagement = () => {
  const navigate = useNavigate();
  const { leadCrmApiURL } = useContext(ConfigContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [dailyStats, setDailyStats] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [newLeads, setNewLeads] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('daily-stats');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [assignmentType, setAssignmentType] = useState('manual');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchDailyStats();
    fetchCampaigns();
    fetchNewLeads();
    fetchTeamLeaders();
  }, [selectedDate]);

  const fetchDailyStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${leadCrmApiURL}/meta-leads-admin/daily-stats?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`
          }
        }
      );
      
      if (response.data.success) {
        setDailyStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      setError('Failed to fetch daily statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(
        `${leadCrmApiURL}/meta-leads-admin/campaigns-summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`
          }
        }
      );
      
      if (response.data.success) {
        setCampaigns(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchNewLeads = async () => {
    try {
      const response = await axios.get(
        `${leadCrmApiURL}/meta-leads-admin/new-leads?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`
          }
        }
      );
      
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        console.log('New Leads Data:', response.data.data);
        // The API returns an object with campaigns array, so we need to extract the campaigns
        setNewLeads(response.data.data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching new leads:', error);
    }
  };

  const fetchTeamLeaders = async () => {
    try {
      const response = await axios.get(
        `${leadCrmApiURL}/meta-leads-admin/team-leaders`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`
          }
        }
      );
      
      if (response.data.success) {
        setTeamLeaders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching team leaders:', error);
    }
  };

  const syncMetaLeads = async () => {
    try {
      setLoading(true);
      console.log('Starting sync with URL:', `${leadCrmApiURL}/meta-leads-admin/sync-daily`);
      console.log('Selected date:', selectedDate);
      console.log('Auth token:', localStorage.getItem('lead_crm_token') ? 'Present' : 'Missing');
      
      const response = await axios.post(
        `${leadCrmApiURL}/meta-leads-admin/sync-daily`,
        { date: selectedDate },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Sync response:', response);
      
      if (response.data.success) {
        toast.success('Meta leads synced successfully');
        fetchDailyStats();
        fetchNewLeads();
      } else {
        toast.error(response.data.message || 'Failed to sync leads');
      }
    } catch (error) {
      console.error('Error syncing leads:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      toast.error(`Failed to sync Meta leads: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSelection = (leadId) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const handleSelectAll = () => {
    // Get all lead IDs from all campaigns
    const allLeadIds = newLeads.flatMap(campaign => 
      campaign.leads ? campaign.leads.map(lead => lead.id) : []
    );
    
    if (selectedLeads.length === allLeadIds.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(allLeadIds);
    }
  };

  const assignLeadsToTeamLeaders = async (teamLeaderId = null) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${leadCrmApiURL}/meta-leads-admin/assign-to-team-leaders`,
        {
          leadIds: selectedLeads,
          teamLeaderId: teamLeaderId,
          assignmentType: assignmentType
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('lead_crm_token')}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success(`Successfully assigned ${selectedLeads.length} leads to team leaders`);
        setSelectedLeads([]);
        setShowAssignModal(false);
        fetchNewLeads();
      } else {
        toast.error(response.data.message || 'Failed to assign leads');
      }
    } catch (error) {
      console.error('Error assigning leads:', error);
      toast.error('Failed to assign leads to team leaders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Pagination logic for campaigns
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCampaigns = newLeads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(newLeads.length / itemsPerPage);
  
  // Calculate total leads count across all campaigns
  const totalLeadsCount = newLeads.reduce((total, campaign) => 
    total + (campaign.leads ? campaign.leads.length : 0), 0
  );

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <PageTitle parent="Admin" title="Meta Leads Management" />
          
          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      
      {/* Header Controls */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Date</Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button 
            variant="primary" 
            onClick={syncMetaLeads}
            disabled={loading}
            className="me-2"
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Syncing...
              </>
            ) : (
              <>
                <i className="ri-refresh-line me-1"></i>
                Sync Meta Leads
              </>
            )}
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => navigate('/admin/meta-leads-dashboard')}
          >
            <i className="ri-dashboard-line me-1"></i>
            View Dashboard
          </Button>
        </Col>
      </Row>

      {/* Navigation Tabs */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <ul className="nav nav-tabs card-header-tabs" role="tablist">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'daily-stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('daily-stats')}
                  >
                    <i className="ri-bar-chart-line me-1"></i>
                    Daily Statistics
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'campaigns' ? 'active' : ''}`}
                    onClick={() => setActiveTab('campaigns')}
                  >
                    <i className="ri-megaphone-line me-1"></i>
                    Campaigns
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'new-leads' ? 'active' : ''}`}
                    onClick={() => setActiveTab('new-leads')}
                  >
                    <i className="ri-user-add-line me-1"></i>
                    New Leads ({totalLeadsCount})
                  </button>
                </li>
              </ul>
            </Card.Header>
            
            <Card.Body>
              {/* Daily Statistics Tab */}
              {activeTab === 'daily-stats' && (
                <div>
                  <h5 className="mb-4">Daily Statistics for {formatDate(selectedDate)}</h5>
                  
                  {dailyStats.length > 0 ? (
                    <Row>
                      {dailyStats.map((stat, index) => (
                        <Col md={3} key={index} className="mb-3">
                          <Card className="border-0 shadow-sm">
                            <Card.Body className="text-center">
                              <div className="avatar-sm mx-auto mb-3">
                                <span className="avatar-title rounded-circle bg-primary text-white fs-4">
                                  <i className="ri-line-chart-line"></i>
                                </span>
                              </div>
                              <h4 className="mb-1 text-primary">{stat.total_leads || 0}</h4>
                              <p className="text-muted mb-0">{stat.campaign_name}</p>
                              <small className="text-muted">
                                Cost: {formatCurrency(stat.total_spend)}
                              </small>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <div className="avatar-md mx-auto mb-4">
                        <div className="avatar-title bg-light text-muted rounded-circle fs-36">
                          <i className="ri-bar-chart-line"></i>
                        </div>
                      </div>
                      <h5 className="mb-3">No Statistics Available</h5>
                      <p className="text-muted">No data found for the selected date.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Campaigns Tab */}
              {activeTab === 'campaigns' && (
                <div>
                  <h5 className="mb-4">Campaign Overview</h5>
                  
                  {campaigns.length > 0 ? (
                    <div className="table-responsive">
                      <Table className="table-striped table-bordered">
                        <thead>
                          <tr>
                            <th>Campaign Name</th>
                            <th>Status</th>
                            <th>Total Leads</th>
                            <th>Total Spend</th>
                            <th>Cost Per Lead</th>
                            <th>Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaigns.map((campaign, index) => (
                            <tr key={index}>
                              <td>{campaign.campaign_name}</td>
                              <td>
                                <Badge 
                                  className="badge-responsive badge-align-center"
                                  bg={campaign.status === 'ACTIVE' ? 'success' : 'warning'}
                                >
                                  {campaign.status}
                                </Badge>
                              </td>
                              <td>{campaign.total_leads || 0}</td>
                              <td>{formatCurrency(campaign.total_spend)}</td>
                              <td>{formatCurrency(campaign.cost_per_lead)}</td>
                              <td>{formatDate(campaign.updated_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="avatar-md mx-auto mb-4">
                        <div className="avatar-title bg-light text-muted rounded-circle fs-36">
                          <i className="ri-megaphone-line"></i>
                        </div>
                      </div>
                      <h5 className="mb-3">No Campaigns Found</h5>
                      <p className="text-muted">No campaign data available.</p>
                    </div>
                  )}
                </div>
              )}

              {/* New Leads Tab */}
              {activeTab === 'new-leads' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">New Leads for {formatDate(selectedDate)} - Campaign View</h5>
                    {totalLeadsCount > 0 && (
                      <div>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => setShowAssignModal(true)}
                          disabled={selectedLeads.length === 0}
                          className="me-2"
                        >
                          <i className="ri-user-add-line me-1"></i>
                          Assign Selected ({selectedLeads.length})
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={handleSelectAll}
                        >
                          {selectedLeads.length === newLeads.flatMap(c => c.leads || []).length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {currentCampaigns.length > 0 ? (
                    <>
                      {/* Campaign-wise Lead Display */}
                      {currentCampaigns.map((campaign, campaignIndex) => (
                        <div key={campaign.campaign_id || campaignIndex} className="mb-4">
                          <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-light">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="mb-1 text-primary">
                                    <i className="ri-megaphone-line me-2"></i>
                                    {campaign.campaign_name || 'Unknown Campaign'}
                                  </h6>
                                  <small className="text-muted">
                                    Account: {campaign.account_name || 'N/A'} | 
                                    Campaign ID: {campaign.campaign_id || 'N/A'} | 
                                    Total Leads: {campaign.total_leads || 0}
                                  </small>
                                </div>
                                <Badge bg="primary" className="fs-6">
                                  {campaign.total_leads || 0} leads
                                </Badge>
                              </div>
                            </Card.Header>
                            
                            {campaign.leads && campaign.leads.length > 0 ? (
                              <Card.Body className="p-0">
                                <div className="table-responsive">
                                  <Table className="table-striped table-bordered mb-0">
                                    <thead>
                                      <tr>
                                        <th width="50">
                                          <Form.Check
                                            type="checkbox"
                                            checked={campaign.leads.every(lead => selectedLeads.includes(lead.id))}
                                            onChange={(e) => {
                                              const campaignLeadIds = campaign.leads.map(lead => lead.id);
                                              if (e.target.checked) {
                                                setSelectedLeads([...new Set([...selectedLeads, ...campaignLeadIds])]);
                                              } else {
                                                setSelectedLeads(selectedLeads.filter(id => !campaignLeadIds.includes(id)));
                                              }
                                            }}
                                          />
                                        </th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Form</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {campaign.leads.map((lead, leadIndex) => (
                                        <tr key={lead.id || leadIndex}>
                                          <td>
                                            <Form.Check
                                              type="checkbox"
                                              checked={selectedLeads.includes(lead.id)}
                                              onChange={() => handleLeadSelection(lead.id)}
                                            />
                                          </td>
                                          <td>{lead.name || '-'}</td>
                                          <td>{lead.email || '-'}</td>
                                          <td>{lead.phone || '-'}</td>
                                          <td>{lead.form_name || '-'}</td>
                                          <td>
                                            <Badge 
                                              className="badge-responsive badge-align-center"
                                              bg={
                                                lead.assignment_status === 'ASSIGNED' ? 'success' :
                                                lead.assignment_status === 'PENDING' ? 'warning' : 'secondary'
                                              }
                                            >
                                              {lead.assignment_status || 'UNASSIGNED'}
                                            </Badge>
                                          </td>
                                          <td>{formatDate(lead.created_at)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              </Card.Body>
                            ) : (
                              <Card.Body>
                                <div className="text-center py-3">
                                  <small className="text-muted">No leads found for this campaign</small>
                                </div>
                              </Card.Body>
                            )}
                          </Card>
                        </div>
                      ))}
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            <small className="text-muted">
                              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, newLeads.length)} of {newLeads.length} campaigns
                              ({totalLeadsCount} total leads)
                            </small>
                          </div>
                          <div>
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="me-2"
                            >
                              Previous
                            </Button>
                            <span className="mx-2">Page {currentPage} of {totalPages}</span>
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="avatar-md mx-auto mb-4">
                        <div className="avatar-title bg-light text-muted rounded-circle fs-36">
                          <i className="ri-user-add-line"></i>
                        </div>
                      </div>
                      <h5 className="mb-3">No New Leads</h5>
                      <p className="text-muted">No new leads found for the selected date.</p>
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
          <Modal.Title>Assign Leads to Team Leaders</Modal.Title>
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
                <option value="automatic">Automatic Distribution</option>
              </Form.Select>
            </Form.Group>
            
            {assignmentType === 'manual' && (
              <Form.Group className="mb-3">
                <Form.Label>Select Team Leader</Form.Label>
                <Form.Select>
                  <option value="">Choose a team leader...</option>
                  {teamLeaders.map(leader => (
                    <option key={leader.id} value={leader.id}>
                      {leader.name} ({leader.email})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            
            <div className="mb-3">
              <strong>Selected Leads: {selectedLeads.length}</strong>
              <p className="text-muted">
                {assignmentType === 'automatic' 
                  ? 'Leads will be distributed evenly among all team leaders.'
                  : 'All selected leads will be assigned to the chosen team leader.'
                }
              </p>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => assignLeadsToTeamLeaders()}
            disabled={loading || (assignmentType === 'manual' && !document.querySelector('select[name="teamLeader"]')?.value)}
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

export default MetaLeadsManagement;