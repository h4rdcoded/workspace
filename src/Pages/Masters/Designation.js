import React, { useState, useEffect } from 'react';
import './Masters.css';

const Designation = () => {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    department_id: '',
    description: '',
    level: '',
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDesignations();
    fetchDepartments();
  }, []);

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/designations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDesignations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching designations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/v1/departments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = isEditing 
        ? `/api/v1/designations/${editingId}` 
        : '/api/v1/designations';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchDesignations();
        resetForm();
        alert(isEditing ? 'Designation updated successfully!' : 'Designation created successfully!');
      } else {
        alert('Error saving designation');
      }
    } catch (error) {
      console.error('Error saving designation:', error);
      alert('Error saving designation');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (designation) => {
    setFormData({
      title: designation.title,
      code: designation.code,
      department_id: designation.department_id || '',
      description: designation.description || '',
      level: designation.level || '',
      is_active: designation.is_active
    });
    setIsEditing(true);
    setEditingId(designation.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this designation?')) {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/designations/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchDesignations();
          alert('Designation deleted successfully!');
        } else {
          alert('Error deleting designation');
        }
      } catch (error) {
        console.error('Error deleting designation:', error);
        alert('Error deleting designation');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      department_id: '',
      description: '',
      level: '',
      is_active: true
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getDepartmentName = (departmentId) => {
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : '-';
  };

  return (
    <div className="masters-container">
      <div className="masters-header">
        <h2>Designation Management</h2>
      </div>

      <div className="masters-content">
        <div className="masters-form-section">
          <h3>{isEditing ? 'Edit Designation' : 'Add New Designation'}</h3>
          <form onSubmit={handleSubmit} className="masters-form">
            <div className="form-group">
              <label>Designation Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter designation title"
              />
            </div>

            <div className="form-group">
              <label>Designation Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                placeholder="Enter designation code"
              />
            </div>

            <div className="form-group">
              <label>Department</label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
              >
                <option value="">Select Department</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
              >
                <option value="">Select Level</option>
                <option value="Entry">Entry Level</option>
                <option value="Junior">Junior Level</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior Level</option>
                <option value="Lead">Lead Level</option>
                <option value="Manager">Manager Level</option>
                <option value="Director">Director Level</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter designation description"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                Active
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="masters-list-section">
          <h3>Designations List</h3>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="masters-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Code</th>
                    <th>Department</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {designations.map(designation => (
                    <tr key={designation.id}>
                      <td>{designation.title}</td>
                      <td>{designation.code}</td>
                      <td>{getDepartmentName(designation.department_id)}</td>
                      <td>{designation.level || '-'}</td>
                      <td>
                        <span className={`status ${designation.is_active ? 'active' : 'inactive'}`}>
                          {designation.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleEdit(designation)}
                          className="btn-edit"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(designation.id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {designations.length === 0 && (
                <div className="no-data">No designations found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Designation;