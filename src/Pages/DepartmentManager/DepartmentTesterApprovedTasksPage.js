import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useNavigate } from 'react-router-dom';

const DepartmentTesterApprovedTasksPage = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const tasksPerPage = 15;

  // Fetch tester approved tasks for the department
  const fetchTesterApprovedTasks = async (page = 1) => {
    try {
      setLoading(true);
      
      // Get tasks with status 'TESTER_APPROVED' from the department
      const response = await axios.get(
        buildApiUrl(`/tasks/department/tester-approved?page=${page}&limit=${tasksPerPage}`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setTasks(response.data.data.tasks || []);
        if (response.data.data.pagination) {
          setTotalPages(response.data.data.pagination.total_pages || 1);
          setTotalTasks(response.data.data.pagination.total || 0);
          setCurrentPage(response.data.data.pagination.current_page || 1);
        }
      } else {
        toast.error(`Failed to load tasks: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching tester approved tasks:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to load tasks'}`);
      } else {
        toast.error('Network error: Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTesterApprovedTasks(currentPage);
  }, [currentPage]);

  // Handle navigation to task details page
  const goToTaskDetails = (taskId) => {
    navigate(`/team-leader/task-review/${taskId}`);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading tester approved tasks...</p>
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
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-0">Tester Approved Tasks</h4>
                      <p className="text-muted mb-0">Tasks approved by QA testers in your department</p>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate(-1)}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="row">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Tasks Approved by Testers</h5>
                        <span className="badge bg-success">{tasks.length} Tasks</span>
                      </div>
                    </div>
                    <div className="card-body">
                      {tasks.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-centered table-nowrap mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>#</th>
                                <th>Title</th>
                                <th>Assigned To</th>
                                <th>Tester</th>
                                <th>Approved Date</th>
                                <th>Priority</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tasks.map((task, index) => (
                                <tr key={task.id}>
                                  <td>
                                    {totalTasks - ((currentPage - 1) * tasksPerPage + index)}
                                  </td>
                                  <td>
                                    <h6 className="mb-0">{task.title?.substring(0,70) || 'No title'}</h6>
                                    <span className={`badge mt-1 ${
                                      task.task_type === 'DAILY_ROUTINE' ? 'bg-success' :
                                      task.task_type === 'MAIN_TASK' ? 'bg-primary' : 'bg-info'
                                    }`}>
                                      {task.task_type === 'DAILY_ROUTINE' ? 'Daily Routine' : 
                                       task.task_type === 'MAIN_TASK' ? 'Main Task' : 'Subtask'}
                                    </span>
                                  </td>
                                  <td>
                                    <span>{task.assigned_to_name || 'Unknown'}</span>
                                  </td>
                                  <td>
                                    <span>{task.tester_name || 'Not Assigned'}</span>
                                  </td>
                                  <td>
                                    <span>{task.updated_at ? new Date(task.updated_at).toLocaleString() : 'N/A'}</span>
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      task.priority === 'URGENT' ? 'bg-danger' :
                                      task.priority === 'HIGH' ? 'bg-warning' : 
                                      task.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                    }`}>
                                      {task.priority}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="d-flex gap-2">
                                      <button 
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => goToTaskDetails(task.id)}
                                      >
                                        <i className="ri-eye-line me-1"></i>
                                        View
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i className="ri-task-line display-4 text-muted"></i>
                          <h5 className="mt-3">No tester approved tasks</h5>
                          <p className="text-muted">There are no tasks approved by testers in your department yet.</p>
                        </div>
                      )}
                      {/* Pagination */}
                      {totalTasks > tasksPerPage && (
                        <div className="d-flex justify-content-center mt-4">
                          <nav aria-label="Tasks pagination">
                            <ul className="pagination">
                              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button 
                                  className="page-link" 
                                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </button>
                              </li>
                              
                              {/* Show first page */}
                              {currentPage > 2 && (
                                <li className="page-item">
                                  <button 
                                    className="page-link" 
                                    onClick={() => setCurrentPage(1)}
                                  >
                                    1
                                  </button>
                                </li>
                              )}
                              
                              {/* Show ellipsis if needed */}
                              {currentPage > 3 && (
                                <li className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              )}
                              
                              {/* Show current page and adjacent pages */}
                              {(() => {
                                const pages = [];
                                const maxVisiblePages = 3;
                                
                                // Calculate start and end page numbers to display
                                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                                
                                // Adjust start page if end page reaches the end
                                if (endPage - startPage + 1 < maxVisiblePages) {
                                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                }
                                
                                for (let i = startPage; i <= endPage; i++) {
                                  pages.push(
                                    <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                      <button 
                                        className="page-link" 
                                        onClick={() => setCurrentPage(i)}
                                      >
                                        {i}
                                      </button>
                                    </li>
                                  );
                                }
                                
                                return pages;
                              })()}
                              
                              {/* Show ellipsis if needed */}
                              {currentPage < totalPages - 2 && (
                                <li className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              )}
                              
                              {/* Show last page */}
                              {currentPage < totalPages - 1 && totalPages > 1 && (
                                <li className="page-item">
                                  <button 
                                    className="page-link" 
                                    onClick={() => setCurrentPage(totalPages)}
                                  >
                                    {totalPages}
                                  </button>
                                </li>
                              )}
                              
                              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button 
                                  className="page-link" 
                                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

export default DepartmentTesterApprovedTasksPage;