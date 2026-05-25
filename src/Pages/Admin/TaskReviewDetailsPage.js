import React, { useState, useEffect, useContext, useRef } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useParams, Navigate } from 'react-router-dom';

const TaskReviewDetailsPage = () => {
  // CSS Keyframes for sidebar animations
  const sidebarStyles = (
    <style>{`
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(100%);
        }
      }
    `}</style>
  );
  const { leadCrmUser, hasRole } = useContext(ConfigContext);
  const navigate = useNavigate();
  const { taskId } = useParams();
  
  // All state declarations come first to satisfy React Hooks rules
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('UPDATE');
  const [attachments, setAttachments] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [showModal, setShowModal] = useState(false);
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', url: '', name: '' });
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAttachments, setReviewAttachments] = useState([]);
  const reviewFileInputRef = useRef(null);
  // New states for reassign functionality
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);
  // New states for logs functionality
  const [logs, setLogs] = useState([]);
  const [subtaskLogs, setSubtaskLogs] = useState({}); // Object to store logs for each subtask
  // New states for edit task functionality
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
  
  // New states for forward to tester functionality
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [testers, setTesters] = useState([]);
  const [selectedTester, setSelectedTester] = useState('');
  const [forwardLoading, setForwardLoading] = useState(false);
  
  // New state for comments pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage] = useState(5);
  // New state for logs pagination
  const [currentLogsPage, setCurrentLogsPage] = useState(1);
  const [logsPerPage] = useState(5);
  
  // New states for test cases functionality
  const [testCases, setTestCases] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('test-cases'); // For test case sub-tabs
  const [subSubTab, setSubSubTab] = useState(null); // For bug sub-sub-tabs
  const [currentBugPage, setCurrentBugPage] = useState(1);
  const [bugsPerPage] = useState(10);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [selectedBug, setSelectedBug] = useState(null);
  const [showTestCaseSidebar, setShowTestCaseSidebar] = useState(false);
  const [showBugSidebar, setShowBugSidebar] = useState(false);
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [showEditTestCaseModal, setShowEditTestCaseModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showBugAttachmentsModal, setShowBugAttachmentsModal] = useState(false);
  const [testCaseForm, setTestCaseForm] = useState({
    name: '',
    description: '',
    expectedResult: '',
    status: 'Pending'
  });
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    status: 'Open',
    developerStatus: 'Open'
  });
  const [testCaseFile, setTestCaseFile] = useState(null);
  const [bugFile, setBugFile] = useState(null);
  const testCaseFileInputRef = useRef(null);
  const bugFileInputRef = useRef(null);
  const [currentBugAttachments, setCurrentBugAttachments] = useState([]);
  const [currentBugForAttachments, setCurrentBugForAttachments] = useState(null);
  const [selectedBugStatus, setSelectedBugStatus] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  
  // State for attachment modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false); // For viewing attachments
  const [attachmentToView, setAttachmentToView] = useState(null); // Current attachment to view
  
  // State for bug attachments
  const [bugAttachments, setBugAttachments] = useState({}); // Store attachments by bug ID
  
  // Pagination states for attachments
  const [currentAttachmentPage, setCurrentAttachmentPage] = useState(1);
  const [attachmentsPerPage] = useState(10);
  
  // Pagination states for subtasks
  const [currentSubtaskPage, setCurrentSubtaskPage] = useState(1);
  const [subtasksPerPage] = useState(10);

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

  // Function to fetch testers
  const fetchTesters = async () => {
    try {
      const response = await axios.get(
        buildApiUrl('/users?role=QA_TESTER'),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        // Filter to only include active testers
        const activeTesters = response.data.data.users.filter(user => user.is_active === 1 || user.is_active === true);
        setTesters(activeTesters || []);
      } else {
        toast.error(`Failed to fetch testers: ${response.data.message || 'Unknown error'}`);
        setTesters([]);
      }
    } catch (error) {
      console.error('Error fetching testers:', error);
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to fetch testers'}`);
      } else {
        toast.error('Network error: Failed to fetch testers');
      }
      setTesters([]);
    }
  };

  // Function to forward task to tester
  const forwardTaskToTester = async () => {
    if (!selectedTester) {
      toast.error('Please select a tester');
      return;
    }
    
    setForwardLoading(true);
    
    try {
      const response = await axios.post(
        buildApiUrl(`/tasks/${taskId}/forward-to-tester`),
        { testerId: selectedTester },
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        toast.success('Task forwarded to tester successfully');
        setShowForwardModal(false);
        setSelectedTester('');
        // Refresh the task details
        fetchTaskDetails();
      } else {
        toast.error(`Failed to forward task: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error forwarding task to tester:', error);
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to forward task'}`);
      } else {
        toast.error('Network error: Failed to forward task');
      }
    } finally {
      setForwardLoading(false);
    }
  };

  // Function to open attachment - force download for all file types
  const openAttachment = (attachment) => {
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

  // Function to view attachment in browser
  const viewAttachment = (attachment) => {
    const baseUrl = process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
    // Fix the file path by extracting the relative path after 'uploads'
    let filePath = attachment.file_path;
    
    // Handle different types of file paths
    if (filePath.startsWith('file://') || filePath.includes('C:') || filePath.includes('D:')) {
      // If it's a local file path, extract the relative path after 'uploads'
      const pathParts = filePath.split(/uploads\\|uploads\//);
      if (pathParts.length > 1) {
        filePath = '/uploads/' + pathParts[1];
      }
    } else if (filePath.includes('Task Manager/server/uploads')) {
      // Extract the relative path after 'Task Manager/server/uploads'
      const pathParts = filePath.split('Task Manager/server/uploads');
      if (pathParts.length > 1) {
        filePath = '/uploads' + pathParts[1];
      }
    } else if (!filePath.startsWith('/')) {
      // If it's already a relative path but doesn't start with /, add it
      filePath = '/' + filePath;
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

  // Fetch team leaders from the same department
  const fetchTeamLeaders = async () => {
    if (!task || !task.assigned_to_department) return;
    
    try {
      const response = await axios.get(
        buildApiUrl(`/departments/${task.assigned_to_department}/team-leaders`),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setTeamLeaders(response.data.data);
        // Set the current team leader as default selection
        if (task.assigned_to_team_leader) {
          setSelectedTeamLeader(task.assigned_to_team_leader.toString());
        }
      }
    } catch (error) {
      
      toast.error('Failed to load team leaders');
    }
  };

  // Fetch task details
  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      
      // Get task details (this endpoint returns task, subtasks, assignment_history, and attachments)
      const taskResponse = await axios.get(
        buildApiUrl(`/tasks/${taskId}`),
        { headers: getAuthHeaders() }
      );

      if (taskResponse.data.success) {
        setTask(taskResponse.data.data.task);
        
        // Get subtasks
        setSubtasks(taskResponse.data.data.subtasks || []);
        
        // Get task comments
        const commentsResponse = await axios.get(
          buildApiUrl(`/tasks/${taskId}/comments`),
          { headers: getAuthHeaders() }
        );

        if (commentsResponse.data.success) {
          // Sort comments by created_at in descending order (newest first)
          const sortedComments = (commentsResponse.data.data.comments || []).sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          setComments(sortedComments);
        }

        // Get task attachments directly associated with this task
        let allAttachments = taskResponse.data.data.attachments || [];
        
        // If this is a subtask, also fetch attachments from the parent task
        if (taskResponse.data.data.task.parent_task_id) {
          try {
            const parentResponse = await axios.get(
              buildApiUrl(`/tasks/${taskResponse.data.data.task.parent_task_id}/attachments`),
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
        
        // Get team members associated with this task
        if (taskResponse.data.data.task.assigned_to_team_leader) {
          try {
            const teamResponse = await axios.get(
              buildApiUrl(`/team/leader/${taskResponse.data.data.task.assigned_to_team_leader}/members`),
              { headers: getAuthHeaders() }
            );
            
            if (teamResponse.data.success) {
              setTeamMembers(teamResponse.data.data.members || []);
            }
          } catch (teamError) {
            
            // Not critical, continue without team members
          }
        }
        
        // Get task logs
        try {
          // Fetch logs for the main task
          const mainTaskResponse = await axios.get(
            buildApiUrl(`/tasks/${taskId}/logs`),
            { headers: getAuthHeaders() }
          );

          let allLogs = [];
          let subtaskLogsObj = {};
          
          if (mainTaskResponse.data.success) {
            // Add main task logs with task_type identifier
            allLogs = mainTaskResponse.data.data.logs.map(log => ({
              ...log,
              task_type: 'main',
              task_title: taskResponse.data.data.task?.title || 'Main Task',
              task_id: taskId
            })) || [];
          }

          // Fetch logs for each subtask
          for (const subtask of (taskResponse.data.data.subtasks || [])) {
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
                  task_id: subtask.id,
                  parent_task_id: taskId
                })) || [];
                
                // Store subtask logs in separate object for easy access
                subtaskLogsObj[subtask.id] = subtaskLogs;
                
                // Add subtask logs to all logs array
                allLogs = [...allLogs, ...subtaskLogs];
              }
            } catch (subtaskError) {
            }
          }

          // Sort logs by created_at timestamp (newest first)
          allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          setLogs(allLogs);
          setSubtaskLogs(subtaskLogsObj);
        } catch (logsError) {
          
          // Not critical, continue without logs
        }
      }
    } catch (error) {
      
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  // Get logs for a specific subtask
  const getSubtaskLogs = (subtaskId) => {
    return subtaskLogs[subtaskId] || [];
  };

  // Reset pagination when logs change
  useEffect(() => {
    setCurrentLogsPage(1);
  }, [logs.length]);

  // Reset subtask pagination when subtasks change
  useEffect(() => {
    if (subtasks && subtasks.length > 0) {
      setCurrentSubtaskPage(1);
    }
  }, [subtasks.length]);

  useEffect(() => {
    fetchTaskDetails();
    // Also fetch test cases and bugs when task details are fetched
    fetchTaskTestCases();
    fetchTaskBugs();
  }, [taskId]);

  // Fetch team leaders when task is loaded and is cancelled
  useEffect(() => {
    if (task && task.status === 'CANCELLED') {
      fetchTeamLeaders();
    }
  }, [task]);

  useEffect(() => {
    // Fetch testers when component mounts
    fetchTesters();
  }, []);
  
  useEffect(() => {
    // Fetch testers when forward modal is opened
    if (showForwardModal) {
      fetchTesters();
    }
  }, [showForwardModal]);

  // Reset subtask pagination when active tab changes
  useEffect(() => {
    if (activeTab === 'subtasks') {
      setCurrentSubtaskPage(1);
    }
  }, [activeTab]);

  // Fetch bug attachments when bugs are loaded
  useEffect(() => {
    const fetchBugAttachments = async () => {
      if (bugs.length > 0) {
        try {
          // Create a copy of the current bugAttachments state
          let newBugAttachments = { ...bugAttachments };
          
          // Fetch attachments for each bug
          for (const bug of bugs) {
            try {
              const response = await axios.get(
                buildApiUrl(`/tasks/${taskId}/bugs/${bug.id}/attachments`),
                { headers: getAuthHeaders() }
              );
              
              if (response.data.success) {
                newBugAttachments[bug.id] = response.data.data || [];
              } else {
                newBugAttachments[bug.id] = [];
              }
            } catch (error) {
              console.error(`Error fetching attachments for bug ${bug.id}:`, error);
              newBugAttachments[bug.id] = [];
            }
          }
          
          // Update the state with all bug attachments
          setBugAttachments(newBugAttachments);
        } catch (error) {
          console.error('Error in fetching all bug attachments:', error);
        }
      } else {
        // If no bugs, reset the bugAttachments
        setBugAttachments({});
      }
    };
    
    fetchBugAttachments();
  }, [bugs, taskId]);

  // Handle task review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!task) return;
    
    try {
      // First upload attachments if any
      if (reviewAttachments.length > 0) {
        try {
          const uploadPromises = reviewAttachments.map(file => {
            const formData = new FormData();
            formData.append('attachment', file);
            
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
          
          const uploadResponses = await Promise.all(uploadPromises);
          const allSuccessful = uploadResponses.every(response => response.data.success);
          
          if (!allSuccessful) {
            toast.error('Some attachments failed to upload. Please try again.');
            return;
          }
        } catch (uploadError) {
          if (uploadError.response) {
            toast.error(`Error uploading attachments: ${uploadError.response.data.message || uploadError.response.statusText || 'Failed to upload attachments'}`);
          } else {
            toast.error('Network error: Failed to upload attachments');
          }
          return;
        }
      }
      
      // Then submit the review
      const payload = {
        action: reviewAction,
        // Only include notes and feedback if they have values
        ...(reviewNotes && { review_notes: reviewNotes }),
        ...(feedback && { feedback: feedback })
      };

      const response = await axios.post(
        buildApiUrl(`/tasks/${taskId}/review`),
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success(`Task ${reviewAction.toLowerCase()}d successfully`);
        setShowReviewModal(false);
        setReviewAction('APPROVE');
        setReviewNotes('');
        setFeedback('');
        setReviewAttachments([]);
        if (reviewFileInputRef.current) {
          reviewFileInputRef.current.value = '';
        }
        fetchTaskDetails(); // Refresh the task list
      } else {
        toast.error(`Failed to review task: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to review task'}`);
      } else {
        toast.error('Network error: Failed to review task');
      }
    }
  };

  // State for direct task completion modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('Task completed by admin');
  const [actualHours, setActualHours] = useState(null);
  
  // Handle direct task completion for DM_APPROVED tasks
  const handleCompleteTask = async () => {
    if (!task) return;
    
    try {
      const payload = {
        status: 'COMPLETED',
        completion_notes: completionNotes,
        actual_hours: actualHours || null
      };

      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/status`),
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Task completed successfully');
        setShowCompleteModal(false);
        setCompletionNotes('Task completed by admin');
        setActualHours(null);
        fetchTaskDetails(); // Refresh the task details
      } else {
        toast.error(`Failed to complete task: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to complete task'}`);
      } else {
        toast.error('Network error: Failed to complete task');
      }
    }
  };

  // Function to open the completion modal
  const openCompleteModal = () => {
    setCompletionNotes('Task completed by admin');
    setActualHours(null);
    setShowCompleteModal(true);
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

  // Handle task reassignment
  const handleReassignTask = async () => {
    if (!selectedTeamLeader) {
      toast.error('Please select a team leader');
      return;
    }

    setReassignLoading(true);
    
    try {
      // First, reassign the task to the selected team leader
      const assignResponse = await axios.post(
        buildApiUrl(`/tasks/${taskId}/assign`),
        {
          assigned_to_type: 'TEAM_LEADER',
          assigned_to_id: parseInt(selectedTeamLeader),
          notes: 'Task reassigned after cancellation'
        },
        { headers: getAuthHeaders() }
      );

      if (!assignResponse.data.success) {
        throw new Error(assignResponse.data.message || 'Failed to reassign task');
      }

      // Then, update the task status to IN_PROGRESS
      const statusResponse = await axios.put(
        buildApiUrl(`/tasks/${taskId}/status`),
        { status: 'IN_PROGRESS' },
        { headers: getAuthHeaders() }
      );

      if (!statusResponse.data.success) {
        throw new Error(statusResponse.data.message || 'Failed to update task status');
      }

      toast.success('Task reassigned successfully');
      setShowReassignModal(false);
      fetchTaskDetails(); // Refresh the task details
    } catch (error) {
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to reassign task'}`);
      } else {
        toast.error('Network error: Failed to reassign task');
      }
    } finally {
      setReassignLoading(false);
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
        fetchTaskDetails(); // Refresh comments
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

  // Function to close all modals
  const closeAllModals = () => {
    setShowTestCaseModal(false);
    setShowEditTestCaseModal(false);
    setShowTestCaseSidebar(false);
    setShowBugSidebar(false);
    setShowAttachmentModal(false);
    setShowBugAttachmentsModal(false);
    setShowModal(false);
    setModalContent({ type: '', url: '', name: '' });
    // Reset sub-tabs when closing modals
    setSubSubTab(null);
    // Reset subtask page when closing modals
    setCurrentSubtaskPage(1);
  };
  
  // Function to delete attachment
  const deleteAttachment = async (attachmentId, fileName, isBugAttachment = false, taskId = null, bugId = null) => {
    try {
      // Determine the API endpoint based on whether it's a bug attachment
      let apiUrl;
      if (isBugAttachment && taskId && bugId) {
        // Delete bug attachment
        apiUrl = `/tasks/${taskId}/bugs/${bugId}/attachments/${attachmentId}`;
      } else {
        // Delete regular task attachment
        apiUrl = `/tasks/attachments/${attachmentId}`;
      }
      
      const response = await axios.delete(
        buildApiUrl(apiUrl),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Attachment deleted successfully');
        // Refresh task details to update attachments
        fetchTaskDetails();
        // Also refresh bug attachments if it was a bug attachment
        if (isBugAttachment && taskId && bugId) {
          fetchTaskBugs(); // This will trigger the useEffect to reload bug attachments
        }
      } else {
        toast.error(`Failed to delete attachment: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to delete attachment'}`);
      } else {
        toast.error('Network error: Failed to delete attachment');
      }
    }
  };

  // Fetch task test cases
  const fetchTaskTestCases = async () => {
    try {
      setLoadingTestCases(true);
      setError(null);
      
      const response = await axios.get(
        buildApiUrl(`/tasks/${taskId}/test-cases`),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setTestCases(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch test cases');
        setTestCases([]);
      }
    } catch (error) {
      console.error('Error fetching test cases:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to fetch test cases');
      }
      setError(error);
      setTestCases([]);
    } finally {
      setLoadingTestCases(false);
    }
  };

  // Fetch task bugs
  const fetchTaskBugs = async () => {
    try {
      setLoadingBugs(true);
      setError(null);
      
      const response = await axios.get(
        buildApiUrl(`/tasks/${taskId}/bugs`),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setBugs(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch bugs');
        setBugs([]);
      }
    } catch (error) {
      console.error('Error fetching bugs:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to fetch bugs');
      }
      setError(error);
      setBugs([]);
    } finally {
      setLoadingBugs(false);
    }
  };

  // Create test case
  const createTestCase = async (testCaseData) => {
    try {
      const formData = new FormData();
      formData.append('name', testCaseData.name);
      formData.append('description', testCaseData.description);
      formData.append('expected_result', testCaseData.expectedResult);
      formData.append('status', testCaseData.status);
      formData.append('task_id', taskId);
      
      if (testCaseData.attachment) {
        formData.append('attachment', testCaseData.attachment);
      }

      const response = await axios.post(
        buildApiUrl(`/test-cases`),
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Test case created successfully');
        fetchTaskTestCases(); // Refresh test cases
        setShowTestCaseModal(false);
        setTestCaseForm({
          name: '',
          description: '',
          expectedResult: '',
          status: 'Pending'
        });
        setTestCaseFile(null);
      } else {
        toast.error(`Failed to create test case: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to create test case'}`);
      } else {
        toast.error('Network error: Failed to create test case');
      }
    }
  };

  // Update test case
  const updateTestCase = async (testCaseId, testCaseData) => {
    try {
      const formData = new FormData();
      formData.append('name', testCaseData.name);
      formData.append('description', testCaseData.description);
      formData.append('expected_result', testCaseData.expectedResult);
      formData.append('status', testCaseData.status);
      
      if (testCaseData.attachment) {
        formData.append('attachment', testCaseData.attachment);
      }

      const response = await axios.put(
        buildApiUrl(`/test-cases/${testCaseId}`),
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Test case updated successfully');
        fetchTaskTestCases(); // Refresh test cases
        setShowEditTestCaseModal(false);
      } else {
        toast.error(`Failed to update test case: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to update test case'}`);
      } else {
        toast.error('Network error: Failed to update test case');
      }
    }
  };

  // Create bug
  const createBug = async (bugData) => {
    try {
      const formData = new FormData();
      formData.append('title', bugData.title);
      formData.append('description', bugData.description);
      formData.append('severity', bugData.severity);
      formData.append('status', bugData.status);
      formData.append('task_id', taskId);
      
      if (bugData.attachment) {
        formData.append('attachment', bugData.attachment);
      }

      const response = await axios.post(
        buildApiUrl(`/bugs`),
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Bug reported successfully');
        fetchTaskBugs(); // Refresh bugs
        setShowBugModal(false);
        setBugForm({
          title: '',
          description: '',
          severity: 'Medium',
          status: 'Open',
          developerStatus: 'Open'
        });
        setBugFile(null);
      } else {
        toast.error(`Failed to report bug: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to report bug'}`);
      } else {
        toast.error('Network error: Failed to report bug');
      }
    }
  };

  // Update bug status (only developer status for employees/team leaders)
  const updateBug = async (bugId, status) => {
    try {
      const response = await axios.put(
        buildApiUrl(`/bugs/${bugId}/status`),
        { developer_status: status },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Bug status updated successfully');
        fetchTaskBugs(); // Refresh bugs
      } else {
        toast.error(`Failed to update bug status: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to update bug status'}`);
      } else {
        toast.error('Network error: Failed to update bug status');
      }
    }
  };

  // Helper function to reset attachment page
  const resetAttachmentPage = () => {
    setCurrentAttachmentPage(1);
  };

  // Helper function to get current attachments based on pagination
  const getCurrentAttachments = (attachmentsList) => {
    const startIndex = (currentAttachmentPage - 1) * attachmentsPerPage;
    const endIndex = startIndex + attachmentsPerPage;
    return attachmentsList.slice(startIndex, endIndex);
  };

  // Function to go to next attachment page
  const nextAttachmentPage = (totalAttachments) => {
    const totalPages = Math.ceil(totalAttachments / attachmentsPerPage);
    if (currentAttachmentPage < totalPages) {
      setCurrentAttachmentPage(prev => prev + 1);
    }
  };

  // Function to go to previous attachment page
  const prevAttachmentPage = () => {
    if (currentAttachmentPage > 1) {
      setCurrentAttachmentPage(prev => prev - 1);
    }
  };

  // Function to paginate to specific attachment page
  const paginateAttachments = (pageNumber) => {
    setCurrentAttachmentPage(pageNumber);
  };

  // Helper function to reset subtask page
  const resetSubtaskPage = () => {
    setCurrentSubtaskPage(1);
  };

  // Helper function to get current subtasks based on pagination
  const getCurrentSubtasks = () => {
    const startIndex = (currentSubtaskPage - 1) * subtasksPerPage;
    const endIndex = startIndex + subtasksPerPage;
    return subtasks.slice(startIndex, endIndex);
  };

  // Function to go to next subtask page
  const nextSubtaskPage = () => {
    const totalPages = Math.ceil(subtasks.length / subtasksPerPage);
    if (currentSubtaskPage < totalPages) {
      setCurrentSubtaskPage(prev => prev + 1);
    }
  };

  // Function to go to previous subtask page
  const prevSubtaskPage = () => {
    if (currentSubtaskPage > 1) {
      setCurrentSubtaskPage(prev => prev - 1);
    }
  };

  // Function to paginate to specific subtask page
  const paginateSubtasks = (pageNumber) => {
    setCurrentSubtaskPage(pageNumber);
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
                      onClick={() => navigate('/admin/task_Approvel')}
                    >
                      Go to Task Review
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

  return (
    <div className="main-content">
      {sidebarStyles}
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-0">Task Review Details</h4>
                      <p className="text-muted mb-0">Review and approve task submitted by team leader</p>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-secondary"
                         onClick={() => navigate(-1)}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back 
                      </button>
                      <button 
                        className="btn btn-outline-primary"
                        onClick={handleOpenEditModal}
                      >
                        <i className="ri-edit-line me-2"></i>
                        Edit Task
                      </button>
                      <button 
                        className="btn btn-outline-info"
                        onClick={() => setShowForwardModal(true)}
                      >
                        <i className="ri-send-plane-line me-2"></i>
                        Forward to Tester
                      </button>
                      {task.status === 'CANCELLED' ? (
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => setShowReassignModal(true)}
                        >
                          <i className="ri-refresh-line me-2"></i>
                          Reassign Task
                        </button>
                      ) : (
                        <>
                          <button 
                            className="btn btn-outline-success"
                            onClick={() => {
                              // For admin, always use direct completion modal
                              // This allows completing tasks regardless of current status
                              openCompleteModal();
                            }}
                          >
                            <i className="ri-check-line me-2"></i>
                            Mark as Completed
                          </button>
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => setShowReviewModal(true)}
                          >
                            <i className="ri-file-check-line me-2"></i>
                            Review Task
                          </button>
                          {/* <button 
                            className="btn btn-outline-warning"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to set this task to In Progress?')) {
                                try {
                                  const response = await axios.put(
                                    buildApiUrl(`/tasks/${taskId}/status`),
                                    { status: 'IN_PROGRESS' },
                                    { headers: getAuthHeaders() }
                                  );
                                  
                                  if (response.data.success) {
                                    toast.success('Task status updated to In Progress');
                                    fetchTaskDetails();
                                  } else {
                                    toast.error(response.data.message || 'Failed to update task status');
                                  }
                                } catch (error) {
                                  if (error.response) {
                                    toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
                                  } else {
                                    toast.error('Network error: Failed to update task status');
                                  }
                                }
                              }
                            }}
                          >
                            <i className="ri-loader-4-line me-2"></i>
                            Set to In Progress
                          </button> */}
                        </>
                      )}
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
                          <div className="d-flex gap-2 mb-3 flex-wrap">
                            <span className={`badge ${
                              task.status === 'COMPLETED' ? 'bg-success' : 
                              task.status === 'IN_PROGRESS' ? 'bg-warning' : 
                              task.status === 'PENDING' ? 'bg-info' : 
                              task.status === 'SUBMITTED' ? 'bg-primary' : 
                              task.status === 'CANCELLED' ? 'bg-danger' :
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
                          <p className="mb-1"><small className="text-muted">Assigned to</small></p>
                          <h5>{task.assigned_to_name || task.Submitted_by_name || 'N/A'}</h5>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
  {/* Test Case Statuses */}
                          <div className="mb-3">
                            {(() => {
                              // Create an array of test case numbers (1, 2, 3)
                              const testCaseNumbers = [1, 2, 3];
                              
                              return testCaseNumbers.map(num => {
                                // Find the test case with this number
                                const testCase = testCases.find(tc => tc.test_case_number == num);
                                
                                if (testCase) {
                                  // If test case exists, show its status
                                  return (
                                    <span key={num} className="badge me-1" style={{ fontSize: '1em' }}>
                                      <span className="text-muted">TC{num}:</span>
                                      <span className={`badge ms-1 ${
                                        testCase.status === 'NOT_STARTED' ? 'bg-secondary' :
                                        testCase.status === 'IN_TEST' ? 'bg-info' :
                                        testCase.status === 'PASSED' ? 'bg-success' :
                                        testCase.status === 'FAILED' ? 'bg-danger' : 'bg-warning'
                                      }`}>
                                        {testCase.status === 'NOT_STARTED' ? 'Not Started' :
                                         testCase.status === 'IN_TEST' ? 'In Test' :
                                         testCase.status === 'PASSED' ? 'Passed' :
                                         testCase.status === 'FAILED' ? 'Failed' : 'Blocked'}
                                      </span>
                                    </span>
                                  );
                                } else {
                                  // If test case doesn't exist, don't show anything
                                  return null;
                                }
                              }).filter(Boolean); // Remove null values
                            })()}
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
                        {subtasks.length > 0 && (
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
                        )}
                        {subtasks.length > 0 && teamMembers.length > 0 && (
                          <li className="nav-item">
                            <a 
                              className={`nav-link ${activeTab === 'team' ? 'active' : ''}`}
                              onClick={() => setActiveTab('team')}
                              style={{ cursor: 'pointer' }}
                              role="tab"
                            >
                              <i className="ri-group-line me-2"></i>
                              Team Members ({teamMembers.length})
                            </a>
                          </li>
                        )}
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
                         <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'testCases' ? 'active' : ''}`}
                            onClick={() => setActiveTab('testCases')}
                            style={{ cursor: 'pointer' }}
                            role="tab"
                          >
                            <i className="ri-test-tube-line me-2"></i>
                            Test Cases ({testCases.length})
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
                                <h5 className="mb-3">Task Information</h5>
                                <div className="row">
                                  <div className="col-md-6">
                                    <p className="mb-2"><strong>Description:</strong></p>
                                    <div className="text-muted mb-3" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                      {formatDescription(task.description)}
                                    </div>
                                    
                                    {task.completion_notes && (
                                      <>
                                        <p className="mb-2"><strong>Completion Notes:</strong></p>
                                        <div className="text-muted mb-3" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                          {formatDescription(task.completion_notes)}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <div className="col-md-6">
                                    <h6 className="font-size-14">Task Details</h6>
                                    <p className="mb-2"><strong>Assigned By:</strong> {task.created_by_name || 'Unknown'}</p>
                                    <p className="mb-2"><strong>Assigned To:</strong> {task.Submitted_by_name || task.assigned_to_name || 'N/A'}</p>
                                    <p className="mb-2"><strong>Assigned Date:</strong> {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}</p>
                                    <p className="mb-2"><strong>Due Date:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</p>
                                    <p className="mb-2"><strong>Last Updated:</strong> {task.updated_at ? new Date(task.updated_at).toLocaleString() : 'N/A'}</p>
                                   
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subtasks Tab */}
                      {activeTab === 'subtasks' && subtasks.length > 0 && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-12">
                              <div className="mb-4">
                                <h5 className="mb-3">Subtasks</h5>
                                <div className="table-responsive">
                                  <table className="table table-centered table-nowrap mb-0">
                                    <thead className="table-light">
                                      <tr>
                                        <th>Title</th>
                                        <th>Description</th>
                                        <th>Assigned To</th>
                                                              
                                        <th>Status</th>
                                        <th>Due Date</th>
                                        <th>Priority</th>
                                                            
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {getCurrentSubtasks().map(subtask => (
                                        <tr key={subtask.id}>
                                          <td>{subtask.title?.substring(0,50)}</td>
                                          <td>{subtask.description?.substring(0,50) || 'No description'}</td>
                                          <td>{subtask.assigned_to_name || 'Unassigned'}</td>
                                                                
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
                                          <td>{subtask.due_date ? new Date(subtask.due_date).toLocaleDateString() : 'No due date'}</td>
                                          <td>
                                            <span className={`badge ${
                                              subtask.priority === 'URGENT' ? 'bg-danger' :
                                              subtask.priority === 'HIGH' ? 'bg-warning' : 
                                              subtask.priority === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                            }`}>
                                              {subtask.priority}
                                            </span>
                                          </td>
                                                                
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                                      
                                {/* Pagination for subtasks */}
                                {subtasks.length > 0 && (
                                  (() => {
                                    const totalPages = Math.ceil(subtasks.length / subtasksPerPage);
                                                          
                                    if (totalPages > 1) {
                                      return (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                          <div>
                                            Showing {(currentSubtaskPage - 1) * subtasksPerPage + 1} to {Math.min(currentSubtaskPage * subtasksPerPage, subtasks.length)} of {subtasks.length} subtasks
                                          </div>
                                          <nav>
                                            <ul className="pagination mb-0">
                                              <li className={`page-item ${currentSubtaskPage === 1 ? 'disabled' : ''}`}>
                                                <button 
                                                  className="page-link" 
                                                  onClick={prevSubtaskPage}
                                                  disabled={currentSubtaskPage === 1}
                                                >
                                                  Previous
                                                </button>
                                              </li>
                                              {(() => {
                                                const startPage = Math.max(1, currentSubtaskPage - 2);
                                                const maxPage = Math.min(totalPages, startPage + 4);
                                                const pages = [];
                                                                      
                                                for (let i = startPage; i <= maxPage; i++) {
                                                  pages.push(
                                                    <li key={i} className={`page-item ${currentSubtaskPage === i ? 'active' : ''}`}>
                                                      <button 
                                                        className="page-link" 
                                                        onClick={() => paginateSubtasks(i)}
                                                      >
                                                        {i}
                                                      </button>
                                                    </li>
                                                  );
                                                }
                                                                      
                                                return pages;
                                              })()}
                                              <li className={`page-item ${currentSubtaskPage === totalPages ? 'disabled' : ''}`}>
                                                <button 
                                                  className="page-link" 
                                                  onClick={nextSubtaskPage}
                                                  disabled={currentSubtaskPage === totalPages}
                                                >
                                                  Next
                                                </button>
                                              </li>
                                            </ul>
                                          </nav>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Team Members Tab */}
                      {activeTab === 'team' && subtasks.length > 0 && teamMembers.length > 0 && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-12">
                              <div className="mb-4">
                                <h5 className="mb-3">Team Members</h5>
                                <div className="row">
                                  {teamMembers.map(member => (
                                    <div key={member.id} className="col-md-6 col-lg-4 mb-3">
                                      <div className="card border h-100 shadow-sm">
                                        <div className="card-body">
                                          <div className="d-flex align-items-center">
                                            <div className="avatar-sm bg-light rounded me-3 d-flex align-items-center justify-content-center">
                                              <span className="text-primary fw-bold">
                                                {member.name.charAt(0).toUpperCase()}
                                              </span>
                                            </div>
                                            <div>
                                              <h6 className="mb-0">{member.name}</h6>
                                              <small className="text-muted">{member.email}</small>
                                            </div>
                                          </div>
                                          {member.designation && (
                                            <div className="mt-2">
                                              <span className="badge bg-light text-dark">{member.designation}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
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
                                  <h5 className="mb-0">Comments ({comments.length})</h5>
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
                                      {comments
                                        .slice(
                                          (currentPage - 1) * commentsPerPage,
                                          currentPage * commentsPerPage
                                        )
                                        .map((comment, index) => (
                                          <div key={comment.id} className="card mb-3 shadow-sm">
                                            <div className="card-body">
                                              <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div className="d-flex align-items-center">
                                                  <div className="avatar-xs bg-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                                                    <span className="text-white small">
                                                      {(comment.created_by_name || comment.user_name || comment.created_by_user_name || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <h6 className="mb-0">{comment.created_by_name || comment.user_name || comment.created_by_user_name || 'Unknown User'}</h6>
                                                    <small className="text-muted">
                                                      {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Unknown date'}
                                                    </small>
                                                  </div>
                                                </div>
                                                {comment.comment_type && (
                                                  <span className={`badge me-2 ${
                                                    comment.comment_type === 'UPDATE' ? 'bg-primary' :
                                                    comment.comment_type === 'QUESTION' ? 'bg-warning' :
                                                    comment.comment_type === 'FEEDBACK' ? 'bg-info' :
                                                    comment.comment_type === 'APPROVAL' ? 'bg-success' : 'bg-secondary'
                                                  }`}>
                                                    {comment.comment_type}
                                                  </span>
                                                )}
                                              </div>
                                              <p className="mb-0">{comment.comment}</p>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                    {/* Pagination Controls */}
                                    {comments.length > commentsPerPage && (
                                      <div className="d-flex justify-content-center mt-4">
                                        <nav aria-label="Comments pagination">
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
                                            
                                            {Array.from({ length: Math.ceil(comments.length / commentsPerPage) }, (_, i) => (
                                              <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                <button 
                                                  className="page-link" 
                                                  onClick={() => setCurrentPage(i + 1)}
                                                >
                                                  {i + 1}
                                                </button>
                                              </li>
                                            ))}
                                            
                                            <li className={`page-item ${currentPage === Math.ceil(comments.length / commentsPerPage) ? 'disabled' : ''}`}>
                                              <button 
                                                className="page-link" 
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === Math.ceil(comments.length / commentsPerPage)}
                                              >
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
                                    <p className="text-muted mb-0">No comments yet.</p>
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
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h5 className="mb-0">Daily Logs</h5>
                                  <span className="text-muted small">
                                    Showing {logs.length > 0 ? ((currentLogsPage - 1) * logsPerPage + 1) : 0} - {Math.min(currentLogsPage * logsPerPage, logs.length)} of {logs.length} logs
                                  </span>
                                </div>
                                
                                {/* Unified logs view - all logs sorted by most recent */}
                                {logs.length > 0 ? (
                                  <>
                                    <div className="list-group">
                                      {logs
                                        .slice(
                                          (currentLogsPage - 1) * logsPerPage,
                                          currentLogsPage * logsPerPage
                                        )
                                        .map((log, index) => (
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
                                                <div className="d-flex align-items-center gap-2">
                                                  {log.task_type && (
                                                    <span className={`badge ${log.task_type === 'main' ? 'bg-primary' : 'bg-warning'}`}>
                                                      {log.task_type === 'main' ? 'Main Task' : 'Subtask'}
                                                    </span>
                                                  )}
                                                  {log.time_spent && (
                                                    <span className="badge bg-info">
                                                      {formatTimeSpent(log.time_spent)}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              
                                              {log.task_title && log.task_type === 'subtask' && (
                                                <div className="mb-2">
                                                  <small className="text-muted">
                                                    <i className="ri-task-line me-1"></i>
                                                    Task: {log.task_title}
                                                  </small>
                                                </div>
                                              )}
                                              
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
                                    
                                    {/* Improved Pagination Controls */}
                                    {logs.length > logsPerPage && (
                                      <div className="d-flex justify-content-center mt-4">
                                        <nav aria-label="Logs pagination">
                                          <ul className="pagination mb-0">
                                            <li className={`page-item ${currentLogsPage === 1 ? 'disabled' : ''}`}>
                                              <button 
                                                className="page-link" 
                                                onClick={() => setCurrentLogsPage(1)}
                                                disabled={currentLogsPage === 1}
                                              >
                                                <i className="ri-skip-back-line"></i> First
                                              </button>
                                            </li>
                                            
                                            <li className={`page-item ${currentLogsPage === 1 ? 'disabled' : ''}`}>
                                              <button 
                                                className="page-link" 
                                                onClick={() => setCurrentLogsPage(currentLogsPage - 1)}
                                                disabled={currentLogsPage === 1}
                                              >
                                                <i className="ri-arrow-left-s-line"></i> Previous
                                              </button>
                                            </li>
                                            
                                            <li className="page-item disabled">
                                              <span className="page-link">
                                                Page {currentLogsPage} of {Math.ceil(logs.length / logsPerPage)}
                                              </span>
                                            </li>
                                            
                                            <li className={`page-item ${currentLogsPage === Math.ceil(logs.length / logsPerPage) ? 'disabled' : ''}`}>
                                              <button 
                                                className="page-link" 
                                                onClick={() => setCurrentLogsPage(currentLogsPage + 1)}
                                                disabled={currentLogsPage === Math.ceil(logs.length / logsPerPage)}
                                              >
                                                Next <i className="ri-arrow-right-s-line"></i>
                                              </button>
                                            </li>
                                            
                                            <li className={`page-item ${currentLogsPage === Math.ceil(logs.length / logsPerPage) ? 'disabled' : ''}`}>
                                              <button 
                                                className="page-link" 
                                                onClick={() => setCurrentLogsPage(Math.ceil(logs.length / logsPerPage))}
                                                disabled={currentLogsPage === Math.ceil(logs.length / logsPerPage)}
                                              >
                                                Last <i className="ri-skip-forward-line"></i>
                                              </button>
                                            </li>
                                          </ul>
                                        </nav>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-center py-5">
                                    <i className="ri-time-line ri-2x text-muted mb-3"></i>
                                    <p className="text-muted mb-0">No daily logs recorded for this task.</p>
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
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={fetchTaskDetails}
                                  >
                                    <i className="ri-refresh-line me-1"></i>
                                    Refresh
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
                                                  onClick={() => viewAttachment(attachment)}
                                                >
                                                  <i className="ri-eye-line me-1"></i>
                                                  View
                                                </button>
                                                <button 
                                                  className="btn btn-sm btn-outline-secondary"
                                                  onClick={() => openAttachment(attachment)}
                                                >
                                                  <i className="ri-download-line me-1"></i>
                                                  Download
                                                </button>
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
                                      className="btn btn-sm btn-outline-primary mt-2"
                                      onClick={fetchTaskDetails}
                                    >
                                      <i className="ri-refresh-line me-1"></i>
                                      Refresh Attachments
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

 {/* Test Cases Tab */}
        {activeTab === 'testCases' && (
          <div className="tab-pane fade show active">
            <div className="row">
              <div className="col-12">
                <div className="mb-4">
                  <h5 className="mb-3">Test Cases</h5>
                  
                  {/* Test Case Sub Tabs */}
                  <ul className="nav nav-tabs nav-tabs-custom" id="testCaseTab" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button 
                        className={`nav-link ${subTab === 'test-cases' ? 'active' : ''}`}
                        onClick={() => setSubTab('test-cases')}
                      >
                        <i className="ri-test-tube-line me-1"></i> Test Cases
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button 
                        className={`nav-link ${subTab === 'bugs' ? 'active' : ''}`}
                        onClick={() => setSubTab('bugs')}
                      >
                        <i className="ri-bug-line me-1"></i> Bugs({bugs.length})
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button 
                        className={`nav-link ${subTab === 'attachments' ? 'active' : ''}`}
                        onClick={() => {
                          setSubTab('attachments');
                          setSubSubTab('all');
                        }}
                      >
                        <i className="ri-attachment-line me-1"></i> Attachments
                      </button>
                    </li>
                  </ul>
                  
                  <div className="tab-content">
                    {/* Test Cases Sub Tab */}
                    {subTab === 'test-cases' && (
                      <div className="tab-pane fade show active">
                        <div className="card border shadow-sm">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0">Test Cases</h6>
                              <div className="d-flex align-items-center gap-2">
                                <span className={`badge ${
                                  task.tester_status === 'PENDING' ? 'bg-warning' :
                                  task.tester_status === 'IN_TEST' ? 'bg-info' :
                                  task.tester_status === 'TESTED' ? 'bg-success' : 'bg-danger'
                                }`}>
                                  {task.tester_status === 'PENDING' ? 'Pending' :
                                   task.tester_status === 'IN_TEST' ? 'In Testing' :
                                   task.tester_status === 'TESTED' ? 'Tested' : 'Rejected'}
                                </span>
                              </div>
                            </div>
                            
                            {loadingTestCases ? (
                              <div className="text-center py-3">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </div>
                            ) : (
                              <div className="row">
                                {testCases.length > 0 ? (
                                  testCases.map(testCase => {
                                    // Count active (non-resolved) bugs for this test case
                                    const activeBugs = bugs.filter(bug => 
                                      bug.test_case_id == testCase.id && 
                                      (bug.status !== 'RESOLVED' && bug.status !== 'CLOSED')
                                    ).length;
                                    
                                    // Count resolved bugs for this test case
                                    const resolvedBugs = bugs.filter(bug => 
                                      bug.test_case_id == testCase.id && 
                                      (bug.status === 'RESOLVED' || bug.status === 'CLOSED')
                                    ).length;
                                    
                                    return (
                                      <div key={testCase.id} className="col-md-4 mb-3">
                                        <div className="card h-100 border">
                                          <div 
                                            className="card-body cursor-pointer"
                                            onClick={() => {
                                              // Open test case in sidebar when clicking on the card
                                              setSelectedTestCase(testCase);
                                              setShowTestCaseSidebar(true);
                                            }}
                                          >
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                              <h6 className="card-title">TC{testCase.test_case_number}: {testCase.title}</h6>
                                              <span className={`badge ${
                                                testCase.status === 'NOT_STARTED' ? 'bg-secondary' :
                                                testCase.status === 'IN_TEST' ? 'bg-info' :
                                                testCase.status === 'PASSED' ? 'bg-success' :
                                                testCase.status === 'FAILED' ? 'bg-danger' : 'bg-warning'
                                              }`}>
                                                {testCase.status === 'NOT_STARTED' ? 'Not Started' :
                                                 testCase.status === 'IN_TEST' ? 'In Test' :
                                                 testCase.status === 'PASSED' ? 'Passed' :
                                                 testCase.status === 'FAILED' ? 'Failed' : 'Blocked'}
                                              </span>
                                            </div>
                                            <div className="mb-2">
                                              <small className="text-muted">Tester: {testCase.tester_name || 'N/A'}</small>
                                            </div>
                                            <div className="d-flex justify-content-between mb-3">
                                              <small className="text-muted">Active Bugs: <span className="badge bg-danger">{activeBugs}</span></small>
                                              <small className="text-muted">Resolved: <span className="badge bg-success">{resolvedBugs}</span></small>
                                            </div>
                                            <div className="text-center text-muted">
                                              <small>Click for details</small>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="col-12 text-center text-muted py-4">
                                    No test cases found for this task.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Bugs Sub Tab */}
                    {subTab === 'bugs' && (
                      <div className="tab-pane fade show active">
                        <div className="card border shadow-sm">
                          <div className="card-body">
                            {/* Test Case Tabs for Bugs */}
                            <ul className="nav nav-tabs mb-3" id="testCaseBugsTab" role="tablist">
                              <li className="nav-item" role="presentation">
                                <button 
                                  className={`nav-link ${subSubTab === null || subSubTab === 'all' ? 'active' : ''}`}
                                  onClick={() => setSubSubTab('all')}
                                >
                                  All Bugs
                                </button>
                              </li>
                              {testCases.map(testCase => (
                                <li className="nav-item" role="presentation" key={testCase.id}>
                                  <button 
                                    className={`nav-link ${subSubTab === testCase.id ? 'active' : ''}`}
                                    onClick={() => setSubSubTab(testCase.id)}
                                  >
                                    TC{testCase.test_case_number}: {testCase.title}
                                  </button>
                                </li>
                              ))}
                            </ul>
                            
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0">Bugs</h6>
                            </div>
                            
                            {loadingBugs ? (
                              <div className="text-center py-3">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </div>
                            ) : (
                              (() => {
                                // Filter bugs based on selected sub-tab
                                let filteredBugs = [];
                                
                                if (subSubTab === 'all' || subSubTab === null) {
                                  // Show all bugs
                                  filteredBugs = bugs;
                                } else {
                                  // Show bugs for selected test case
                                  filteredBugs = bugs.filter(bug => bug.test_case_id == subSubTab);
                                }
                                
                                // Render bugs table function
                                const renderBugsTable = (bugsToRender) => {
                                  // Calculate pagination
                                  const indexOfLastBug = currentBugPage * bugsPerPage;
                                  const indexOfFirstBug = indexOfLastBug - bugsPerPage;
                                  const currentBugs = bugsToRender.slice(indexOfFirstBug, indexOfLastBug);
                                  
                                  return (
                                    <>
                                      <div className="table-responsive">
                                        <table className="table table-hover">
                                          <thead className="table-light">
                                            <tr>
                                              <th>#</th>
                                              <th>Title</th>
                                              <th>Severity</th>
                                              <th>Status</th>
                                              <th>Dev Status</th>
                                              <th>Reported By</th>
                                              <th>Created At</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {currentBugs.map((bug, index) => {
                                              const serialNumber = bugsToRender.length - indexOfFirstBug - index;
                                              return (
                                                <tr key={bug.id} className="cursor-pointer" onClick={() => {
                                                  setSelectedBug(bug);
                                                  setShowBugSidebar(true);
                                                }}>
                                                  <td>{serialNumber}</td>
                                                  <td>{bug.title}</td>
                                                  <td>
                                                    <span className={`badge ${
                                                      bug.severity === 'CRITICAL' ? 'bg-danger' :
                                                      bug.severity === 'HIGH' ? 'bg-warning' :
                                                      bug.severity === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
                                                    }`}>
                                                      {bug.severity}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    <span className={`badge ${
                                                      bug.status === 'NEW' ? 'bg-secondary' :
                                                      bug.status === 'CONFIRMED' ? 'bg-info' :
                                                      bug.status === 'IN_PROGRESS' ? 'bg-warning' :
                                                      bug.status === 'RESOLVED' ? 'bg-success' :
                                                      bug.status === 'REOPENED' ? 'bg-danger' : 'bg-dark'
                                                    }`}>
                                                      {bug.status}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    <span className={`badge ${
                                                      !bug.developer_status ? 'bg-secondary' :
                                                      bug.developer_status === 'NOT_STARTED' ? 'bg-secondary' :
                                                      bug.developer_status === 'WORKING' ? 'bg-info' :
                                                      bug.developer_status === 'ON_HOLD' ? 'bg-warning' :
                                                      bug.developer_status === 'FIXED' ? 'bg-success' :
                                                      bug.developer_status === 'TESTING' ? 'bg-primary' : 'bg-dark'
                                                    }`}>
                                                      {bug.developer_status || 'pending'}
                                                    </span>
                                                  </td>
                                                  <td>{bug.reported_by_name}</td>
                                                  <td>{bug.created_at ? new Date(bug.created_at).toLocaleDateString() : 'N/A'}</td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                      
                                      {/* Pagination for bugs */}
                                      {bugsToRender.length > 0 && (
                                        (() => {
                                          const totalPages = Math.ceil(bugsToRender.length / bugsPerPage);
                                          
                                          if (totalPages > 1) {
                                            return (
                                              <div className="d-flex justify-content-between align-items-center mt-3">
                                                <div>
                                                  Showing {(currentBugPage - 1) * bugsPerPage + 1} to {Math.min(currentBugPage * bugsPerPage, bugsToRender.length)} of {bugsToRender.length} bugs
                                                </div>
                                                <nav>
                                                  <ul className="pagination mb-0">
                                                    <li className={`page-item ${currentBugPage === 1 ? 'disabled' : ''}`}>
                                                      <button 
                                                        className="page-link" 
                                                        onClick={() => setCurrentBugPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentBugPage === 1}
                                                      >
                                                        Previous
                                                      </button>
                                                    </li>
                                                    {(() => {
                                                      const startPage = Math.max(1, currentBugPage - 2);
                                                      const maxPage = Math.min(totalPages, startPage + 4);
                                                      const pages = [];
                                                      
                                                      for (let i = startPage; i <= maxPage; i++) {
                                                        pages.push(
                                                          <li key={i} className={`page-item ${currentBugPage === i ? 'active' : ''}`}>
                                                            <button 
                                                              className="page-link" 
                                                              onClick={() => setCurrentBugPage(i)}
                                                            >
                                                              {i}
                                                            </button>
                                                          </li>
                                                        );
                                                      }
                                                      
                                                      return pages;
                                                    })()}
                                                    <li className={`page-item ${currentBugPage === totalPages ? 'disabled' : ''}`}>
                                                      <button 
                                                        className="page-link" 
                                                        onClick={() => setCurrentBugPage(prev => Math.min(prev + 1, totalPages))}
                                                        disabled={currentBugPage === totalPages}
                                                      >
                                                        Next
                                                      </button>
                                                    </li>
                                                  </ul>
                                                </nav>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()
                                      )}
                                    </>
                                  );
                                };
                                
                                return renderBugsTable(filteredBugs);
                              })()
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Attachments Sub Tab */}
                    {subTab === 'attachments' && (
                      <div className="tab-pane fade show active">
                        <div className="card border shadow-sm">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0">Attachments</h6>
                            </div>
                            
                            {/* Test Case Tabs for Attachments */}
                            <ul className="nav nav-tabs mb-3" id="testCaseAttachmentsTab" role="tablist">
                              <li className="nav-item" role="presentation">
                                <button 
                                  className={`nav-link ${subSubTab === null || subSubTab === 'all' ? 'active' : ''}`}
                                  onClick={() => {
                                    setSubSubTab('all');
                                    resetAttachmentPage();
                                  }}
                                >
                                  All Attachments
                                </button>
                              </li>
                              {testCases.map(testCase => (
                                <li className="nav-item" role="presentation" key={testCase.id}>
                                  <button 
                                    className={`nav-link ${subSubTab === testCase.id ? 'active' : ''}`}
                                    onClick={() => {
                                      setSubSubTab(testCase.id);
                                      resetAttachmentPage();
                                    }}
                                  >
                                    TC{testCase.test_case_number}: {testCase.title}
                                  </button>
                                </li>
                              ))}
                            </ul>
                            
                            <div className="table-responsive">
                              <table className="table table-hover">
                                <thead className="table-light">
                                  <tr>
                                    <th>File Name</th>
                                    <th>Test Case</th>
                                    <th>Size</th>
                                    <th>Type</th>
                                    <th>Uploaded By</th>
                                    <th>Uploaded At</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    // Filter bug attachments based on selected sub-tab
                                    let filteredAttachments = [];
                                    
                                    if (subSubTab === 'all' || subSubTab === null) {
                                      // Show all bug attachments
                                      filteredAttachments = Object.values(bugAttachments).flat();
                                    } else {
                                      // Check if subSubTab is a bug ID (direct bug attachment view)
                                      const isBugId = bugs.some(bug => bug.id == subSubTab);
                                      
                                      if (isBugId) {
                                        // Show attachments for this specific bug
                                        if (bugAttachments[subSubTab] && Array.isArray(bugAttachments[subSubTab])) {
                                          filteredAttachments = bugAttachments[subSubTab];
                                        }
                                      } else {
                                      // Show only bug attachments for selected test case
                                      // Find all bugs for this test case, then get their attachments
                                      const testCaseBugs = bugs.filter(bug => bug.test_case_id == subSubTab);
                                      filteredAttachments = [];
                                      testCaseBugs.forEach(bug => {
                                        if (bugAttachments[bug.id] && Array.isArray(bugAttachments[bug.id])) {
                                          filteredAttachments = filteredAttachments.concat(bugAttachments[bug.id]);
                                        }
                                      });
                                      }
                                    }
                                    
                                    
                                    
                                    if (filteredAttachments.length > 0) {
                                      const currentAttachments = getCurrentAttachments(filteredAttachments);
                                      const totalPages = Math.ceil(filteredAttachments.length / attachmentsPerPage);
                                      
                                      return (
                                        <>
                                          {currentAttachments.map(attachment => {
                                            // Find the bug and then the test case for this attachment
                                            const bug = bugs.find(b => b.id == attachment.bug_id);
                                            const testCase = testCases.find(tc => tc.id == (bug ? bug.test_case_id : attachment.test_case_id));
                                            
                                            return (
                                              <tr key={attachment.id}>
                                                <td>
                                                  <i className={`ri-file-${getFileIcon(attachment.file_type)}-line me-2`}></i>
                                                  {attachment.file_name}
                                                </td>
                                                <td>{testCase ? `TC${testCase.test_case_number}: ${testCase.title}` : 'N/A'}</td>
                                                <td>{formatFileSize(attachment.file_size)}</td>
                                                <td>{attachment.file_type}</td>
                                                <td>{attachment.uploaded_by_name}</td>
                                                <td>{new Date(attachment.uploaded_at).toLocaleDateString()}</td>
                                                <td>
                                                  <button 
                                                    className="btn btn-sm btn-outline-primary me-1"
                                                    onClick={() => {
                                                      // Close other modals first
                                                      closeAllModals();
                                                      // View attachment
                                                      // Fix the file path by extracting the relative path after 'uploads'
                                                      let filePath = attachment.file_path;
                                                      
                                                      // Handle different types of file paths
                                                      if (filePath.startsWith('file://') || filePath.includes('C:') || filePath.includes('D:')) {
                                                        // If it's a local file path, extract the relative path after 'uploads'
                                                        const pathParts = filePath.split(/uploads\\|uploads\//);
                                                        if (pathParts.length > 1) {
                                                          filePath = '/uploads/' + pathParts[1];
                                                        }
                                                      } else if (filePath.includes('Task Manager/server/uploads')) {
                                                        // Extract the relative path after 'Task Manager/server/uploads'
                                                        const pathParts = filePath.split('Task Manager/server/uploads');
                                                        if (pathParts.length > 1) {
                                                          filePath = '/uploads' + pathParts[1];
                                                        }
                                                      } else if (!filePath.startsWith('/')) {
                                                        // If it's already a relative path but doesn't start with /, add it
                                                        filePath = '/' + filePath;
                                                      }
                                                      
                                                      setModalContent({
                                                        type: attachment.file_type,
                                                        url: `${process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com'}${filePath}`,
                                                        name: attachment.file_name
                                                      });
                                                      setShowModal(true);
                                                    }}
                                                  >
                                                    <i className="ri-eye-line"></i>
                                                  </button>
                                                  <button 
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => {
                                                      // Download attachment using proper function
                                                      openAttachment(attachment);
                                                    }}
                                                  >
                                                    <i className="ri-download-line"></i>
                                                  </button>
                                                  <button 
                                                    className="btn btn-sm btn-outline-danger ms-1"
                                                    onClick={() => {
                                                      // Delete attachment
                                                      deleteAttachment(attachment.id, attachment.file_name, true, taskId, attachment.bug_id);
                                                    }}
                                                  >
                                                    <i className="ri-delete-bin-line"></i>
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                          {totalPages > 1 && (
                                            <tr>
                                              <td colSpan="7" className="p-0">
                                                <div className="d-flex justify-content-between align-items-center mt-3">
                                                  <div>
                                                    Showing {(currentAttachmentPage - 1) * attachmentsPerPage + 1} to {Math.min(currentAttachmentPage * attachmentsPerPage, filteredAttachments.length)} of {filteredAttachments.length} attachments
                                                  </div>
                                                  <nav>
                                                    <ul className="pagination mb-0">
                                                      <li className={`page-item ${currentAttachmentPage === 1 ? 'disabled' : ''}`}>
                                                        <button 
                                                          className="page-link" 
                                                          onClick={prevAttachmentPage}
                                                          disabled={currentAttachmentPage === 1}
                                                        >
                                                          Previous
                                                        </button>
                                                      </li>
                                                      {(() => {
                                                        const startPage = Math.max(1, currentAttachmentPage - 2);
                                                        const maxPage = Math.min(totalPages, startPage + 4);
                                                        const pages = [];
                                                        
                                                        for (let i = startPage; i <= maxPage; i++) {
                                                          pages.push(
                                                            <li key={i} className={`page-item ${currentAttachmentPage === i ? 'active' : ''}`}>
                                                              <button 
                                                                className="page-link" 
                                                                onClick={() => paginateAttachments(i)}
                                                              >
                                                                {i}
                                                              </button>
                                                            </li>
                                                          );
                                                        }
                                                        
                                                        return pages;
                                                      })()}
                                                      <li className={`page-item ${currentAttachmentPage === totalPages ? 'disabled' : ''}`}>
                                                        <button 
                                                          className="page-link" 
                                                          onClick={() => nextAttachmentPage(filteredAttachments.length)}
                                                          disabled={currentAttachmentPage === totalPages}
                                                        >
                                                          Next
                                                        </button>
                                                      </li>
                                                    </ul>
                                                  </nav>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </>
                                      );
                                    } else {
                                      return (
                                        <tr>
                                          <td colSpan="7" className="text-center text-muted py-4">
                                            {subSubTab === 'all' || subSubTab === null ? 'No bug attachments found.' : 'No bug attachments for this test case.'}
                                          </td>
                                        </tr>
                                      );
                                    }
                                  })()}
                                </tbody>
                              </table>
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
        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
       
      {/* Review Task Modal */}
      {showReviewModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-white border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="ri-file-check-line me-2"></i>
                  Review Task
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowReviewModal(false)}></button>
              </div>
              <form onSubmit={handleReviewSubmit}>
                <div className="modal-body">
                  <div className="mb-3 p-2 bg-light rounded">
                    <div className="d-flex">
                      <div className="flex-shrink-0 me-3">
                      
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="mb-1">{task?.title}</h5>
                       
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Action <span className="text-danger">*</span></label>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <div className={`card border h-100 cursor-pointer ${reviewAction === 'APPROVE' ? 'border-primary border-2' : 'border-light'}`} 
                             onClick={() => setReviewAction('APPROVE')}>
                          <div className="card-body text-center py-2">
                            <div className="avatar-xs bg-soft-primary rounded-circle mx-auto mb-1">
                              <i className="ri-checkbox-circle-line text-primary fs-12"></i>
                            </div>
                            <h6 className="mb-0 fs-13">Approve</h6>
                            
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className={`card border h-100 cursor-pointer ${reviewAction === 'REJECT' ? 'border-primary border-2' : 'border-light'}`} 
                             onClick={() => setReviewAction('REJECT')}>
                          <div className="card-body text-center py-2">
                            <div className="avatar-xs bg-soft-danger rounded-circle mx-auto mb-1">
                              <i className="ri-close-circle-line text-danger fs-12"></i>
                            </div>
                            <h6 className="mb-0 fs-13">Request Changes</h6>
                            
                          </div>
                        </div>
                      </div>
                    </div>
                    <input type="hidden" value={reviewAction} />
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Review Notes {reviewAction === 'REJECT' && <span className="text-danger">*</span>}
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder={reviewAction === 'REJECT' ? "Reason for requesting changes..." : "Notes about your review (optional)"}
                    ></textarea>
                  
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Feedback to Team Leader</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Constructive feedback for the team leader (optional)"
                    ></textarea>
                   
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Attachments (Optional)</label>
                    <input
                      ref={reviewFileInputRef}
                      type="file"
                      className="form-control"
                      multiple
                      onChange={(e) => setReviewAttachments(Array.from(e.target.files))}
                      accept="*/*"
                    />
                    <div className="form-text">
                      You can attach files to support your review (e.g., screenshots, documents, etc.)
                    </div>
                    {reviewAttachments.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted">Selected files:</small>
                        <ul className="list-unstyled mt-1">
                          {reviewAttachments.map((file, index) => (
                            <li key={index} className="d-flex align-items-center gap-2">
                              <i className="ri-file-line"></i>
                              <span className="text-truncate" style={{ maxWidth: '300px' }}>{file.name}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-danger p-0"
                                onClick={() => {
                                  const newFiles = [...reviewAttachments];
                                  newFiles.splice(index, 1);
                                  setReviewAttachments(newFiles);
                                }}
                              >
                                <i className="ri-close-line"></i>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer bg-light bg-opacity-50">
                  <button type="button" className="btn btn-soft-secondary" onClick={() => {
                    setShowReviewModal(false);
                    setReviewAttachments([]);
                    if (reviewFileInputRef.current) {
                      reviewFileInputRef.current.value = '';
                    }
                  }}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`btn ${reviewAction === 'APPROVE' ? 'btn-outline-primary' : 'btn-outline-danger'}`}
                  >
                    {reviewAction === 'APPROVE' ? 'Approve Task' : 'Request Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Task Modal */}
      {showReassignModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-white border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="ri-refresh-line me-2"></i>
                  Reassign Cancelled Task
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowReassignModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 p-2 bg-light rounded">
                  <div className="d-flex">
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{task?.title}</h5>
                      <p className="mb-0 text-muted">Task is currently cancelled. Reassign to a team leader to reactivate.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Select Team Leader</label>
                  <select
                    className="form-select"
                    value={selectedTeamLeader}
                    onChange={(e) => setSelectedTeamLeader(e.target.value)}
                    disabled={reassignLoading}
                  >
                    <option value="">Choose a team leader</option>
                    {teamLeaders.map(leader => (
                      <option key={leader.id} value={leader.id}>
                        {leader.name} {leader.id === task?.assigned_to_team_leader ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    You can reassign to the same team leader or select a different one from the same department.
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
                  onClick={handleReassignTask}
                  disabled={reassignLoading || !selectedTeamLeader}
                >
                  {reassignLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Reassigning...
                    </>
                  ) : (
                    'Reassign Task'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-white border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="ri-check-double-line me-2"></i>
                  Complete Task
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCompleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 p-2 bg-light rounded">
                  <div className="d-flex">
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{task?.title}</h5>
                      <p className="mb-0 text-muted">Current status: <strong>{task?.status?.replace('_', ' ')}</strong></p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Completion Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Add notes about task completion (optional)"
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Actual Hours (Optional)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={actualHours || ''}
                    onChange={(e) => setActualHours(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Enter actual hours spent on task"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="modal-footer bg-light bg-opacity-50">
                <button 
                  type="button" 
                  className="btn btn-soft-secondary" 
                  onClick={() => setShowCompleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-success"
                  onClick={handleCompleteTask}
                >
                  Mark as Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                ) : modalContent.type && (modalContent.type.includes('video')) ? (
                  <video 
                    src={modalContent.url} 
                    controls
                    className="w-100"
                    style={{ maxHeight: '70vh' }}
                    onError={(e) => {
                      console.error('Video failed to load:', e);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
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
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editTaskData.due_date}
                        onChange={(e) => setEditTaskData({...editTaskData, due_date: e.target.value})}
                      />
                    </div>
                    
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
                  
                  <div className="mb-3">
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
                  </div>
                  
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

      {/* Forward to Tester Modal */}
      {showForwardModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Forward Task to Tester</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowForwardModal(false);
                  setSelectedTester('');
                }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Select QA Tester</label>
                  <select
                    className="form-select"
                    value={selectedTester}
                    onChange={(e) => setSelectedTester(e.target.value)}
                    disabled={forwardLoading}
                  >
                    <option value="">Select a tester...</option>
                    {testers.map(tester => (
                      <option key={tester.id} value={tester.id}>
                        {tester.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="alert alert-info">
                  <i className="ri-information-line me-2"></i>
                  Select a QA Tester to forward this task for testing. The tester will receive a notification and the task will appear in their dashboard.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => {
                    setShowForwardModal(false);
                    setSelectedTester('');
                  }}
                  disabled={forwardLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-primary" 
                  onClick={forwardTaskToTester}
                  disabled={forwardLoading || !selectedTester}
                >
                  {forwardLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Forwarding...
                    </>
                  ) : (
                    'Forward to Tester'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Test Case Details Sidebar - Slide in from right */}
      {showTestCaseSidebar && selectedTestCase && (
        <>
          {/* Light Backdrop - Semi-transparent */}
          <div 
            onClick={() => {
              setIsClosing(true);
              setTimeout(() => {
                setShowTestCaseSidebar(false);
                setIsClosing(false);
              }, 300); // Match the animation duration
            }}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040,
              opacity: showTestCaseSidebar ? 1 : 0,
              visibility: showTestCaseSidebar ? 'visible' : 'hidden',
              transition: 'opacity 0.3s ease-in'
            }}
          ></div>
          
          {/* Sidebar Container - Fixed on right side */}
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
              animation: isClosing ? 'slideOutRight 0.3s ease-in' : (showTestCaseSidebar ? 'slideInRight 0.3s ease-out' : 'none'),
              transform: 'translateX(0)',
              transition: 'none'
            }}
            tabIndex="-1"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTestCaseSidebar(false);
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
                <div className="modal-header ">
                  <h5 className="modal-title mb-0">
                    <i className="ri-file-info-line me-2"></i>
                    Test Case Details
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => {
                      setIsClosing(true);
                      setTimeout(() => {
                        setShowTestCaseSidebar(false);
                        setIsClosing(false);
                      }, 300); // Match the animation duration
                    }}
                    aria-label="Close"
                  ></button>
                </div>
                
                {/* Bug Statistics Section */}
                <div className="px-4 pt-3">
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="ri-bug-line me-2"></i>
                        Bug Statistics
                      </h6>
                    </div>
                    <div className="card-body py-3">
                      <div className="row text-center g-2">
                        <div className="col-6">
                          <div className="p-3 bg-light rounded">
                            <h5 className="text-danger mb-1">{bugs.filter(bug => 
                              bug.test_case_id == selectedTestCase.id && 
                              (bug.status !== 'RESOLVED' && bug.status !== 'CLOSED')
                            ).length}</h5>
                            <p className="text-muted mb-0 small">Active Bugs</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-3 bg-light rounded">
                            <h5 className="text-success mb-1">{bugs.filter(bug => 
                              bug.test_case_id == selectedTestCase.id && 
                              (bug.status === 'RESOLVED' || bug.status === 'CLOSED')
                            ).length}</h5>
                            <p className="text-muted mb-0 small">Resolved Bugs</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Only View Bugs for Employee */}
                  <div className="row g-2 mb-3">
                    <div className="col-12">
                      <button 
                        className="btn btn-sm btn-outline-primary w-100"
                        onClick={() => {
                          // Set sub tab to show bugs for this test case
                          setSubSubTab(selectedTestCase.id);
                          setSubTab('bugs');
                          setIsClosing(true);
                          setTimeout(() => {
                            setShowTestCaseSidebar(false);
                            setIsClosing(false);
                          }, 300); // Match the animation duration
                        }}
                        disabled={selectedTestCase.status === 'PASSED'}
                      >
                        <i className="ri-bug-line me-1"></i>
                        View Bugs
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Modal Body */}
                <div className="modal-body p-4">
                  {/* Test Case Information Section */}
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="ri-task-line me-2"></i>
                        Test Case Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Test Case</p>
                        <p className="mb-0 fw-medium">TC{selectedTestCase.test_case_number}: {selectedTestCase.title}</p>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Description</p>
                        <p className="mb-0">{selectedTestCase.description || 'N/A'}</p>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Expected Result</p>
                        <p className="mb-0">{selectedTestCase.expected_result || 'N/A'}</p>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Actual Result</p>
                        <p className="mb-0">{selectedTestCase.actual_result && selectedTestCase.actual_result.trim() !== '' ? selectedTestCase.actual_result : 'N/A'}</p>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Tester</p>
                        <p className="mb-0">{selectedTestCase.tester_name || 'N/A'}</p>
                      </div>

                      <div className="row">
                        <div className="col-6 mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Status</p>
                          <span className={`badge ${
                            selectedTestCase.status === 'NOT_STARTED' ? 'bg-secondary' :
                            selectedTestCase.status === 'IN_TEST' ? 'bg-info' :
                            selectedTestCase.status === 'PASSED' ? 'bg-success' :
                            selectedTestCase.status === 'FAILED' ? 'bg-danger' : 'bg-warning'
                          }`}>
                            {selectedTestCase.status === 'NOT_STARTED' ? 'Not Started' :
                             selectedTestCase.status === 'IN_TEST' ? 'In Test' :
                             selectedTestCase.status === 'PASSED' ? 'Passed' :
                             selectedTestCase.status === 'FAILED' ? 'Failed' : 'Blocked'}
                          </span>
                        </div>
                        <div className="col-6 mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Created At</p>
                          <p className="mb-0">{new Date(selectedTestCase.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {selectedTestCase.completed_at && (
                        <div className="mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Completed At</p>
                          <p className="mb-0">{new Date(selectedTestCase.completed_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Bug Details Sidebar - Slide in from right */}
      {showBugSidebar && selectedBug && (
        <>
          {/* Light Backdrop - Semi-transparent */}
          <div 
            onClick={() => {
              setIsClosing(true);
              setTimeout(() => {
                setShowBugSidebar(false);
                setIsClosing(false);
              }, 300); // Match the animation duration
            }}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040,
              opacity: showBugSidebar ? 1 : 0,
              visibility: showBugSidebar ? 'visible' : 'hidden',
              transition: 'opacity 0.3s ease-in'
            }}
          ></div>
          
          {/* Sidebar Container - Fixed on right side */}
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
              animation: isClosing ? 'slideOutRight 0.3s ease-in' : (showBugSidebar ? 'slideInRight 0.3s ease-out' : 'none'),
              transform: 'translateX(0)',
              transition: 'none'
            }}
            tabIndex="-1"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBugSidebar(false);
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
                <div className="modal-header ">
                  <h5 className="modal-title mb-0">
                    <i className="ri-bug-line me-2"></i>
                    Bug Details
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => {
                      setIsClosing(true);
                      setTimeout(() => {
                        setShowBugSidebar(false);
                        setIsClosing(false);
                      }, 300); // Match the animation duration
                    }}
                    aria-label="Close"
                  ></button>
                </div>
{/*                 
                <div className="mt-4 p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Update Developer Status</label>
                    <div className="d-flex gap-2">
                      <select 
                        className="form-select"
                        value={selectedBugStatus}
                        onChange={(e) => {
                          setSelectedBugStatus(e.target.value);
                        }}
                        disabled={selectedBug.status === 'RESOLVED' || selectedBug.status === 'CLOSED'}
                      >
                        <option value="">Select Dev Status</option>
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="WORKING">Working</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="FIXED">Fixed</option>
                        <option value="TESTING">Testing</option>
                        <option value="REVIEW">Review</option>
                      </select>
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => {
                          // Update the developer status with the selected value
                          if (selectedBugStatus) {
                            updateBug(selectedBug.id, { developer_status: selectedBugStatus });
                            // Reset the status selection
                            setSelectedBugStatus('');
                          }
                        }}
                        disabled={!selectedBugStatus || selectedBug.status === 'RESOLVED' || selectedBug.status === 'CLOSED'}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    
                  </div>
                </div> */}
                
                {/* Modal Body */}
                <div className="modal-body p-4">
                  {/* Bug Information Section */}
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="ri-file-info-line me-2"></i>
                        Bug Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Title</p>
                        <p className="mb-0 fw-medium">{selectedBug.title}</p>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Description</p>
                        <p className="mb-0">{selectedBug.description || 'N/A'}</p>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Test Case</p>
                        <p className="mb-0">{selectedBug.test_case_number ? `TC${selectedBug.test_case_number}: ${selectedBug.test_case_title}` : 'N/A'}</p>
                      </div>

                      <div className="row">
                        <div className="col-6 mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Severity</p>
                          <span className={`badge ${
                            selectedBug.severity === 'LOW' ? 'bg-success' :
                            selectedBug.severity === 'MEDIUM' ? 'bg-warning' :
                            selectedBug.severity === 'HIGH' ? 'bg-danger' : 'bg-dark'
                          }`}>
                            {selectedBug.severity}
                          </span>
                        </div>
                        <div className="col-6 mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Priority</p>
                          <span className={`badge ${
                            selectedBug.priority === 'LOW' ? 'bg-success' :
                            selectedBug.priority === 'MEDIUM' ? 'bg-warning' :
                            selectedBug.priority === 'HIGH' ? 'bg-danger' : 'bg-dark'
                          }`}>
                            {selectedBug.priority}
                          </span>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-6 mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Status</p>
                          <span className={`badge ${
                            selectedBug.status === 'NEW' ? 'bg-secondary' :
                            selectedBug.status === 'CONFIRMED' ? 'bg-info' :
                            selectedBug.status === 'IN_PROGRESS' ? 'bg-warning' :
                            selectedBug.status === 'RESOLVED' ? 'bg-success' :
                            selectedBug.status === 'REOPENED' ? 'bg-danger' : 'bg-dark'
                          }`}>
                            {selectedBug.status}
                          </span>
                        </div>
                        <div className="col-6 mb-3">
                          <p className="text-muted mb-1 fs-12 text-uppercase">Reported By</p>
                          <p className="mb-0">{selectedBug.reported_by_name}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Reported At</p>
                        <p className="mb-0">{new Date(selectedBug.created_at).toLocaleDateString()}</p>
                      </div>

                      <div className="mb-3">
                        <p className="text-muted mb-1 fs-12 text-uppercase">Developer Status</p>
                        <span className={`badge ${
                          !selectedBug.developer_status ? 'bg-secondary' :
                          selectedBug.developer_status === 'NOT_STARTED' ? 'bg-secondary' :
                          selectedBug.developer_status === 'WORKING' ? 'bg-info' :
                          selectedBug.developer_status === 'ON_HOLD' ? 'bg-warning' :
                          selectedBug.developer_status === 'FIXED' ? 'bg-success' :
                          selectedBug.developer_status === 'TESTING' ? 'bg-primary' : 'bg-dark'
                        }`}>
                          {selectedBug.developer_status || 'pending'}
                        </span>
                      </div>

                      <button 
                      className="btn btn-sm btn-outline-primary  mb-2"
                      onClick={async () => {
                        // Fetch attachments for this specific bug and show in modal
                        try {
                          const response = await axios.get(
                            buildApiUrl(`/tasks/${taskId}/bugs/${selectedBug.id}/attachments`),
                            { headers: getAuthHeaders() }
                          );
                          
                          if (response.data.success) {
                            setCurrentBugAttachments(response.data.data);
                            setCurrentBugForAttachments(selectedBug);
                            setShowBugAttachmentsModal(true);
                          } else {
                            toast.error(response.data.message || 'Failed to fetch bug attachments');
                          }
                        } catch (error) {
                          console.error('Error fetching bug attachments:', error);
                          if (error.response) {
                            toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
                          } else {
                            toast.error('Network error: Failed to fetch bug attachments');
                          }
                        }
                      }}
                    >
                      <i className="ri-attachment-line me-1"></i>
                      View Attachments
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Test Case Modal */}
      {showTestCaseModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Test Case</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowTestCaseModal(false);
                  setTestCaseForm({
                    name: '',
                    description: '',
                    expectedResult: '',
                    status: 'Pending'
                  });
                  setTestCaseFile(null);
                }}></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                createTestCase({
                  ...testCaseForm,
                  attachment: testCaseFile
                });
              }}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={testCaseForm.name}
                      onChange={(e) => setTestCaseForm({...testCaseForm, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={testCaseForm.description}
                      onChange={(e) => setTestCaseForm({...testCaseForm, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Expected Result</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={testCaseForm.expectedResult}
                      onChange={(e) => setTestCaseForm({...testCaseForm, expectedResult: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={testCaseForm.status}
                      onChange={(e) => setTestCaseForm({...testCaseForm, status: e.target.value})}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Test">In Test</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Attachment</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setTestCaseFile(e.target.files[0])}
                      ref={testCaseFileInputRef}
                    />
                    {testCaseFile && (
                      <div className="mt-2">
                        <small className="text-muted">Selected: {testCaseFile.name}</small>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-danger ms-2"
                          onClick={() => {
                            setTestCaseFile(null);
                            testCaseFileInputRef.current.value = '';
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowTestCaseModal(false);
                    setTestCaseForm({
                      name: '',
                      description: '',
                      expectedResult: '',
                      status: 'Pending'
                    });
                    setTestCaseFile(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Test Case
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Case Modal */}
      {showEditTestCaseModal && selectedTestCase && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Test Case</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowEditTestCaseModal(false);
                  setSelectedTestCase(null);
                }}></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                updateTestCase(selectedTestCase.id, {
                  ...testCaseForm,
                  attachment: testCaseFile
                });
              }}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={testCaseForm.name}
                      onChange={(e) => setTestCaseForm({...testCaseForm, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={testCaseForm.description}
                      onChange={(e) => setTestCaseForm({...testCaseForm, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Expected Result</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={testCaseForm.expectedResult}
                      onChange={(e) => setTestCaseForm({...testCaseForm, expectedResult: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={testCaseForm.status}
                      onChange={(e) => setTestCaseForm({...testCaseForm, status: e.target.value})}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Test">In Test</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Attachment</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setTestCaseFile(e.target.files[0])}
                      ref={testCaseFileInputRef}
                    />
                    {testCaseFile && (
                      <div className="mt-2">
                        <small className="text-muted">Selected: {testCaseFile.name}</small>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-danger ms-2"
                          onClick={() => {
                            setTestCaseFile(null);
                            testCaseFileInputRef.current.value = '';
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowEditTestCaseModal(false);
                    setSelectedTestCase(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Test Case
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Bug Modal */}
      {showBugModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Report Bug</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowBugModal(false);
                  setBugForm({
                    title: '',
                    description: '',
                    severity: 'Medium',
                    status: 'Open',
                    developerStatus: 'Open'
                  });
                  setBugFile(null);
                }}></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                createBug({
                  ...bugForm,
                  attachment: bugFile
                });
              }}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bugForm.title}
                      onChange={(e) => setBugForm({...bugForm, title: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={bugForm.description}
                      onChange={(e) => setBugForm({...bugForm, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Severity *</label>
                        <select
                          className="form-select"
                          value={bugForm.severity}
                          onChange={(e) => setBugForm({...bugForm, severity: e.target.value})}
                          required
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={bugForm.status}
                          onChange={(e) => setBugForm({...bugForm, status: e.target.value})}
                        >
                          <option value="Open">Open</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Attachment</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setBugFile(e.target.files[0])}
                      ref={bugFileInputRef}
                    />
                    {bugFile && (
                      <div className="mt-2">
                        <small className="text-muted">Selected: {bugFile.name}</small>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-danger ms-2"
                          onClick={() => {
                            setBugFile(null);
                            bugFileInputRef.current.value = '';
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowBugModal(false);
                    setBugForm({
                      title: '',
                      description: '',
                      severity: 'Medium',
                      status: 'Open',
                      developerStatus: 'Open'
                    });
                    setBugFile(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger">
                    Report Bug
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Bug Attachments Modal */}
      {showBugAttachmentsModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Attachments for {currentBugForAttachments ? `Bug #${currentBugForAttachments.id}: ${currentBugForAttachments.title}` : 'Bug'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowBugAttachmentsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>File Name</th>
                        <th>Size</th>
                        <th>Type</th>
                        <th>Uploaded By</th>
                        <th>Uploaded At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBugAttachments && currentBugAttachments.length > 0 ? (
                        currentBugAttachments.map(attachment => (
                          <tr key={attachment.id}>
                            <td>
                              <i className={`ri-file-${getFileIcon(attachment.file_type)}-line me-2`}></i>
                              {attachment.file_name}
                            </td>
                            <td>{formatFileSize(attachment.file_size)}</td>
                            <td>{attachment.file_type}</td>
                            <td>{attachment.uploaded_by_name}</td>
                            <td>{new Date(attachment.uploaded_at).toLocaleDateString()}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-primary me-1"
                                onClick={() => {
                                  // Close other modals first
                                  closeAllModals();
                                  // View attachment
                                  // Fix the file path by extracting the relative path after 'uploads'
                                  let filePath = attachment.file_path;
                                  
                                  // Handle different types of file paths
                                  if (filePath.startsWith('file://') || filePath.includes('C:') || filePath.includes('D:')) {
                                    // If it's a local file path, extract the relative path after 'uploads'
                                    const pathParts = filePath.split(/uploads\\|uploads\//);
                                    if (pathParts.length > 1) {
                                      filePath = '/uploads/' + pathParts[1];
                                    }
                                  } else if (filePath.includes('Task Manager/server/uploads')) {
                                    // Extract the relative path after 'Task Manager/server/uploads'
                                    const pathParts = filePath.split('Task Manager/server/uploads');
                                    if (pathParts.length > 1) {
                                      filePath = '/uploads' + pathParts[1];
                                    }
                                  } else if (!filePath.startsWith('/')) {
                                    // If it's already a relative path but doesn't start with /, add it
                                    filePath = '/' + filePath;
                                  }
                                  
                                  setModalContent({
                                    type: attachment.file_type,
                                    url: `${process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com'}${filePath}`,
                                    name: attachment.file_name
                                  });
                                  setShowModal(true);
                                }}
                              >
                                <i className="ri-eye-line"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-secondary me-1"
                                onClick={() => openAttachment(attachment)}
                              >
                                <i className="ri-download-line"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this attachment?')) {
                                    deleteAttachment(attachment.id, attachment.file_name, true, taskId, currentBugForAttachments.id);
                                    // Close the modal after deletion
                                    setShowBugAttachmentsModal(false);
                                  }
                                }}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center text-muted py-4">
                            No attachments found for this bug.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowBugAttachmentsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default TaskReviewDetailsPage;