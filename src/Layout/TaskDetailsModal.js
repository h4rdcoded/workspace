import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigContext } from '../Context/ConfigContext';
import EmployeeProfileModal from './EmployeeProfileModal';
import { buildApiUrl, getAuthHeaders } from '../config/api';
import axios from 'axios';

const TaskDetailsModal = ({ task, isOpen, onClose }) => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [lastComment, setLastComment] = useState(null);
  const [loadingComment, setLoadingComment] = useState(false);

  // Close modal with smooth animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  // Handle view more details navigation based on role
  const handleViewMoreDetails = () => {
    if (!task || !task.id) return;
    
    const taskId = task.id;
    const userRole = leadCrmUser?.role;

    // Navigate based on role
    if (userRole === 'ADMIN') {
      navigate(`/admin/task_Approvel/${taskId}`);
    } else if (userRole === 'TL') {
      navigate(`/team-leader/task-review/${taskId}`);
    } else if (userRole === 'EMPL') {
      navigate(`/employee/task/${taskId}`);
      } else if (userRole === 'QA_TESTER') {
        navigate(`/employee/task/${taskId}`);
    } else {
      // Default fallback
      navigate(`/employee/task/${taskId}`);
    }
    
    handleClose();
  };

  // Calculate time elapsed from assigned date
  const getTimeElapsed = () => {
    if (!task) return null;
    
    const assignedDate = task.assigned_at || task.created_at;
    if (!assignedDate) return null;

    const now = new Date();
    const assigned = new Date(assignedDate);
    const diffMs = now - assigned;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
  };

  // Get total time assigned (estimated or actual)
  const getTotalTime = () => {
    if (!task) return null;
    
    if (task.actual_hours) {
      return `${task.actual_hours} hour${task.actual_hours !== 1 ? 's' : ''}`;
    } else if (task.estimated_hours) {
      return `${task.estimated_hours} hour${task.estimated_hours !== 1 ? 's' : ''} (estimated)`;
    }
    return null;
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'ASSIGNED': return 'bg-secondary';
      case 'IN_PROGRESS': return 'bg-info';
      case 'SUBMITTED': return 'bg-violet';
      case 'IN_REVIEW': return 'bg-info';
      case 'RETURNED': return 'bg-warning';
      case 'APPROVED': return 'bg-success';
      case 'COMPLETED': return 'bg-success';
      case 'CANCELLED': return 'bg-danger';
      case 'CREATED': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'bg-success';
      case 'MEDIUM': return 'bg-info';
      case 'HIGH': return 'bg-warning';
      case 'URGENT': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  // Get task type badge color
  const getTaskTypeBadgeColor = (taskType) => {
    switch (taskType) {
      case 'MAIN_TASK': return 'bg-primary';
      case 'SUBTASK': return 'bg-info';
      case 'DAILY_ROUTINE': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get short description (first 100 characters)
  const getShortDescription = () => {
    if (!task || !task.description) return 'No description available';
    const desc = String(task.description).trim();
    if (desc.length <= 100) return desc;
    return desc.substring(0, 100) + '...';
  };

  // Calculate time elapsed in days, hours, minutes
  const getTimeElapsedDetails = () => {
    if (!task) return null;
    
    const assignedDate = task.assigned_at || task.created_at;
    if (!assignedDate) return null;

    const now = new Date();
    const assigned = new Date(assignedDate);
    const diffMs = now - assigned;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { days: diffDays, hours: diffHours, minutes: diffMinutes, totalMs: diffMs };
  };

  // Calculate time taken (if completed)
  const getTimeTakenDetails = () => {
    if (!task) return null;
    
    const startDate = task.started_at || task.assigned_at || task.created_at;
    const endDate = task.completed_at || (task.status === 'COMPLETED' ? new Date() : null);
    
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { days: diffDays, hours: diffHours, minutes: diffMinutes, totalMs: diffMs };
  };

  // Calculate due date progress
  const getDueDateProgress = () => {
    if (!task || !task.due_date) return null;
    
    const now = new Date();
    const dueDate = new Date(task.due_date);
    const assignedDate = task.assigned_at || task.created_at;
    
    if (!assignedDate) return null;
    
    const assigned = new Date(assignedDate);
    const totalMs = dueDate - assigned;
    const elapsedMs = now - assigned;
    
    if (totalMs <= 0) return null;
    
    const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
    const isOverdue = now > dueDate && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
    const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    return { progress, isOverdue, daysRemaining, totalMs, elapsedMs };
  };

  // Handle employee click
  const handleEmployeeClick = (employeeData) => {
    if (!employeeData) return;
    setSelectedEmployee(employeeData);
    setShowEmployeeModal(true);
  };

  // Close employee modal
  const handleCloseEmployeeModal = () => {
    setShowEmployeeModal(false);
    setSelectedEmployee(null);
  };

  // Fetch the most recent comment/update to determine what was changed
  useEffect(() => {
    const fetchLastComment = async () => {
      if (!isOpen || !task || !task.id) {
        setLastComment(null);
        return;
      }

      try {
        setLoadingComment(true);
        const response = await axios.get(
          buildApiUrl(`/tasks/${task.id}/comments`),
          { headers: getAuthHeaders() }
        );

        if (response.data.success && response.data.data.comments) {
          // Get the most recent comment (they should be sorted, but sort again to be sure)
          const comments = response.data.data.comments.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          
          if (comments.length > 0) {
            // Find the most recent UPDATE comment or the most recent comment
            const updateComment = comments.find(c => c.comment_type === 'UPDATE') || comments[0];
            setLastComment(updateComment);
          } else {
            setLastComment(null);
          }
        } else {
          setLastComment(null);
        }
      } catch (error) {
        console.error('Error fetching task comments:', error);
        setLastComment(null);
      } finally {
        setLoadingComment(false);
      }
    };

    fetchLastComment();
  }, [isOpen, task?.id]);

  // Determine what was last modified
  const getLastModification = () => {
    if (!task) return null;

    const modifications = [];
    const now = new Date();

    // Check status change (if completed_at exists, status was likely changed to completed)
    if (task.completed_at) {
      modifications.push({
        field: 'Status',
        value: 'COMPLETED',
        timestamp: new Date(task.completed_at),
        description: 'Task was completed'
      });
    }

    // Check if started_at exists (status changed to IN_PROGRESS)
    if (task.started_at) {
      modifications.push({
        field: 'Status',
        value: 'IN_PROGRESS',
        timestamp: new Date(task.started_at),
        description: 'Task was started'
      });
    }

    // Check assigned_at (assignment change)
    if (task.assigned_at) {
      modifications.push({
        field: 'Assignment',
        value: task.assigned_to_name || 'Assigned',
        timestamp: new Date(task.assigned_at),
        description: 'Task was assigned'
      });
    }

    // Check due_date (if it's recent, it might have been modified)
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const daysDiff = Math.abs((now - dueDate) / (1000 * 60 * 60 * 24));
      if (daysDiff < 30) { // If due date is within 30 days, consider it might have been recently set
        modifications.push({
          field: 'Due Date',
          value: formatDate(task.due_date),
          timestamp: dueDate,
          description: 'Due date was set'
        });
      }
    }

    // Check updated_at (general update)
    if (task.updated_at) {
      modifications.push({
        field: 'General',
        value: 'Updated',
        timestamp: new Date(task.updated_at),
        description: 'Task was updated'
      });
    }

    // Sort by timestamp and get the most recent
    if (modifications.length > 0) {
      modifications.sort((a, b) => b.timestamp - a.timestamp);
      return modifications[0];
    }

    return null;
  };

  // Parse change summary from comment to extract specific changes
  const parseChangeSummary = (commentText) => {
    if (!commentText) return null;

    const changes = [];
    
    // Check for status changes
    const statusMatch = commentText.match(/status changed from ['"]?([^'"]+)['"]? to ['"]?([^'"]+)/i);
    if (statusMatch) {
      changes.push({
        type: 'status',
        from: statusMatch[1].replace('_', ' '),
        to: statusMatch[2].replace('_', ' '),
        description: `Status changed from "${statusMatch[1].replace('_', ' ')}" to "${statusMatch[2].replace('_', ' ')}"`
      });
    }

    // Check for due date changes
    const dueDateMatch = commentText.match(/due date changed from ([^to]+) to ([^;]+)/i);
    if (dueDateMatch) {
      changes.push({
        type: 'due_date',
        from: dueDateMatch[1].trim(),
        to: dueDateMatch[2].trim(),
        description: `Due date changed from ${dueDateMatch[1].trim()} to ${dueDateMatch[2].trim()}`
      });
    }

    // Check for title changes
    const titleMatch = commentText.match(/title changed from ['"]?([^'"]+)['"]? to ['"]?([^'"]+)/i);
    if (titleMatch) {
      changes.push({
        type: 'title',
        from: titleMatch[1],
        to: titleMatch[2],
        description: `Title changed from "${titleMatch[1]}" to "${titleMatch[2]}"`
      });
    }

    // Check for description updates
    if (commentText.toLowerCase().includes('description updated') || 
        commentText.toLowerCase().includes('description changed')) {
      changes.push({
        type: 'description',
        description: 'Description was updated'
      });
    }

    // Check for priority changes
    const priorityMatch = commentText.match(/priority changed from ([^to]+) to ([^;]+)/i);
    if (priorityMatch) {
      changes.push({
        type: 'priority',
        from: priorityMatch[1].trim(),
        to: priorityMatch[2].trim(),
        description: `Priority changed from ${priorityMatch[1].trim()} to ${priorityMatch[2].trim()}`
      });
    }

    // Check for assignment changes
    if (commentText.toLowerCase().includes('assigned') || 
        commentText.toLowerCase().includes('assignment')) {
      changes.push({
        type: 'assignment',
        description: 'Task assignment was updated'
      });
    }

    return changes.length > 0 ? changes : null;
  };

  // Get detailed modification description
  const getModificationDescription = () => {
    if (!task || !task.updated_at) return null;

    // First, try to get specific changes from the last comment
    if (lastComment) {
      const changes = parseChangeSummary(lastComment.comment);
      if (changes && changes.length > 0) {
        return {
          changes: changes,
          modifiedBy: lastComment.created_by_name || lastComment.user_name || 'Unknown',
          modifiedAt: lastComment.created_at
        };
      }

      // If it's a general comment (not UPDATE type), show who added it
      if (lastComment.comment_type !== 'UPDATE' && lastComment.comment) {
        return {
          changes: [{
            type: 'comment',
            description: `Comment added: "${lastComment.comment.substring(0, 100)}${lastComment.comment.length > 100 ? '...' : ''}"`
          }],
          modifiedBy: lastComment.created_by_name || lastComment.user_name || 'Unknown',
          modifiedAt: lastComment.created_at
        };
      }
    }

    // Fallback to general modification detection
    const lastMod = getLastModification();
    if (!lastMod) {
      return {
        changes: [{
          type: 'general',
          description: 'Task information was updated'
        }],
        modifiedBy: null,
        modifiedAt: task.updated_at
      };
    }

    // If updated_at is very recent (within last hour), show what was likely changed
    const updatedAt = new Date(task.updated_at);
    const now = new Date();
    const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);

    if (hoursSinceUpdate < 1) {
      // Very recent update
      let description = '';
      if (task.status === 'COMPLETED' && task.completed_at) {
        description = 'Task was marked as completed';
      } else if (task.status === 'IN_PROGRESS' && task.started_at) {
        description = 'Task was started';
      } else if (task.status === 'SUBMITTED') {
        description = 'Task was submitted for review';
      } else if (task.status === 'RETURNED') {
        description = 'Task was returned for revision';
      } else if (task.assigned_at) {
        description = 'Task assignment was updated';
      } else {
        description = 'Task details were modified';
      }

      return {
        changes: [{
          type: 'general',
          description: description
        }],
        modifiedBy: null,
        modifiedAt: task.updated_at
      };
    } else {
      return {
        changes: [{
          type: 'general',
          description: lastMod.description
        }],
        modifiedBy: null,
        modifiedAt: task.updated_at
      };
    }
  };

  if (!isOpen || !task) return null;

  const timeElapsed = getTimeElapsed();
  const totalTime = getTotalTime();
  const timeElapsedDetails = getTimeElapsedDetails();
  const timeTakenDetails = getTimeTakenDetails();
  const dueDateProgress = getDueDateProgress();

  return (
    <>
      {/* Light Backdrop - Semi-transparent */}
      <div 
        onClick={handleClose}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          zIndex: 1040,
          opacity: isClosing ? 0 : 1,
          transition: 'opacity 0.3s ease-in'
        }}
      ></div>
      
      {/* Modal Container - Fixed on right side */}
      <div 
        className="modal fade show"
        style={{ 
          display: 'block', 
          zIndex: 1050,
          position: 'fixed',
          top: 0,
          right: 0,
          left: 'auto',
          height: '100vh',
          width: '500px',
          maxWidth: '90vw',
          margin: 0,
          padding: 0,
          animation: isClosing ? 'slideOutRight 0.3s ease-in' : 'slideInRight 0.3s ease-out',
          transform: isClosing ? 'translateX(100%)' : 'translateX(0)',
          transition: isClosing ? 'transform 0.3s ease-in, opacity 0.3s ease-in' : 'none'
        }}
        tabIndex="-1"
        onClick={(e) => {
          // Close if clicking outside modal content
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div 
          className="modal-dialog modal-dialog-scrollable h-100 m-0"
          style={{ 
            maxWidth: '100%', 
            width: '100%',
            margin: 0,
            position: 'relative',
            right: 0
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content h-100 border-0 rounded-0 shadow-lg">
            {/* Modal Header */}
            <div className="modal-header text-white border-0">
              <h5 className="modal-title mb-0">
                <i className="ri-task-line me-2"></i>
                Task Details
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-primary" 
                onClick={handleClose}
                aria-label="Close"
              ></button>
            </div>

            {/* Modal Body */}
            <div className="modal-body p-4" style={{ paddingBottom: '80px' }}>
              {/* Task Title */}
              <div className="text-center mb-4 pb-3 border-bottom">
                <h4 className="mb-2 fw-bold">{task.title || 'Untitled Task'}</h4>
                <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
                  {task.task_type && (
                    <span className={`badge rounded-pill ${getTaskTypeBadgeColor(task.task_type)}`}>
                      <i className="ri-task-line me-1"></i>
                      {task.task_type.replace('_', ' ')}
                    </span>
                  )}
                  {task.status && (
                    <span className={`badge rounded-pill ${getStatusBadgeColor(task.status)}`}>
                      <i className="ri-checkbox-circle-line me-1"></i>
                      {task.status.replace('_', ' ')}
                    </span>
                  )}
                  {task.priority && (
                    <span className={`badge rounded-pill ${getPriorityBadgeColor(task.priority)}`}>
                      <i className="ri-flag-line me-1"></i>
                      {task.priority}
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Time Representations */}
              {(timeElapsedDetails || timeTakenDetails || dueDateProgress || totalTime) && (
                <div className="card border-0 shadow-sm mb-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <div className="card-body text-white p-4">
                    <h6 className="text-white mb-4 d-flex align-items-center">
                      <i className="ri-time-line me-2 fs-5"></i>
                      Time Tracking
                    </h6>
                    
                    {/* Time Spent on Task - Visual */}
                    {totalTime && (
                      <div className="mb-4 pb-3 border-bottom border-white border-opacity-25">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-semibold">
                            <i className="ri-timer-line me-1"></i>
                            Time Spent
                          </span>
                          <span className="fw-bold fs-6">
                            {totalTime}
                          </span>
                        </div>
                        {task.actual_hours && task.estimated_hours && (
                          <div className="progress mt-2" style={{ height: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '5px' }}>
                            <div 
                              className="progress-bar bg-white" 
                              role="progressbar" 
                              style={{ 
                                width: `${Math.min(100, (task.actual_hours / task.estimated_hours) * 100)}%`,
                                transition: 'width 0.6s ease',
                                borderRadius: '5px'
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Time Elapsed Visual */}
                    {timeElapsedDetails && (
                      <div className="mb-4 pb-3 border-bottom border-white border-opacity-25">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-semibold">
                            <i className="ri-hourglass-line me-1"></i>
                            Time Elapsed
                          </span>
                          <span className="fw-bold fs-6">
                            {timeElapsedDetails.days > 0 && `${timeElapsedDetails.days}d `}
                            {timeElapsedDetails.hours > 0 && `${timeElapsedDetails.hours}h `}
                            {timeElapsedDetails.minutes}m
                          </span>
                        </div>
                        <div className="progress mt-2" style={{ height: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '5px' }}>
                          <div 
                            className="progress-bar bg-info" 
                            role="progressbar" 
                            style={{ 
                              width: `${Math.min(100, Math.max(5, (timeElapsedDetails.days * 2 + timeElapsedDetails.hours * 0.1)))}%`,
                              transition: 'width 0.6s ease',
                              borderRadius: '5px'
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Time Taken Visual (if completed) */}
                    {timeTakenDetails && (
                      <div className="mb-4 pb-3 border-bottom border-white border-opacity-25">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-semibold">
                            <i className="ri-timer-2-line me-1"></i>
                            Time Taken to Complete
                          </span>
                          <span className="fw-bold fs-6">
                            {timeTakenDetails.days > 0 && `${timeTakenDetails.days}d `}
                            {timeTakenDetails.hours > 0 && `${timeTakenDetails.hours}h `}
                            {timeTakenDetails.minutes}m
                          </span>
                        </div>
                        <div className="progress mt-2" style={{ height: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '5px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            role="progressbar" 
                            style={{ 
                              width: `${Math.min(100, Math.max(5, (timeTakenDetails.days * 2 + timeTakenDetails.hours * 0.1)))}%`,
                              transition: 'width 0.6s ease',
                              borderRadius: '5px'
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Due Date Visual */}
                    {dueDateProgress && (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-semibold">
                            <i className={`ri-calendar-todo-line me-1 ${dueDateProgress.isOverdue ? 'text-warning' : ''}`}></i>
                            {dueDateProgress.isOverdue ? 'Overdue' : 'Due Date Progress'}
                          </span>
                          <span className={`fw-bold fs-6 ${dueDateProgress.isOverdue ? 'text-warning' : ''}`}>
                            {dueDateProgress.isOverdue 
                              ? `${Math.abs(dueDateProgress.daysRemaining)} days overdue`
                              : `${dueDateProgress.daysRemaining} days remaining`
                            }
                          </span>
                        </div>
                        <div className="progress mt-2" style={{ height: '10px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '5px' }}>
                          <div 
                            className={`progress-bar ${dueDateProgress.isOverdue ? 'bg-danger' : 'bg-warning'}`}
                            role="progressbar" 
                            style={{ 
                              width: `${Math.min(100, Math.max(5, dueDateProgress.progress))}%`,
                              transition: 'width 0.6s ease',
                              borderRadius: '5px'
                            }}
                          ></div>
                        </div>
                        {task.due_date && (
                          <small className="text-white-50 mt-2 d-block">
                            Due: {formatDate(task.due_date)}
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Task Information */}
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body">
                  <h6 className="mb-3 text-primary">
                    <i className="ri-information-line me-2"></i>
                    Task Information
                  </h6>
                  <div className="pt-2">
                    {/* Task Code */}
                    {task.task_code && (
                      <div className="mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <i className="ri-barcode-line text-primary fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Task Code</p>
                            <p className="mb-0 fw-bold">{task.task_code}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Assigned Date & Time */}
                    {(task.assigned_at || task.created_at) && (
                      <div className="mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <i className="ri-calendar-check-line text-info fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Assigned Date & Time</p>
                            <p className="mb-0 fw-bold">
                              {task.assigned_at ? formatDate(task.assigned_at) : formatDate(task.created_at)}
                            </p>
                            {!task.assigned_at && task.created_at && (
                              <small className="text-muted">(Created date used as assigned date)</small>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Due Date */}
                    {task.due_date && (
                      <div className="mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className={`avatar-sm rounded-circle d-flex align-items-center justify-content-center me-3 ${new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' ? 'bg-danger bg-opacity-10' : 'bg-warning bg-opacity-10'}`} style={{ width: '40px', height: '40px' }}>
                            <i className={`ri-calendar-todo-line fs-5 ${new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' ? 'text-danger' : 'text-warning'}`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Due Date & Time</p>
                            <p className={`mb-0 fw-bold ${new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' ? 'text-danger' : ''}`}>
                              {formatDate(task.due_date)}
                            </p>
                            {new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                              <small className="text-danger">Overdue</small>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Last Modified Date & Time with Modification Details */}
                    {task.updated_at && (
                      <div className="mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <i className="ri-edit-line text-warning fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="text-muted mb-1 fs-12 text-uppercase fw-semibold">Last Modified</p>
                            <p className="mb-2 fw-bold">
                              {formatDate(task.updated_at)}
                            </p>
                            {loadingComment ? (
                              <div className="mt-2">
                                <small className="text-muted">
                                  <i className="ri-loader-4-line spin me-1"></i>
                                  Loading modification details...
                                </small>
                              </div>
                            ) : getModificationDescription() && (
                              <div>
                                {getModificationDescription().changes && getModificationDescription().changes.map((change, index) => (
                                  <div key={index} className="mb-2">
                                    <p className="mb-1 small text-dark fw-semibold d-flex align-items-center">
                                      <i className={`ri-${change.type === 'status' ? 'checkbox-circle-line' : change.type === 'due_date' ? 'calendar-todo-line' : change.type === 'title' ? 'file-text-line' : change.type === 'description' ? 'file-edit-line' : change.type === 'comment' ? 'message-3-line' : 'edit-line'} me-1`}></i>
                                      {change.description}
                                    </p>
                                    {change.from && change.to && (
                                      <div className="ms-3 small text-muted">
                                        <span className=" text-muted me-1">{change.from}</span>
                                        <i className="ri-arrow-right-line mx-1"></i>
                                        <span className=" text-muted">{change.to}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {getModificationDescription().modifiedBy && (
                                  <div className="mt-2 pt-2 border-top border-warning border-opacity-25">
                                    <small className="text-muted d-flex align-items-center">
                                      <i className="ri-user-line me-1"></i>
                                      Modified by: <span className="fw-semibold text-dark ms-1">{getModificationDescription().modifiedBy}</span>
                                    </small>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Time Spent Visual */}
                    {totalTime && (
                      <div className="mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <i className="ri-timer-line text-success fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="text-muted mb-1 fs-12 text-uppercase fw-semibold">Time Spent</p>
                            <p className="mb-0 fw-bold text-success">{totalTime}</p>
                            {task.actual_hours && task.estimated_hours && (
                              <div className="progress mt-2" style={{ height: '6px' }}>
                                <div 
                                  className="progress-bar bg-success" 
                                  role="progressbar" 
                                  style={{ 
                                    width: `${Math.min(100, (task.actual_hours / task.estimated_hours) * 100)}%`
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}


                    {/* Assigned To - Clickable */}
                    {task.assigned_to_name && (
                      <div className="mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <i className="ri-user-line text-primary fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="text-muted mb-1 fs-12 text-uppercase fw-semibold">Assigned To</p>
                            <p 
                              className="mb-0 fw-bold text-primary" 
                              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => handleEmployeeClick({
                                name: task.assigned_to_name,
                                id: task.assigned_to,
                                email: task.assigned_to_email,
                                profile_image: task.assigned_to_profile_image,
                                role: task.assigned_to_role,
                                departmentName: task.department_name
                              })}
                              onMouseEnter={(e) => {
                                // e.target.style.textDecoration = 'underline';
                                // e.target.style.color = '#0d6efd';
                              }}
                              onMouseLeave={(e) => {
                                // e.target.style.textDecoration = 'none';
                                // e.target.style.color = '#405189';
                              }}
                            >
                              {task.assigned_to_name}
                              {/* <i className="ri-external-link-line small"></i> */}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Created By - Clickable */}
                    {task.created_by_name && (
                      <div className="mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <i className="ri-user-add-line text-info fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="text-muted mb-1 fs-12 text-uppercase fw-semibold">Assigned By</p>
                            <p 
                              className="mb-0 fw-bold text-primary" 
                              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => handleEmployeeClick({
                                name: task.created_by_name,
                                id: task.created_by,
                                email: task.created_by_email,
                                profile_image: task.created_by_profile_image,
                                role: task.created_by_role,
                                departmentName: task.department_name
                              })}
                              onMouseEnter={(e) => {
                                // e.target.style.textDecoration = 'underline';
                                // e.target.style.color = '#0d6efd';
                              }}
                              onMouseLeave={(e) => {
                                // e.target.style.textDecoration = 'none';
                                // e.target.style.color = '#405189';
                              }}
                            >
                              {task.created_by_name}
                              {/* <i className="ri-external-link-line small"></i> */}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Department */}
                    {task.department_name && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <i className="ri-building-line text-secondary fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Department</p>
                            <p className="mb-0 fw-bold">{task.department_name}</p>
                          </div>
                        </div>
                      </div>
                    )}


                    {/* Started At */}
                    {task.started_at && (
                      <div className="mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <i className="ri-play-circle-line text-success fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Started At</p>
                            <p className="mb-0 fw-bold">{formatDate(task.started_at)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Completed At */}
                    {task.completed_at && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <i className="ri-checkbox-circle-line text-success fs-5"></i>
                          </div>
                          <div className="flex-grow-1">
                            <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">Completed At</p>
                            <p className="mb-0 fw-bold text-success">{formatDate(task.completed_at)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with View More Details Button */}
            <div className="modal-footer border-top bg-light" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
              <div className="d-grid w-50">
                <button
                  className="btn btn-outline-primary "
                  onClick={handleViewMoreDetails}
                >
                  <i className="ri-eye-line me-2"></i>
                  View More Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Profile Modal */}
      <EmployeeProfileModal
        employee={selectedEmployee}
        isOpen={showEmployeeModal}
        onClose={handleCloseEmployeeModal}
        showActions={false}
      />

      {/* Add CSS animations for slide in and slide out */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 576px) {
          .modal[style*="width: 500px"] {
            width: 90vw !important;
            max-width: 90vw !important;
          }
        }
      `}</style>
    </>
  );
};

export default TaskDetailsModal;

