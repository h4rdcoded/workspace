import React, { useState, useEffect, useContext } from 'react';
import { Card, Container, Row, Col, Button, Form, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { ConfigContext } from '../../Context/ConfigContext';
import PageTitle from '../../Components/PageTitle';
import { toast } from 'react-toastify';

const MetaAdsConfig = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    app_id: '',
    app_secret: '',
    access_token: '',
    is_active: true
  });
  const [error, setError] = useState(null);
  const { leadCrmApiURL } = useContext(ConfigContext);

  // Fetch existing configuration
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${leadCrmApiURL}/api/v1/lead-crm/meta/config`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success && response.data.data) {
          setConfig(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching Meta Ads configuration:', error);
        setError('Failed to fetch Meta Ads configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [leadCrmApiURL]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const saveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Create a new meta_ads_config table if it doesn't exist
      const createTableResponse = await axios.post(
        `${leadCrmApiURL}/api/v1/lead-crm/meta/create-table`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const response = await axios.post(`${leadCrmApiURL}/api/v1/lead-crm/meta/config`, 
        config,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Meta Ads configuration saved successfully');
      } else {
        setError('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving Meta Ads configuration:', error);
      setError(error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <PageTitle title="Configuration" breadcrumbItem="Meta Ads Configuration" />

          {error && <Alert variant="danger">{error}</Alert>}

          <Row>
            <Col lg={12}>
              <Card>
                <Card.Body>
                  <h4 className="card-title mb-4">Meta Ads API Configuration</h4>
                  
                  {loading ? (
                    <div className="text-center">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">Loading configuration...</p>
                    </div>
                  ) : (
                    <Form onSubmit={saveConfig}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label htmlFor="app_id">Meta App ID</Form.Label>
                            <Form.Control
                              type="text"
                              id="app_id"
                              name="app_id"
                              placeholder="Enter Meta App ID"
                              value={config.app_id}
                              onChange={handleInputChange}
                            />
                            <Form.Text className="text-muted">
                              You can find this in your Meta for Developers dashboard
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label htmlFor="app_secret">Meta App Secret</Form.Label>
                            <Form.Control
                              type="password"
                              id="app_secret"
                              name="app_secret"
                              placeholder="Enter Meta App Secret"
                              value={config.app_secret}
                              onChange={handleInputChange}
                            />
                            <Form.Text className="text-muted">
                              Keep this secret secure
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label htmlFor="access_token">Meta Access Token</Form.Label>
                            <Form.Control
                              type="text"
                              id="access_token"
                              name="access_token"
                              placeholder="Enter Meta Access Token"
                              value={config.access_token}
                              onChange={handleInputChange}
                            />
                            <Form.Text className="text-muted">
                              Long-lived access token for Meta Ads API
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-4">
                            <Form.Check
                              type="checkbox"
                              id="is_active"
                              name="is_active"
                              label="Enable Meta Ads Integration"
                              checked={config.is_active}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Configuration'
                        )}
                      </Button>
                    </Form>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="mt-4">
            <Col lg={12}>
              <Card>
                <Card.Body>
                  <h4 className="card-title mb-4">Meta Ads Integration Guide</h4>
                  
                  <div className="mb-4">
                    <h5>How to set up Meta Ads Integration:</h5>
                    <ol className="ps-3">
                      <li className="mb-2">Create a Meta for Developers account at <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer">developers.facebook.com</a></li>
                      <li className="mb-2">Create a new app with the "Business" type</li>
                      <li className="mb-2">Add the "Marketing API" product to your app</li>
                      <li className="mb-2">Generate a system user access token with the following permissions:
                        <ul className="mt-1">
                          <li>ads_management</li>
                          <li>ads_read</li>
                          <li>leads_retrieval</li>
                        </ul>
                      </li>
                      <li className="mb-2">Enter your App ID, App Secret, and Access Token in the form above</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h5>Important Notes:</h5>
                    <ul className="ps-3">
                      <li className="mb-2">Access tokens expire after a certain period. You'll need to refresh them periodically.</li>
                      <li className="mb-2">Keep your App Secret secure and never expose it in client-side code.</li>
                      <li className="mb-2">Make sure your Meta app has the necessary permissions to access lead data.</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default MetaAdsConfig;