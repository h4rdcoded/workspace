import React, { useState, useEffect, useContext } from 'react';
import { Card, Container, Row, Col, Button, Form, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ConfigContext } from '../../Context/ConfigContext';
import PageTitle from '../../Components/PageTitle';
import { toast } from 'react-toastify';
import Select from 'react-select';

const MetaAdsLeads = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [metaLeads, setMetaLeads] = useState([]);
  const [accessToken, setAccessToken] = useState('');
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState(null);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [fetchingLeads, setFetchingLeads] = useState(false);
  const [savingLeads, setSavingLeads] = useState(false);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState(null);
  const [assigningLeads, setAssigningLeads] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [savedLeads, setSavedLeads] = useState([]);
  const { leadCrmApiURL } = useContext(ConfigContext);

  // Fetch team leaders for assignment
  useEffect(() => {
    const fetchTeamLeaders = async () => {
      try {
        const response = await axios.get(`${leadCrmApiURL}/api/v1/lead-crm/employees/role/TL`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          const tlOptions = response.data.data.map(tl => ({
            value: tl.id,
            label: tl.name
          }));
          setTeamLeaders(tlOptions);
        }
      } catch (error) {
        console.error('Error fetching team leaders:', error);
        setError('Failed to fetch team leaders. Please try again.');
      }
    };

    fetchTeamLeaders();
  }, []);

  // Fetch saved Meta leads
  const fetchSavedLeads = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${leadCrmApiURL}/api/v1/lead-crm/meta/leads`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setSavedLeads(response.data.data.leads);
        setTotal(response.data.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching saved Meta leads:', error);
      setError('Failed to fetch saved Meta leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedLeads();
  }, [page, limit]);

  // Fetch Meta Ads accounts
  const fetchMetaAccounts = async () => {
    if (!accessToken) {
      setError('Please enter a valid access token');
      return;
    }
    
    setFetchingAccounts(true);
    setError(null);
    
    try {
      const response = await axios.post(`/meta/fetch-leads`, 
        { accessToken },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success && response.data.data.data) {
        const accounts = response.data.data.data.map(account => ({
          value: account.account_id,
          label: `${account.name} (${account.account_id})`
        }));
        setAdAccounts(accounts);
        toast.success('Successfully fetched Meta Ads accounts');
        
        // If accounts are fetched successfully, automatically select the first one
        if (accounts.length > 0) {
          setSelectedAdAccount(accounts[0]);
        }
      } else {
        setError('No Meta Ads accounts found');
      }
    } catch (error) {
      console.error('Error fetching Meta Ads accounts:', error);
      setError(error.response?.data?.message || 'Failed to fetch Meta Ads accounts');
    } finally {
      setFetchingAccounts(false);
    }
  };

  // Fetch leads from selected ad account
  const fetchLeadsFromAccount = async () => {
    if (!accessToken || !selectedAdAccount) {
      setError('Please select an ad account');
      return;
    }
    
    setFetchingLeads(true);
    setError(null);
    
    try {
      const response = await axios.post(`/meta/fetch-leads-from-account`, 
        { 
          accessToken,
          accountId: selectedAdAccount.value 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success && response.data.data) {
        setMetaLeads(response.data.data);
        toast.success(`Successfully fetched ${response.data.data.length} leads from ${selectedAdAccount.label}`);
      } else {
        setError(response.data.message || 'No leads found for this account');
      }
    } catch (error) {
      console.error('Error fetching leads from ad account:', error);
      setError(error.response?.data?.message || 'Failed to fetch leads');
    } finally {
      setFetchingLeads(false);
    }
  };

  // Save leads to database
  const saveLeads = async () => {
    if (!metaLeads.length) {
      setError('No leads to save');
      return;
    }
    
    setSavingLeads(true);
    setError(null);
    
    try {
      const response = await axios.post(`${leadCrmApiURL}/api/v1/lead-crm/meta/save-leads`, 
        { leads: metaLeads },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success(`Successfully saved ${metaLeads.length} leads`);
        fetchSavedLeads();
      } else {
        setError('Failed to save leads');
      }
    } catch (error) {
      console.error('Error saving leads:', error);
      setError(error.response?.data?.message || 'Failed to save leads');
    } finally {
      setSavingLeads(false);
    }
  };

  // Assign leads to team leader
  const assignLeads = async () => {
    if (!selectedLeads.length) {
      setError('Please select leads to assign');
      return;
    }
    
    if (!selectedTeamLeader) {
      setError('Please select a team leader');
      return;
    }
    
    setAssigningLeads(true);
    setError(null);
    
    try {
      const response = await axios.post(`${leadCrmApiURL}/lead-crm/meta/assign`, 
        { 
          leadIds: selectedLeads,
          teamLeaderId: selectedTeamLeader.value
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success(`Successfully assigned ${selectedLeads.length} leads to ${selectedTeamLeader.label}`);
        setSelectedLeads([]);
        fetchSavedLeads();
      } else {
        setError('Failed to assign leads');
      }
    } catch (error) {
      console.error('Error assigning leads:', error);
      setError(error.response?.data?.message || 'Failed to assign leads');
    } finally {
      setAssigningLeads(false);
    }
  };

  // Handle lead selection
  const handleLeadSelection = (leadId) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  // Handle select all leads
  const handleSelectAll = () => {
    if (selectedLeads.length === savedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(savedLeads.map(lead => lead.id));
    }
  };

  return (
    <Container fluid className="pb-4">
      <PageTitle parent="Admin" title="Meta Ads Leads" />
      
      <div className="text-end mb-4">
        <Button 
          variant="primary" 
          onClick={() => navigate('/admin/meta-config')}
        >
          <i className="ri-settings-3-line me-1"></i> Meta Ads Configuration
        </Button>
      </div>
      
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      
      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h5 className="mb-4 fw-bold">Meta Ads Integration</h5>
              
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label htmlFor="accessToken" className="fw-medium">Meta Ads Access Token</Form.Label>
                      <Form.Control
                        type="text"
                        id="accessToken"
                        placeholder="Enter your Meta Ads access token"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        className="py-2"
                      />
                      <Form.Text className="text-muted">
                        You can get your access token from Meta Business Suite or Facebook Developer Console.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end mb-3">
                    <Button 
                      variant="primary" 
                      onClick={fetchMetaAccounts}
                      disabled={fetchingAccounts || !accessToken}
                      className="w-100 py-2"
                    >
                      {fetchingAccounts ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="ri-download-line me-1"></i>}
                      Fetch Ad Accounts
                    </Button>
                  </Col>
                </Row>
                
                {adAccounts.length > 0 && (
                  <Row className="mt-4">
                    <Col md="6">
                      <Form.Group className="mb-3">
                        <Form.Label htmlFor="adAccount" className="fw-medium">Select Ad Account</Form.Label>
                        <Select
                          id="adAccount"
                          options={adAccounts}
                          value={selectedAdAccount}
                          onChange={setSelectedAdAccount}
                          placeholder="Select an ad account"
                          className="basic-select"
                          classNamePrefix="select"
                        />
                      </Form.Group>
                    </Col>
                    <Col md="3" className="d-flex align-items-end mb-3">
                      <Button 
                        variant="info" 
                        onClick={fetchLeadsFromAccount}
                        disabled={fetchingLeads || !selectedAdAccount}
                        className="w-100 py-2"
                      >
                        {fetchingLeads ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="ri-file-list-line me-1"></i>}
                        Fetch Leads
                      </Button>
                    </Col>
                  </Row>
                )}
              </Form>
              
              {metaLeads.length > 0 && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">Fetched Leads ({metaLeads.length})</h6>
                    <Button 
                      variant="success" 
                      onClick={saveLeads}
                      disabled={savingLeads}
                    >
                      {savingLeads ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="ri-save-line me-1"></i>}
                      Save Leads to Database
                    </Button>
                  </div>
                  
                  <div className="table-responsive border rounded">
                    <Table bordered hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>ID</th>
                          <th>Campaign</th>
                          <th>Ad Set</th>
                          <th>Ad</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metaLeads.slice(0, 5).map((lead, index) => (
                          <tr key={lead.id}>
                            <td>{lead.id}</td>
                            <td>{lead.campaign_name || 'N/A'}</td>
                            <td>{lead.adset_name || 'N/A'}</td>
                            <td>{lead.ad_name || 'N/A'}</td>
                            <td>{new Date(lead.created_time).toLocaleString()}</td>
                          </tr>
                        ))}
                        {metaLeads.length > 5 && (
                          <tr>
                            <td colSpan="5" className="text-center">
                              ... and {metaLeads.length - 5} more leads
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col md="12">
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Saved Meta Ads Leads</h5>
                <div>
                  {selectedLeads.length > 0 && (
                    <div className="d-flex align-items-center">
                      <span className="me-2">Assign {selectedLeads.length} leads to:</span>
                      <div style={{ width: '200px' }} className="mx-2">
                        <Select
                          options={teamLeaders}
                          value={selectedTeamLeader}
                          onChange={setSelectedTeamLeader}
                          placeholder="Select Team Leader"
                          className="basic-select"
                          classNamePrefix="select"
                        />
                      </div>
                      <Button 
                        variant="primary" 
                        className="ms-2"
                        onClick={assignLeads}
                        disabled={assigningLeads || !selectedTeamLeader}
                      >
                        {assigningLeads ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="ri-user-assign-line me-1"></i>}
                        Assign
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading leads...</p>
                </div>
              ) : savedLeads.length > 0 ? (
                <div className="table-responsive border rounded">
                  <Table bordered hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="text-center" style={{width: "40px"}}>
                          <Form.Check 
                            type="checkbox" 
                            checked={selectedLeads.length === savedLeads.length && savedLeads.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Campaign</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="text-center">
                            <Form.Check 
                              type="checkbox" 
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => handleLeadSelection(lead.id)}
                              disabled={lead.status !== 'NEW'}
                            />
                          </td>
                          <td>{lead.full_name || 'N/A'}</td>
                          <td>{lead.email || 'N/A'}</td>
                          <td>{lead.phone || 'N/A'}</td>
                          <td>{lead.campaign_name || 'N/A'}</td>
                          <td>
                            <Badge bg={
                              lead.status === 'NEW' ? 'info' :
                              lead.status === 'ASSIGNED' ? 'primary' :
                              lead.status === 'PROCESSING' ? 'warning' :
                              lead.status === 'CONTACTED' ? 'secondary' :
                              lead.status === 'QUALIFIED' ? 'success' :
                              lead.status === 'CONVERTED' ? 'success' :
                              'danger'
                            }>
                              {lead.status}
                            </Badge>
                          </td>
                          <td>{new Date(lead.created_time).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light border-top">
                    <div>
                      <small className="text-muted">Showing {savedLeads.length} of {total} leads</small>
                    </div>
                    <div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setPage(page > 1 ? page - 1 : 1)}
                        disabled={page === 1}
                        className="me-2"
                      >
                        <i className="ri-arrow-left-s-line me-1"></i>
                        Previous
                      </Button>
                      <span className="mx-2">Page {page}</span>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setPage(page + 1)}
                        disabled={page * limit >= total}
                        className="ms-2"
                      >
                        Next
                        <i className="ri-arrow-right-s-line ms-1"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 border rounded bg-light">
                  <i className="ri-file-list-3-line fs-1 text-muted mb-3"></i>
                  <p className="mb-0">No Meta Ads leads found. Fetch and save leads from Meta Ads to see them here.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MetaAdsLeads;