import React, { useState, useEffect } from 'react';
import './Masters.css';

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    manager_id: '',
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = isEditing 
        ? `/api/v1/departments/${editingId}` 
        : '/api/v1/departments';
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
        fetchDepartments();
        resetForm();
        alert(isEditing ? 'Department updated successfully!' : 'Department created successfully!');
      } else {
        alert('Error saving department');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Error saving department');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department) => {
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      manager_id: department.manager_id || '',
      is_active: department.is_active
    });
    setIsEditing(true);
    setEditingId(department.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/departments/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchDepartments();
          alert('Department deleted successfully!');
        } else {
          alert('Error deleting department');
        }
      } catch (error) {
        console.error('Error deleting department:', error);
        alert('Error deleting department');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      manager_id: '',
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

  return (
    <div className="masters-container">
      <div className="masters-header">
        <h2>Department Management</h2>
      </div>

      <div className="masters-content">
        <div className="masters-form-section">
          <h3>{isEditing ? 'Edit Department' : 'Add New Department'}</h3>
          <form onSubmit={handleSubmit} className="masters-form">
            <div className="form-group">
              <label>Department Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter department name"
              />
            </div>

            <div className="form-group">
              <label>Department Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                placeholder="Enter department code"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter department description"
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
          <h3>Departments List</h3>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="masters-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(department => (
                    <tr key={department.id}>
                      <td>{department.name}</td>
                      <td>{department.code}</td>
                      <td>{department.description || '-'}</td>
                      <td>
                        <span className={`status ${department.is_active ? 'active' : 'inactive'}`}>
                          {department.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleEdit(department)}
                          className="btn-edit"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(department.id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {departments.length === 0 && (
                <div className="no-data">No departments found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Department;