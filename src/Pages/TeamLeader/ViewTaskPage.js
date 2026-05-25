import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useParams, useNavigate } from 'react-router-dom';
import Snowfall from 'react-snowfall';


const ViewTaskPage = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]); // Add comments state
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('UPDATE');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // details, subtasks, notes, attachments
  const [showModal, setShowModal] = useState(false);
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', url: '', name: '' });
  // New states for subtask cancellation and reassignment
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  // New states for logs functionality
  const [logs, setLogs] = useState([]);
  // Pagination states for logs
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(5);
  // Pagination states for comments
  const [currentCommentPage, setCurrentCommentPage] = useState(1);
  const [commentsPerPage] = useState(5);
  // New states for edit task functionality (similar to admin)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTaskData, setEditTaskData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: '',
    status: ''
  });
  const [editReason, setEditReason] = useState(''); // New state for edit reason
  const [editLoading, setEditLoading] = useState(false);
  // New states for file upload functionality
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  // New state for attachment deletion
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
  
  // Loading states for task actions
  const [isHoldingTask, setIsHoldingTask] = useState(false);
  const [isResumingTask, setIsResumingTask] = useState(false);

  // Helper function to get file icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return 'unknown';
    
    if (fileType.includes('pdf')) return 'pdf';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('word')) return 'word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'excel';
    if (fileType.includes('zip') || fileType.includes('compressed')) return 'zip';
    if (fileType.includes('audio')) return 'music';
    if (fileType.includes('video')) return 'video';
    
    return 'text';
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to format time spent
  const formatTimeSpent = (minutes) => {
    if (!minutes) return '0 minutes';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} minute${mins !== 1 ? 's' : ''}` : ''}`;
    }
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  // Helper function to format a single line with clickable links
  const formatLineWithLinks = (line) => {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = urlPattern.exec(line)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      
      // Add the clickable link
      let url = match[0];
      let displayUrl = url;
      
      // Add protocol if missing for www links
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      }
      
      // Handle email addresses
      if (url.includes('@')) {
        displayUrl = url;
        url = 'mailto:' + url;
      }
      
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-decoration-underline"
          onClick={(e) => e.stopPropagation()}
        >
          {displayUrl}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last URL
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : line;
  };

  // Helper function to format description with clickable links and preserved formatting
  const formatDescription = (text) => {
    if (!text) return 'No description provided';
    
    // Split text by lines to handle bullet points and numbered lists
    const lines = text.split('\n');
    const formattedLines = [];
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Check for numbered list (starts with number followed by period or parenthesis)
      const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s*(.+)$/);
      if (numberedMatch) {
        const number = numberedMatch[1];
        const content = numberedMatch[2];
        const formattedContent = formatLineWithLinks(content);
        formattedLines.push(
          <div key={lineIndex} className="mb-1 ms-3">
            <span className="me-2">{number}.</span>
            <span>{formattedContent}</span>
          </div>
        );
        return;
      }
      
      // Check for bullet points (starts with -, *, •, or o)
      const bulletMatch = trimmedLine.match(/^[-*•o]\s+(.+)$/);
      if (bulletMatch) {
        const content = bulletMatch[1];
        const formattedContent = formatLineWithLinks(content);
        formattedLines.push(
          <div key={lineIndex} className="mb-1 ms-3">
            <span className="me-2">•</span>
            <span>{formattedContent}</span>
          </div>
        );
        return;
      }
      
      // Regular line - format links and preserve line breaks
      if (trimmedLine) {
        const formattedContent = formatLineWithLinks(trimmedLine);
        formattedLines.push(
          <div key={lineIndex} className="mb-2">
            {formattedContent}
          </div>
        );
      } else {
        // Empty line for spacing
        formattedLines.push(<div key={lineIndex} className="mb-1"></div>);
      }
    });
    
    return formattedLines.length > 0 ? formattedLines : 'No description provided';
  };

  // Function to open attachment in modal
  const openAttachment = (attachment) => {
    const baseUrl = process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
    // Fix the URL by removing the local file system path and keeping only the relative path
    let filePath = attachment.file_path;
    if (filePath.includes('Task Manager/server/uploads')) {
      // Extract the relative path after 'Task Manager/server/uploads'
      const pathParts = filePath.split('Task Manager/server/uploads');
      if (pathParts.length > 1) {
        filePath = '/uploads' + pathParts[1];
      }
    }
    // Ensure we have a proper URL by adding a slash if needed
    const fullUrl = `${baseUrl}${filePath.startsWith('/') ? filePath : '/' + filePath}`;
    
    // Set modal content and show modal instead of opening in new tab
    setModalContent({
      type: attachment.file_type,
      url: fullUrl,
      name: attachment.file_name || attachment.name || 'Unknown File'
    });
    setShowModal(true);
  };

  // Function to download attachment - force download for all file types
  const downloadAttachment = (attachment) => {
    const baseUrl = process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
    
    // Force download by using the download endpoint instead of direct file access
    const downloadUrl = `${baseUrl}/api/v1/tasks/attachments/${attachment.id}/download`;
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', attachment.file_name || attachment.name || 'attachment');
    // Remove target="_blank" to ensure download instead of opening in new tab
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch task details
  const fetchTaskDetails = async () => {
    try {
      const response = await axios.get(
        buildApiUrl(`/tasks/${taskId}`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setTask(response.data.data.task);
        setSubtasks(response.data.data.subtasks || []);
        // Don't set attachments here, fetch them separately
      } else {
        toast.error(`Failed to load task details: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      
      if (error.response) {
        
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to load task details'}`);
      } else {
        toast.error('Network error: Failed to load task details');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch task attachments
  const fetchTaskAttachments = async () => {
    try {
      // First fetch attachments directly associated with this task
      const response = await axios.get(
        buildApiUrl(`/tasks/${taskId}/attachments`),
        { headers: getAuthHeaders() }
      );

      let allAttachments = [];
      
      if (response.data.success) {
        allAttachments = response.data.data.attachments || [];
      }
      
      // If this is a subtask, also fetch attachments from the parent task
      if (task && task.parent_task_id) {
        try {
          const parentResponse = await axios.get(
            buildApiUrl(`/tasks/${task.parent_task_id}/attachments`),
            { headers: getAuthHeaders() }
          );
          
          if (parentResponse.data.success) {
            // Add parent attachments with a flag to distinguish them
            const parentAttachments = (parentResponse.data.data.attachments || []).map(attachment => ({
              ...attachment,
              is_from_parent: true
            }));
            
            // Combine both attachments, with parent attachments first
            allAttachments = [...parentAttachments, ...allAttachments];
          }
        } catch (parentError) {
          
          // Not critical, continue with just the task's own attachments
        }
      }
      
      setAttachments(allAttachments);
    } catch (error) {
      
      toast.error('Failed to load attachments');
    }
  };

  // Fetch task comments
  const fetchTaskComments = async () => {
    try {
      // Fetch comments for the main task
      const mainTaskResponse = await axios.get(
        buildApiUrl(`/tasks/${taskId}/comments`),
        { headers: getAuthHeaders() }
      );

      let allComments = [];
      
      if (mainTaskResponse.data.success) {
        // Add main task comments with task_type identifier
        allComments = mainTaskResponse.data.data.comments.map(comment => ({
          ...comment,
          task_type: 'main',
          task_title: task?.title || 'Main Task'
        })) || [];
      }

      // Fetch comments for each subtask
      for (const subtask of subtasks) {
        try {
          const subtaskResponse = await axios.get(
            buildApiUrl(`/tasks/${subtask.id}/comments`),
            { headers: getAuthHeaders() }
          );
          
          if (subtaskResponse.data.success) {
            // Add subtask comments with task_type identifier
            const subtaskComments = subtaskResponse.data.data.comments.map(comment => ({
              ...comment,
              task_type: 'subtask',
              task_title: subtask.title,
              parent_task_id: taskId
            })) || [];
            
            allComments = [...allComments, ...subtaskComments];
          }
        } catch (subtaskError) {
          
        }
      }

      // Sort comments by created_at timestamp (newest first)
      allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setComments(allComments);
      setCurrentCommentPage(1); // Reset to first page when comments are fetched
    } catch (error) {
      
      toast.error('Failed to load comments');
    }
  };

  // Fetch task logs
  const fetchTaskLogs = async () => {
    try {
      // Fetch logs for the main task
      const mainTaskResponse = await axios.get(
        buildApiUrl(`/tasks/${taskId}/logs`),
        { headers: getAuthHeaders() }
      );

      let allLogs = [];
      
      if (mainTaskResponse.data.success) {
        // Add main task logs with task_type identifier
        allLogs = mainTaskResponse.data.data.logs.map(log => ({
          ...log,
          task_type: 'main',
          task_title: task?.title || 'Main Task'
        })) || [];
      }

      // Fetch logs for each subtask
      for (const subtask of subtasks) {
        try {
          const subtaskResponse = await axios.get(
            buildApiUrl(`/tasks/${subtask.id}/logs`),
            { headers: getAuthHeaders() }
          );
          
          if (subtaskResponse.data.success) {
            // Add subtask logs with task_type identifier
            const subtaskLogs = subtaskResponse.data.data.logs.map(log => ({
              ...log,
              task_type: 'subtask',
              task_title: subtask.title,
              parent_task_id: taskId
            })) || [];
            
            allLogs = [...allLogs, ...subtaskLogs];
          }
        } catch (subtaskError) {
          
        }
      }

      // Sort logs by created_at timestamp (newest first)
      allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setLogs(allLogs);
      setCurrentPage(1); // Reset to first page when logs are fetched
    } catch (error) {
      
      toast.error('Failed to load logs');
    }
  };

  // Function to submit task to admin
  const submitTaskToAdmin = async () => {
    try {
      // Check if this is a main task with subtasks
      if (task.task_type !== 'SUBTASK' && subtasks.length > 0) {
        // Check if all subtasks are completed
        const incompleteSubtasks = subtasks.filter(subtask => 
          subtask.status !== 'COMPLETED' && subtask.status !== 'CANCELLED'
        );
        
        if (incompleteSubtasks.length > 0) {
          toast.error(`Cannot submit to admin. ${incompleteSubtasks.length} subtasks are not completed.`);
          return;
        }
      }
      
      // Submit task to admin
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/status`),
        { status: 'SUBMITTED' },
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        toast.success('Task submitted to admin successfully!');
        // Refresh task details
        fetchTaskDetails();
      } else {
        toast.error(response.data.message || 'Failed to submit task to admin');
      }
    } catch (error) {
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to submit task to admin'}`);
      } else {
        toast.error('Network error: Failed to submit task to admin');
      }
    }
  };

  // Function to hold a task
  const holdTask = async () => {
    if (!window.confirm('Are you sure you want to hold this task?')) {
      return;
    }
    
    setIsHoldingTask(true);
    
    try {
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/hold`),
        {},
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        toast.success('Task held successfully!');
        // Refresh task details
        fetchTaskDetails();
      } else {
        toast.error(response.data.message || 'Failed to hold task');
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to hold task'}`);
      } else {
        toast.error('Network error: Failed to hold task');
      }
    } finally {
      setIsHoldingTask(false);
    }
  };

  // Function to resume a task
  const resumeTask = async () => {
    if (!window.confirm('Are you sure you want to resume this task?')) {
      return;
    }
    
    setIsResumingTask(true);
    
    try {
      // When resuming, we need to update the status to 'RESUMED' which will automatically set started_at
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/resume`),
        {},
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        toast.success('Task resumed successfully!');
        // Refresh task details
        fetchTaskDetails();
      } else {
        toast.error(response.data.message || 'Failed to resume task');
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to resume task'}`);
      } else {
        toast.error('Network error: Failed to resume task');
      }
    } finally {
      setIsResumingTask(false);
    }
  };

  // Fetch team members (for normal team leaders - includes team members and the team leader themselves)
  const fetchTeamMembers = async () => {
    try {
      // First, fetch the team leader's own team members
      const response = await axios.get(
        buildApiUrl(`/team/leader/${leadCrmUser.id}/members`),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        // Add the team leader themselves to the list
        const teamMembersWithLeader = [
          {
            id: leadCrmUser.id,
            name: leadCrmUser.name,
            email: leadCrmUser.email,
            role: 'TL',
            designation: 'Team Leader'
          },
          ...(response.data.data.members || [])
        ];
        setTeamMembers(teamMembersWithLeader);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    }
  };

  // Function to cancel a subtask
  const cancelSubtask = async (subtask) => {
    setSelectedSubtask(subtask);
    setShowCancelModal(true);
  };

  // Function to confirm subtask cancellation
  const confirmCancelSubtask = async () => {
    if (!selectedSubtask || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setCancelLoading(true);
    
    try {
      const response = await axios.put(
        buildApiUrl(`/tasks/${selectedSubtask.id}/status`),
        { status: 'CANCELLED', completion_notes: cancelReason },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Subtask cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        // Refresh subtasks
        fetchTaskDetails();
      } else {
        toast.error(response.data.message || 'Failed to cancel subtask');
      }
    } catch (error) {
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to cancel subtask'}`);
      } else {
        toast.error('Network error: Failed to cancel subtask');
      }
    } finally {
      setCancelLoading(false);
    }
  };

  // Function to reassign a cancelled subtask
  const reassignSubtask = async (subtask) => {
    setSelectedSubtask(subtask);
    setShowReassignModal(true);
    
    // Always fetch team members when opening the reassign modal to ensure we have the latest data
    // Check if the current user is a department manager for this task's department
    if (task && task.assigned_to_department && task.department_manager_id) {
      // For department managers, fetch all department employees
      if (task.department_manager_id === leadCrmUser.id) {
        try {
          // Try to fetch all department employees (for department managers)
          const response = await axios.get(
            buildApiUrl(`/departments/${task.assigned_to_department}/employees`),
            { headers: getAuthHeaders() }
          );
          
          if (response.data.success) {
            // Set all department employees as available for reassignment
            setTeamMembers(response.data.data || []);
          } else {
            // Fallback to team members if department employees fetch fails
            fetchTeamMembers();
          }
        } catch (error) {
          console.error('Error fetching department employees:', error);
          // Fallback to team members
          fetchTeamMembers();
        }
      } else {
        // For normal team leaders, fetch their team members (including themselves)
        try {
          // Try to fetch team members for task assignment (for normal team leaders)
          const response = await axios.get(
            buildApiUrl(`/departments/${task.assigned_to_department}/members/for-task-assignment`),
            { headers: getAuthHeaders() }
          );
          
          if (response.data.success) {
            // Add the team leader themselves to the list
            const teamMembersWithLeader = [
              {
                id: leadCrmUser.id,
                name: leadCrmUser.name,
                email: leadCrmUser.email,
                role: 'TL',
                designation: 'Team Leader'
              },
              ...(response.data.data || [])
            ];
            setTeamMembers(teamMembersWithLeader);
          } else {
            // Fallback to team members if fetch fails
            fetchTeamMembers();
          }
        } catch (error) {
          console.error('Error fetching team members for task assignment:', error);
          // Fallback to team members
          fetchTeamMembers();
        }
      }
    } else {
      // Fallback to team members if no department info
      fetchTeamMembers();
    }
  };

  // Function to confirm subtask reassignment
  const confirmReassignSubtask = async () => {
    if (!selectedSubtask || !selectedTeamMember) {
      toast.error('Please select a team member');
      return;
    }

    setReassignLoading(true);
    
    try {
      // First, reassign the subtask
      const assignResponse = await axios.post(
        buildApiUrl(`/tasks/${selectedSubtask.id}/assign`),
        {
          assigned_to_type: 'EMPLOYEE',
          assigned_to_id: parseInt(selectedTeamMember),
          notes: 'Subtask reassigned by team leader'
        },
        { headers: getAuthHeaders() }
      );

      if (!assignResponse.data.success) {
        throw new Error(assignResponse.data.message || 'Failed to reassign subtask');
      }

      // Then, update the status to IN_PROGRESS
      const statusResponse = await axios.put(
        buildApiUrl(`/tasks/${selectedSubtask.id}/status`),
        { status: 'IN_PROGRESS' },
        { headers: getAuthHeaders() }
      );

      if (!statusResponse.data.success) {
        throw new Error(statusResponse.data.message || 'Failed to update subtask status');
      }

      toast.success('Subtask reassigned successfully');
      setShowReassignModal(false);
      setSelectedTeamMember('');
      // Refresh subtasks
      fetchTaskDetails();
    } catch (error) {
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to reassign subtask'}`);
      } else {
        toast.error('Network error: Failed to reassign subtask');
      }
    } finally {
      setReassignLoading(false);
    }
  };

  // Get current logs for pagination
  const getCurrentLogs = () => {
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    return logs.slice(indexOfFirstLog, indexOfLastLog);
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Next page
  const nextPage = () => {
    if (currentPage < Math.ceil(logs.length / logsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Get current comments for pagination
  const getCurrentComments = () => {
    const indexOfLastComment = currentCommentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    return comments.slice(indexOfFirstComment, indexOfLastComment);
  };

  // Change comment page
  const paginateComments = (pageNumber) => setCurrentCommentPage(pageNumber);

  // Previous comment page
  const prevCommentPage = () => {
    if (currentCommentPage > 1) {
      setCurrentCommentPage(currentCommentPage - 1);
    }
  };

  // Next comment page
  const nextCommentPage = () => {
    if (currentCommentPage < Math.ceil(comments.length / commentsPerPage)) {
      setCurrentCommentPage(currentCommentPage + 1);
    }
  };

  // Handle adding a comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        comment: newComment,
        comment_type: commentType
      };

      const response = await axios.post(
        buildApiUrl(`/tasks/${taskId}/comments`),
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Comment added successfully');
        setNewComment('');
        setCommentType('UPDATE');
        setShowAddCommentModal(false);
        fetchTaskComments(); // Refresh comments
      } else {
        toast.error(`Failed to add comment: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to add comment'}`);
      } else {
        toast.error('Network error: Failed to add comment');
      }
    }
  };

  // Handle opening the edit modal
  const handleOpenEditModal = () => {
    // Initialize the edit task data with current task values
    setEditTaskData({
      title: task.title || '',
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'PENDING'
    });
    setShowEditModal(true);
  };

  // Handle saving the edited task data
  const handleSaveEditedTask = async (e) => {
    e.preventDefault();
    
    // Validate that reason is provided
    if (!editReason.trim()) {
      toast.error('Please provide a reason for the changes');
      return;
    }
    
    setEditLoading(true);
    
    try {
      // Determine what changes were made
      const changes = [];
      if (editTaskData.title !== task.title) {
        changes.push(`Title changed from "${task.title}" to "${editTaskData.title}"`);
      }
      if (editTaskData.description !== task.description) {
        changes.push(`Description updated`);
      }
      if (editTaskData.due_date !== task.due_date) {
        const oldDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None';
        const newDate = editTaskData.due_date ? new Date(editTaskData.due_date).toLocaleDateString() : 'None';
        changes.push(`Due date changed from ${oldDate} to ${newDate}`);
      }
      if (editTaskData.priority !== task.priority) {
        changes.push(`Priority changed from ${task.priority} to ${editTaskData.priority}`);
      }
      if (editTaskData.status !== task.status) {
        changes.push(`Status changed from ${task.status.replace('_', ' ')} to ${editTaskData.status.replace('_', ' ')}`);
      }
      
      // Prepare the payload with only the fields that have changed
      const payload = {
        title: editTaskData.title,
        description: editTaskData.description,
        due_date: editTaskData.due_date,
        priority: editTaskData.priority,
        status: editTaskData.status,
        change_summary: changes.join('; '),
        reason: editReason // Add the reason to the payload
      };

      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}`),
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Task updated successfully');
        setShowEditModal(false);
        setEditReason(''); // Clear the reason field
        fetchTaskDetails(); // Refresh the task details
      } else {
        toast.error(`Failed to update task: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to update task'}`);
      } else {
        toast.error('Network error: Failed to update task');
      }
    } finally {
      setEditLoading(false);
    }
  };

  // Handle file selection for upload
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploadLoading(true);
    
    try {
      // For multiple files, we need to upload them one by one since the server expects single file uploads
      const uploadPromises = selectedFiles.map(file => {
        const formData = new FormData();
        formData.append('attachment', file); // Changed from 'attachments' to 'attachment'
        
        return axios.post(
          buildApiUrl(`/tasks/${taskId}/attachments`),
          formData,
          {
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      });

      // Wait for all uploads to complete
      const responses = await Promise.all(uploadPromises);
      
      // Check if all uploads were successful
      const allSuccessful = responses.every(response => response.data.success);
      
      if (allSuccessful) {
        toast.success(`${selectedFiles.length} file(s) uploaded successfully`);
        setShowUploadModal(false);
        setSelectedFiles([]);
        fetchTaskAttachments(); // Refresh attachments
      } else {
        const failedCount = responses.filter(response => !response.data.success).length;
        toast.error(`${failedCount} file(s) failed to upload`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to upload files'}`);
      } else {
        toast.error('Network error: Failed to upload files');
      }
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle attachment deletion
  const handleDeleteAttachment = async (attachmentId) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    setDeletingAttachmentId(attachmentId);
    
    try {
      const response = await axios.delete(
        buildApiUrl(`/tasks/attachments/${attachmentId}`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Attachment deleted successfully');
        fetchTaskAttachments(); // Refresh attachments
      } else {
        toast.error(`Failed to delete attachment: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to delete attachment'}`);
      } else {
        toast.error('Network error: Failed to delete attachment');
      }
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
    // fetchTaskComments will be called after task and subtasks are loaded
  }, [taskId]);

  // Fetch comments, attachments, and logs when task and subtasks are available
  useEffect(() => {
    if (task && subtasks.length >= 0) {
      fetchTaskComments();
      fetchTaskAttachments();
      fetchTaskLogs();
    }
  }, [task, subtasks]);

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
                <p className="mt-2 text-muted">Loading task details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error message if task failed to load
  if (!task && !loading) {
    return (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h4 className="mb-0">Task Not Found</h4>
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate(-1)}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back
                      </button>
                    </div>
                  </div>
                  <div className="card-body text-center py-5">
                    <i className="ri-error-warning-line text-danger display-4"></i>
                    <h5 className="mt-3">Unable to Load Task</h5>
                    <p className="text-muted">
                      The task you're trying to access could not be found or you don't have permission to view it.
                    </p>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => navigate('/team-leader/assigned-tasks')}
                    >
                      View Assigned Tasks
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get current logs for display
  const currentLogs = getCurrentLogs();
  const totalPages = Math.ceil(logs.length / logsPerPage);

  // Get current comments for display
  const currentComments = getCurrentComments();
  const totalCommentPages = Math.ceil(comments.length / commentsPerPage);

  return (
    <div className="main-content">
      <div className="page-content">
        <div className="container-fluid">
          <Snowfall
            style={{
              position: "fixed",
              width: "100vw",
              height: "100vh",
              top: 0,
              left: 0,
              zIndex: -1,
              pointerEvents: "none"
            }}
            snowflakeCount={150}
            radius={[0.5, 3.0]}
            speed={[0.5, 1]}
            wind={[-0.5, 0.5]}
            color="rgb(255, 255, 255)" // Light blue/ice color
          />
          <div className="row">
            <div className="col-12">
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-0">Task Details</h4>
                      <p className="text-muted mb-0">View task information and subtasks</p>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate(-1)}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back
                      </button>
                      {/* Show Edit button for department managers */}
                      {(task.status !== 'SUBMITTED' && task.status !== 'COMPLETED') && (
                        <button 
                          className="btn btn-outline-primary"
                          onClick={handleOpenEditModal}
                        >
                          <i className="ri-edit-line me-2"></i>
                          Edit Task
                        </button>
                      )}
                      {(task.status !== 'SUBMITTED' && task.status !== 'COMPLETED') && (
                        <button 
                          className="btn btn-outline-success"
                          onClick={submitTaskToAdmin}
                          disabled={task.status === 'SUBMITTED'}
                        >
                          <i className="ri-send-plane-line me-2"></i>
                          Submit
                        </button>
                      )}
                      
                      {/* Hold/Resume buttons for team leaders */}
                      {task.status !== 'SUBMITTED' && task.status !== 'COMPLETED' && (
                        task.on_hold ? (
                          <button 
                            className="btn btn-outline-warning"
                            onClick={resumeTask}
                            disabled={isResumingTask}
                          >
                            {isResumingTask ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Resuming...
                              </>
                            ) : (
                              <>
                                <i className="ri-play-line me-2"></i>
                                Resume Task
                              </>
                            )}
                          </button>
                        ) : (
                          <button 
                            className="btn btn-outline-info"
                            onClick={holdTask}
                            disabled={isHoldingTask}
                          >
                            {isHoldingTask ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Holding...
                              </>
                            ) : (
                              <>
                                <i className="ri-pause-line me-2"></i>
                                Hold Task
                              </>
                            )}
                          </button>
                        )
                      )}
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => navigate(`/team-leader/task/${taskId}/breakdown`)}
                      >
                        <i className="ri-task-line me-2"></i>
                        Create Subtask
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Overview Card */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h4 className="mb-2">{task.title}</h4>
                          <div className="d-flex gap-2 mb-3">
                            <span className={`badge ${
                              task.status === 'COMPLETED' ? 'bg-success' : 
                              task.status === 'IN_PROGRESS' ? 'bg-info' : 
                              task.status === 'PENDING' ? 'bg-info' : 
                              task.status === 'SUBMITTED' ? 'bg-primary' : 
                              task.status === 'SUBMITTED_TO_ADMIN' ? 'bg-secondary' : 
                              'bg-secondary'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            <span className={`badge ${
                              task.priority === 'URGENT' ? 'bg-danger' :
                              task.priority === 'HIGH' ? 'bg-warning' : 
                              task.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                            }`}>
                              {task.priority}
                            </span>
                            {task.task_type && (
                              <span className={`badge ${
                                task.task_type === 'MAIN_TASK' ? 'bg-primary' :
                                task.task_type === 'SUBTASK' ? 'bg-info' :
                                'bg-secondary'
                              }`}>
                                {task.task_type.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                            <p className="mb-1"><small className="text-muted">Assigned By</small></p>
                          <h5> {task.created_by_name || 'Unknown'}</h5>
                        </div>
                        <div className="text-end">
                          <p className="mb-1"><small className="text-muted">Due Date</small></p>
                          <h5 className={new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' ? 'text-danger' : ''}>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          </h5>
                           <p className="mb-1"><small className="text-muted">Assigned To</small></p>
                            <h5 className="mb-0">{task.assigned_to_name}</h5>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                      <ul className="nav nav-tabs nav-tabs-custom nav-justified" role="tablist">
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => setActiveTab('details')}
                            style={{ cursor: 'pointer' }}
                            role="tab"
                          >
                            <i className="ri-file-list-line me-2"></i>
                            Task Details
                          </a>
                        </li>
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'subtasks' ? 'active' : ''}`}
                            onClick={() => setActiveTab('subtasks')}
                            style={{ cursor: 'pointer' }} 
                            role="tab"
                          >
                            <i className="ri-task-line me-2"></i>
                            Subtasks ({subtasks.length})
                          </a>
                        </li>
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'comments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('comments')}
                            style={{ cursor: 'pointer' }}
                            role="tab"
                          >
                            <i className="ri-discuss-line me-2"></i>
                            Comments ({comments.length})
                          </a>
                        </li>
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('logs')}
                            style={{ cursor: 'pointer' }}
                            role="tab"
                          >
                            <i className="ri-time-line me-2"></i>
                            Daily Logs ({logs.length})
                          </a>
                        </li>
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'attachments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('attachments')}
                            style={{ cursor: 'pointer' }}
                            role="tab"
                          >
                            <i className="ri-attachment-line me-2"></i>
                            Attachments ({attachments.length})
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="row">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      {/* Details Tab */}
                      {activeTab === 'details' && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-lg-12">
                              <div className="mb-4">
                                <h5 className="mb-3">Task Description</h5>
                                <div className="text-muted" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {formatDescription(task.description)}
                                </div>
                              </div>

                              {task.completion_notes && (
                                <div className="mb-4">
                                  <h5 className="mb-3">Completion Notes</h5>
                                  <div className="text-muted" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {formatDescription(task.completion_notes)}
                                  </div>
                                </div>
                              )}

                              <div className="mb-4">
                                <h5 className="mb-3">Task Information</h5>
                                <div className="row">
                                    <div className="col-md-6">
                                  
                                    <p className="mb-2"><strong>Assigned By:</strong> {task.created_by_name || 'Unknown'}</p>
                                    <p className="mb-2"><strong>Assigned To:</strong> {task.assigned_to_name|| 'Unknown'}</p>
                                    
                                  </div>
                                  <div className="col-md-6">
                                    <p className="mb-2"><strong>Assigned Date:</strong> {task.created_at ? new Date(task.created_at).toLocaleString() : 'N/A'}</p>
                                    <p className="mb-2"><strong>Last Updated:</strong> {task.updated_at ? new Date(task.updated_at).toLocaleString() : 'N/A'}</p>
                                    
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subtasks Tab */}
                      {activeTab === 'subtasks' && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-12">
                              <div className="mb-4">
                                <h5 className="mb-3">Subtasks ({subtasks.length})</h5>
                                {subtasks.length > 0 ? (
                                  <div className="table-responsive">
                                    <table className="table table-centered table-nowrap mb-0">
                                      <thead className="table-light">
                                        <tr>
                                          <th>Subtask Title</th>
                                          <th>Description</th>
                                          <th>Priority</th>
                                          <th>Due Date</th>
                                          <th>Assigned To</th>
                                          <th>Status</th>
                                          <th>Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {subtasks.map(subtask => (
                                          <tr key={subtask.id}>
                                            <td>
                                              <h6 className="mb-0">{subtask.title}</h6>
                                            </td>
                                            <td>
                                              <p className="mb-0 text-muted small">{subtask.description?.substring(0, 50)}...</p>
                                            </td>
                                            <td>
                                              <span className={`badge ${
                                                subtask.priority === 'URGENT' ? 'bg-danger' :
                                                subtask.priority === 'HIGH' ? 'bg-warning' : 
                                                subtask.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                              }`}>
                                                {subtask.priority}
                                              </span>
                                            </td>
                                            <td>
                                              <span className={`badge ${new Date(subtask.due_date) < new Date() && subtask.status !== 'COMPLETED' ? 'bg-danger' : 'bg-secondary'}`}>
                                                {subtask.due_date ? new Date(subtask.due_date).toLocaleDateString() : 'No due date'}
                                              </span>
                                            </td>
                                            <td>
                                              <span>{subtask.assigned_to_name || 'Unassigned'}</span>
                                            </td>
                                            <td>
                                              <span className={`badge ${
                                                subtask.status === 'COMPLETED' ? 'bg-success' : 
                                                subtask.status === 'IN_PROGRESS' ? 'bg-warning' : 
                                                subtask.status === 'PENDING' ? 'bg-info' : 
                                                subtask.status === 'SUBMITTED' ? 'bg-primary' : 
                                                subtask.status === 'CANCELLED' ? 'bg-danger' :
                                                'bg-secondary'
                                              }`}>
                                                {subtask.status.replace('_', ' ')}
                                              </span>
                                            </td>
                                            <td>
                                              {subtask.status !== 'CANCELLED' ? (
                                                <button 
                                                  className="btn btn-sm btn-outline-danger"
                                                  onClick={() => cancelSubtask(subtask)}
                                                >
                                                  <i className="ri-close-line"></i> Cancel
                                                </button>
                                              ) : (
                                                <button 
                                                  className="btn btn-sm btn-outline-primary"
                                                  onClick={() => reassignSubtask(subtask)}
                                                >
                                                  <i className="ri-refresh-line"></i> Reassign
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-center py-5">
                                    <i className="ri-task-line display-4 text-muted"></i>
                                    <h5 className="mt-3">No subtasks found</h5>
                                    <p className="text-muted">This task has not been broken down into subtasks yet.</p>
                                    <button 
                                      className="btn btn-outline-primary"
                                      onClick={() => navigate(`/team-leader/task/${taskId}/breakdown`)}
                                    >
                                      <i className="ri-task-line me-2"></i>
                                      Break Down Task
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comments Tab */}
                      {activeTab === 'comments' && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-12">
                              <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                  <h5 className="mb-0">Task Comments ({comments.length})</h5>
                                  <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => setShowAddCommentModal(true)}
                                  >
                                    <i className="ri-add-line me-1"></i>
                                    Add Comment
                                  </button>
                                </div>
                                {comments.length > 0 ? (
                                  <>
                                    <div className="list-group">
                                      {currentComments.map((comment, index) => (
                                        <div key={comment.id} className="card mb-3 shadow-sm">
                                          <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                              <div className="d-flex align-items-center">
                                                <div className="avatar-xs bg-primary rounded me-3">
                                                  <i className={`ri-file-${getFileIcon(comment.file_type)}-line ri-lg text-primary`}></i>
                                                </div>
                                                <div>
                                                  <h6 className="mb-0">{comment.created_by_name || comment.user_name || comment.created_by_user_name || 'Unknown User'}</h6>
                                                  <small className="text-muted">
                                                    {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Unknown date'}
                                                  </small>
                                                </div>
                                              </div>
                                              <div className="d-flex align-items-center">
                                                {comment.task_type === 'subtask' && (
                                                  <span className="badge bg-warning me-2">
                                                    <i className="ri-subtask-line me-1"></i>
                                                    {comment.task_title}
                                                  </span>
                                                )}
                                                {comment.task_type === 'main' && (
                                                  <span className="badge bg-primary me-2">
                                                    <i className="ri-task-line me-1"></i>
                                                    Main Task
                                                  </span>
                                                )}
                                                {comment.comment_type && (
                                                  <span className={`badge ${
                                                    comment.comment_type === 'UPDATE' ? 'bg-primary' :
                                                    comment.comment_type === 'QUESTION' ? 'bg-warning' :
                                                    comment.comment_type === 'FEEDBACK' ? 'bg-info' :
                                                    comment.comment_type === 'APPROVAL' ? 'bg-success' :
                                                    'bg-secondary'
                                                  }`}>
                                                    {comment.comment_type}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <p className="mb-0 mt-2">{comment.comment}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {/* Pagination */}
                                    {comments.length > commentsPerPage && (
                                      <div className="d-flex justify-content-center mt-4">
                                        <nav aria-label="Comments pagination">
                                          <ul className="pagination">
                                            <li className={`page-item ${currentCommentPage === 1 ? 'disabled' : ''}`}>
                                              <button className="page-link" onClick={prevCommentPage}>
                                                Previous
                                              </button>
                                            </li>
                                            
                                            {[...Array(totalCommentPages).keys()].map(number => (
                                              <li key={number + 1} className={`page-item ${currentCommentPage === number + 1 ? 'active' : ''}`}>
                                                <button 
                                                  className="page-link" 
                                                  onClick={() => paginateComments(number + 1)}
                                                >
                                                  {number + 1}
                                                </button>
                                              </li>
                                            ))}
                                            
                                            <li className={`page-item ${currentCommentPage === totalCommentPages ? 'disabled' : ''}`}>
                                              <button className="page-link" onClick={nextCommentPage}>
                                                Next
                                              </button>
                                            </li>
                                          </ul>
                                        </nav>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-center py-5">
                                    <i className="ri-discuss-line ri-2x text-muted mb-3"></i>
                                    <p className="text-muted mb-0">No comments available for this task.</p>
                                    <p className="text-muted small">Team members and team leaders can add comments to this task and its subtasks.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Logs Tab */}
                      {activeTab === 'logs' && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-12">
                              <div className="mb-4">
                                <h5 className="mb-3">Daily Logs ({logs.length})</h5>
                                {currentLogs.length > 0 ? (
                                  <div className="list-group">
                                    {currentLogs.map((log, index) => (
                                      <div key={log.id} className="card mb-3 border shadow-sm">
                                        <div className="card-body">
                                          <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="d-flex align-items-center">
                                              <div className="avatar-xs bg-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                                                <span className="text-white small">
                                                  {(log.created_by_name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                              </div>
                                              <div>
                                                <h6 className="mb-0">{log.created_by_name || 'Unknown User'}</h6>
                                                <small className="text-muted">
                                                  {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown date'}
                                                </small>
                                              </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                              {log.task_type === 'subtask' && (
                                                <span className="badge bg-warning me-2">
                                                  <i className="ri-subtask-line me-1"></i>
                                                  {log.task_title}
                                                </span>
                                              )}
                                              {log.task_type === 'main' && (
                                                <span className="badge bg-primary me-2">
                                                  <i className="ri-task-line me-1"></i>
                                                  Main Task
                                                </span>
                                              )}
                                              {log.time_spent && (
                                                <span className="badge bg-info">
                                                  {formatTimeSpent(log.time_spent)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          
                                          <div className="mt-3">
                                            {log.work_done && (
                                              <div className="mb-2">
                                                <h6 className="text-primary">Work Done</h6>
                                                <p className="mb-0">{log.work_done}</p>
                                              </div>
                                            )}
                                            
                                            {(log.changes_made || log.file_location) && (
                                              <div className="row mb-2">
                                                {log.changes_made && (
                                                  <div className="col-md-6">
                                                    <h6 className="text-primary">Changes Made</h6>
                                                    <p className="mb-0">{log.changes_made}</p>
                                                  </div>
                                                )}
                                                {log.file_location && (
                                                  <div className="col-md-6">
                                                    <h6 className="text-primary">File Location</h6>
                                                    <p className="mb-0">{log.file_location}</p>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            
                                            {log.challenges && (
                                              <div className="mb-2">
                                                <h6 className="text-primary">Challenges</h6>
                                                <p className="mb-0">{log.challenges}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-5">
                                    <i className="ri-time-line ri-2x text-muted mb-3"></i>
                                    <p className="text-muted mb-0">No daily logs recorded for this task or its subtasks.</p>
                                    <p className="text-muted small">Team members can add daily logs to track their progress on tasks and subtasks.</p>
                                  </div>
                                )}
                                
                                {/* Pagination */}
                                {logs.length > logsPerPage && (
                                  <div className="d-flex justify-content-center mt-4">
                                    <nav aria-label="Logs pagination">
                                      <ul className="pagination">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                          <button className="page-link" onClick={prevPage}>
                                            Previous
                                          </button>
                                        </li>
                                        
                                        {[...Array(totalPages).keys()].map(number => (
                                          <li key={number + 1} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                                            <button 
                                              className="page-link" 
                                              onClick={() => paginate(number + 1)}
                                            >
                                              {number + 1}
                                            </button>
                                          </li>
                                        ))}
                                        
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                          <button className="page-link" onClick={nextPage}>
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
                      )}

                      {/* Attachments Tab */}
                      {activeTab === 'attachments' && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-12">
                              <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h5 className="mb-0">Uploaded Attachments</h5>
                                  <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => setShowUploadModal(true)}
                                  >
                                    <i className="ri-upload-line me-1"></i>
                                    Upload Attachment
                                  </button>
                                </div>
                                {attachments.length > 0 ? (
                                  <div className="row">
                                    {attachments.map(attachment => (
                                      <div key={attachment.id} className="col-md-6 col-lg-4 mb-3">
                                        <div className="card border h-100">
                                          <div className="card-body">
                                            <div className="d-flex align-items-center mb-3">
                                              <div className="avatar-sm bg-light rounded me-3">
                                                <i className={`ri-file-${getFileIcon(attachment.file_type)}-line ri-lg text-primary`}></i>
                                              </div>
                                              <div>
                                                <h6 className="mb-0 text-truncate" style={{ maxWidth: '150px' }}>{attachment.file_name || attachment.name || 'Unknown File'}</h6>
                                                <small className="text-muted">{formatFileSize(attachment.file_size || attachment.size)}</small>
                                                {attachment.is_from_parent && (
                                                  <span className="badge bg-info ms-2">From Parent Task</span>
                                                )}
                                              </div>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                              <small className="text-muted">
                                                {attachment.uploaded_at ? new Date(attachment.uploaded_at).toLocaleDateString() : 'Unknown date'} by {attachment.uploaded_by_name || attachment.uploaded_by_user_name || attachment.uploader_name || 'Unknown'}
                                              </small>
                                              <div>
                                                <button 
                                                  className="btn btn-sm btn-outline-primary me-1"
                                                  onClick={() => openAttachment(attachment)}
                                                >
                                                  <i className="ri-eye-line me-1"></i>
                                                  
                                                </button>
                                                <button 
                                                  className="btn btn-sm btn-outline-secondary me-1"
                                                  onClick={() => downloadAttachment(attachment)}
                                                >
                                                  <i className="ri-download-line me-1"></i>
                                                  Download
                                                </button>
                                                {!attachment.is_from_parent && ( // Only allow deletion of attachments directly associated with this task
                                                  <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteAttachment(attachment.id)}
                                                    disabled={deletingAttachmentId === attachment.id}
                                                  >
                                                    {deletingAttachmentId === attachment.id ? (
                                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    ) : (
                                                      <i className="ri-delete-bin-line"></i>
                                                    )}
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-5">
                                    <i className="ri-attachment-line ri-2x text-muted mb-3"></i>
                                    <p className="text-muted mb-0">No attachments uploaded yet.</p>
                                    <button 
                                      className="btn  btn-outline-success mt-4"
                                      onClick={() => setShowUploadModal(true)}
                                    >
                                      <i className="ri-refresh-line me-1"></i>
                                      Upload First Attachments
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
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

      {/* Attachment View Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalContent.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body text-center">
                {modalContent.type && modalContent.type.includes('image') ? (
                  <img 
                    src={modalContent.url} 
                    alt={modalContent.name} 
                    className="img-fluid"
                    style={{ maxHeight: '70vh' }}
                  />
                ) : modalContent.type && (modalContent.type.includes('pdf') || modalContent.type.includes('text')) ? (
                  <iframe 
                    src={modalContent.url} 
                    title={modalContent.name}
                    className="w-100"
                    style={{ height: '70vh' }}
                  />
                ) : (
                  <div>
                    <i className="ri-file-line ri-3x text-muted mb-3"></i>
                    <p>Preview not available for this file type.</p>
                    <a href={modalContent.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                      <i className="ri-download-line me-1"></i>
                      Download File
                    </a>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <a href={modalContent.url} download={modalContent.name} className="btn btn-outline-primary">
                  <i className="ri-download-line me-1"></i>
                  Download
                </a>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subtask Modal */}
      {showCancelModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-white border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="ri-close-circle-line me-2"></i>
                  Cancel Subtask
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCancelModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 p-2 bg-light rounded">
                  <div className="d-flex">
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{selectedSubtask?.title}</h5>
                      <p className="mb-0 text-muted">Please provide a reason for cancelling this subtask.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Cancellation Reason<b className="text-danger"> *</b></label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason for cancellation..."
                    disabled={cancelLoading}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer bg-light bg-opacity-50">
                <button 
                  type="button" 
                  className="btn btn-soft-secondary" 
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={confirmCancelSubtask}
                  disabled={cancelLoading || !cancelReason.trim()}
                >
                  {cancelLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Subtask Modal */}
      {showReassignModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-white border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="ri-refresh-line me-2"></i>
                  Reassign Cancelled Subtask
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowReassignModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 p-2 bg-light rounded">
                  <div className="d-flex">
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{selectedSubtask?.title}</h5>
                      <p className="mb-0 text-muted">Subtask is currently cancelled. Reassign to a team member or team leader to reactivate.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Select Team Member or Team Leader</label>
                  <select
                    className="form-select"
                    value={selectedTeamMember}
                    onChange={(e) => setSelectedTeamMember(e.target.value)}
                    disabled={reassignLoading}
                  >
                    <option value="">Choose a team member or team leader</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} 
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Select a team member or team leader to reassign this subtask to.
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light bg-opacity-50">
                <button 
                  type="button" 
                  className="btn btn-soft-secondary" 
                  onClick={() => setShowReassignModal(false)}
                  disabled={reassignLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-primary"
                  onClick={confirmReassignSubtask}
                  disabled={reassignLoading || !selectedTeamMember}
                >
                  {reassignLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Reassigning...
                    </>
                  ) : (
                    'Reassign Subtask'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {showAddCommentModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Comment</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddCommentModal(false)}></button>
              </div>
              <form onSubmit={handleAddComment}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Comment Type</label>
                    <select 
                      className="form-select"
                      value={commentType}
                      onChange={(e) => setCommentType(e.target.value)}
                    >
                      <option value="UPDATE">Update</option>
                      <option value="QUESTION">Question</option>
                      <option value="FEEDBACK">Feedback</option>
                      <option value="APPROVAL">Approval</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Comment</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Enter your comment here..."
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddCommentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-outline-primary">
                    <i className="ri-add-line me-1"></i>
                    Add Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-white border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="ri-edit-line me-2"></i>
                  Edit Task
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleSaveEditedTask}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Task Title <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={editTaskData.title}
                      onChange={(e) => setEditTaskData({...editTaskData, title: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editTaskData.description}
                      onChange={(e) => setEditTaskData({...editTaskData, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="row">
                    {/* <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editTaskData.due_date}
                        onChange={(e) => setEditTaskData({...editTaskData, due_date: e.target.value})}
                      />
                    </div> */}
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Priority</label>
                      <select
                        className="form-select"
                        value={editTaskData.priority}
                        onChange={(e) => setEditTaskData({...editTaskData, priority: e.target.value})}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* <div className="mb-3">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={editTaskData.status}
                      onChange={(e) => setEditTaskData({...editTaskData, status: e.target.value})}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div> */}
                  
                  {/* Reason field - mandatory */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Reason for Changes <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      placeholder="Please provide a reason for these changes..."
                      required
                    ></textarea>
                    <div className="form-text">Please explain why these changes are being made.</div>
                  </div>
                </div>
                <div className="modal-footer bg-light bg-opacity-50">
                  <button type="button" className="btn btn-soft-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-outline-primary"
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upload Attachment Modal */}
      {showUploadModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-white border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="ri-upload-line me-2"></i>
                  Upload Attachments
                </h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                }}></button>
              </div>
              <form onSubmit={handleFileUpload}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Select Files</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={handleFileSelect}
                      multiple
                      disabled={uploadLoading}
                    />
                    <div className="form-text">You can select multiple files to upload.</div>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="mb-3">
                      <h6 className="mb-2">Selected Files ({selectedFiles.length}):</h6>
                      <ul className="list-group">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <i className="ri-file-line me-2"></i>
                              {file.name}
                            </div>
                            <small className="text-muted">{formatFileSize(file.size)}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="modal-footer bg-light bg-opacity-50">
                  <button 
                    type="button" 
                    className="btn btn-soft-secondary" 
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFiles([]);
                    }}
                    disabled={uploadLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-outline-primary"
                    disabled={uploadLoading || selectedFiles.length === 0}
                  >
                    {uploadLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      'Upload Files'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTaskPage;
