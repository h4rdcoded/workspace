import React, { useState, useEffect, useContext, useRef } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useParams, useNavigate } from 'react-router-dom';

const MyTaskUpdatePage = () => {
  // Add CSS animation for sidebar
  const addSidebarAnimation = () => {
    const styleId = 'sidebar-animation-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
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
      `;
      document.head.appendChild(style);
    }
  };
  
  // Call this function to add animations to the page
  addSidebarAnimation();
  
  const { leadCrmUser } = useContext(ConfigContext);
  const { taskId } = useParams();
  const actualTaskId = taskId; // Use taskId for Team Leader's page
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('UPDATE');
  const [attachments, setAttachments] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [modalNotes, setModalNotes] = useState('');
  const [modalFiles, setModalFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('details'); // details, comments, attachments

  const [showAddCommentModal, setShowAddCommentModal] = useState(false);
  // New states for logs functionality
  const [logs, setLogs] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logData, setLogData] = useState({
    work_done: '',
    file_location: '',
    changes_made: '',
    challenges: '',
    time_spent: ''
  });
  const [logLoading, setLogLoading] = useState(false);
  // Pagination states for logs
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(5);
  // Pagination states for comments
  const [currentCommentPage, setCurrentCommentPage] = useState(1);
  const [commentsPerPage] = useState(5);
  // Loading state for task submission
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  
  // Loading state for starting task
  const [isStartingTask, setIsStartingTask] = useState(false);
  // New states for attachment upload functionality
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [fileNames, setFileNames] = useState({});
  
  // New states for test cases, bugs, and attachments functionality
  const [testCases, setTestCases] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [bugAttachments, setBugAttachments] = useState({}); // Store attachments by bug ID
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [error, setError] = useState(null);
  
  // States for test case sub-tabs
  const [subTab, setSubTab] = useState('test-cases'); // For test case sub-tabs
  const [subSubTab, setSubSubTab] = useState(null); // For bug sub-sub-tabs
  
  // States for bug attachments pagination
  const [bugsPerPage] = useState(10);
  const [currentBugPage, setCurrentBugPage] = useState(1);
  
  // States for modals and sidebars
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'test-case', 'bug', or 'test-case-action'
  const [newTestCase, setNewTestCase] = useState({
    test_case_number: '',
    title: '',
    description: '',
    expected_result: ''
  });
  const [newBug, setNewBug] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    priority: 'MEDIUM',
    test_case_id: '',
    attachments: []
  });
  const [currentTestCase, setCurrentTestCase] = useState(null); // Current test case for actions
  const [testCaseAction, setTestCaseAction] = useState(''); // Action to perform on test case
  const [testCaseNotes, setTestCaseNotes] = useState(''); // Notes for test case action
  
  // State for bug attachments
  const [selectedBugAttachments, setSelectedBugAttachments] = useState([]); // Store selected attachments for bug reporting
  const [showAttachmentModal, setShowAttachmentModal] = useState(false); // For viewing attachments
  const [attachmentToView, setAttachmentToView] = useState(null); // Current attachment to view
  
  // State for bug attachment uploads
  const [bugAttachmentFiles, setBugAttachmentFiles] = useState([]); // Files to upload to bug
  
  // State for bug attachments modal
  const [showBugAttachmentsModal, setShowBugAttachmentsModal] = useState(false); // For bug attachments modal
  const [currentBugAttachments, setCurrentBugAttachments] = useState([]); // Current bug attachments to display
  const [currentBugForAttachments, setCurrentBugForAttachments] = useState(null); // Current bug for attachments modal
  
  // States for bug and test case details modals
  const [currentBug, setCurrentBug] = useState(null); // For bug details modal
  const [currentTestCaseDetails, setCurrentTestCaseDetails] = useState(null); // For test case details modal
  
  // States for sidebars
  const [showTestCaseSidebar, setShowTestCaseSidebar] = useState(false); // For test case sidebar
  const [isClosing, setIsClosing] = useState(false); // For test case sidebar closing animation
  const [selectedTestCase, setSelectedTestCase] = useState(null); // For selected test case in sidebar
  const [showBugSidebar, setShowBugSidebar] = useState(false); // For bug sidebar
  const [selectedBug, setSelectedBug] = useState(null); // For selected bug in sidebar
  const [selectedBugStatus, setSelectedBugStatus] = useState(''); // For selected bug status in sidebar
  
  // State for bug attachment input ref
  const bugAttachmentInputRef = useRef(null);
  
  // Additional states for missing functionality
  const [showTestModal, setShowTestModal] = useState(false);
  const [taskInProgress, setTaskInProgressState] = useState(false);
    
  // Missing state variables for test case functionality
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [testCaseForm, setTestCaseForm] = useState({
    name: '',
    description: '',
    expectedResult: '',
    status: 'Pending'
  });
  const [testCaseFile, setTestCaseFile] = useState(null);
    
  const [showEditTestCaseModal, setShowEditTestCaseModal] = useState(false);
    
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    status: 'Open',
    developerStatus: 'Open'
  });
  const [bugFile, setBugFile] = useState(null);
    
  const [bugAttachmentsList, setBugAttachmentsList] = useState([]);
  
  // Pagination states for attachments
  const [currentAttachmentPage, setCurrentAttachmentPage] = useState(1);
  const [attachmentsPerPage] = useState(10);
  
  // Refs
  const fileInputRef = useRef(null);
  const testCaseFileInputRef = useRef(null);
  const bugFileInputRef = useRef(null);

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

  // Handle file selection for attachment upload
  const handleUploadFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(files);
    
    // Initialize custom filenames with original filenames
    const initialFileNames = {};
    files.forEach((file, index) => {
      initialFileNames[index] = file.name;
    });
    setFileNames(initialFileNames);
  };

  // Handle custom filename change
  const handleFileNameChange = (index, name) => {
    setFileNames(prev => ({
      ...prev,
      [index]: name
    }));
  };

  // Handle attachment upload
  const handleUploadAttachments = async (e) => {
    e.preventDefault();
    
    if (uploadFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    try {
      // Upload each file individually since the server only accepts one file per request
      const uploadPromises = [];
      
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const customName = fileNames[i] || file.name;
        
        // Append today's date to the filename to avoid conflicts
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        const nameWithoutExt = customName.substring(0, customName.lastIndexOf('.')) || customName;
        const ext = customName.substring(customName.lastIndexOf('.'));
        const finalName = ext ? `${nameWithoutExt}_${dateStr}${ext}` : `${customName}_${dateStr}`;
        
        // Create a new File object with the modified name
        const renamedFile = new File([file], finalName, { type: file.type });
        
        // Create FormData for this file
        const formData = new FormData();
        formData.append('attachment', renamedFile);
        
        // Create upload promise
        const uploadPromise = axios.post(
          buildApiUrl(`/tasks/${taskId}/attachments`),
          formData,
          {
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        uploadPromises.push(uploadPromise);
      }
      
      // Wait for all uploads to complete
      const responses = await Promise.all(uploadPromises);
      
      // Check if all uploads were successful
      const allSuccessful = responses.every(response => response.data.success);
      
      if (allSuccessful) {
        toast.success(`${uploadFiles.length} attachment(s) uploaded successfully`);
        setShowUploadModal(false);
        setUploadFiles([]);
        setFileNames({});
        fetchTaskAttachments(); // Refresh attachments list
      } else {
        toast.error('Some attachments failed to upload. Please try again.');
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to upload attachments'}`);
      } else {
        toast.error('Network error: Failed to upload attachments');
      }
    }
  };

  // Helper function to determine if a subtask was taken for self
  const isSelfTakenSubtask = (task) => {
    if (!task || !leadCrmUser) return false;
    
    // A task is a subtask if it has a parent_task_id
    const isSubtask = !!task.parent_task_id;
    
    // If it's not a subtask, it can't be a self-taken subtask
    if (!isSubtask) return false;
    
    // A subtask is considered "self-taken" if:
    // 1. The current user is the assignee
    // 2. The current user is also the creator (they created it for themselves)
    const isCurrentUserTheAssignee = task.assigned_to === leadCrmUser.id;
    const isCurrentUserTheCreator = task.created_by === leadCrmUser.id;
    
    // Primary condition: Self-created and self-assigned subtask
    const isSelfCreatedAndAssigned = isCurrentUserTheCreator && isCurrentUserTheAssignee;
    
    // Alternative condition: Team leader assigned subtask to themselves
    // This happens when assigned_to_team_leader equals assigned_to and both equal current user
    const isTeamLeaderSelfAssigned = task.assigned_to_team_leader && 
                                    task.assigned_to_team_leader === task.assigned_to && 
                                    task.assigned_to === leadCrmUser.id;
    
    const result = isSelfCreatedAndAssigned || isTeamLeaderSelfAssigned;
    
    // Debug logging to understand the task structure
    console.log('Subtask analysis:', {
      task_id: task.id,
      parent_task_id: task.parent_task_id,
      assigned_to: task.assigned_to,
      created_by: task.created_by,
      assigned_to_team_leader: task.assigned_to_team_leader,
      leadCrmUser_id: leadCrmUser.id,
      isSubtask,
      isCurrentUserTheAssignee,
      isCurrentUserTheCreator,
      isSelfCreatedAndAssigned,
      isTeamLeaderSelfAssigned,
      result
    });
    
    return result;
  };

  // Helper function to determine if a main task was taken for self
  const isSelfAssignedMainTask = (task) => {
    if (!task || !leadCrmUser) return false;
    // A main task is one that does NOT have a parent_task_id
    const isMainTask = !task.parent_task_id;
    return isMainTask && task.assigned_to === leadCrmUser.id;
  };

  // Helper function to determine if a subtask was assigned by someone else
  const isAssignedSubtask = (task) => {
    if (!task || !leadCrmUser) return false;
    
    // A task is a subtask if it has a parent_task_id
    const isSubtask = !!task.parent_task_id;
    
    // If it's not a subtask, it can't be an assigned subtask
    if (!isSubtask) return false;
    
    // The current user must be the assignee
    const isCurrentUserTheAssignee = task.assigned_to === leadCrmUser.id;
    
    // If the current user is not the assignee, it's not an assigned subtask for them
    if (!isCurrentUserTheAssignee) return false;
    
    // The subtask was assigned by someone else if:
    // 1. The creator is different from the assignee, OR
    // 2. There's an assigned_to_team_leader that is different from the assignee
    const isAssignedByOtherCreator = task.created_by && task.created_by !== task.assigned_to;
    const isAssignedByOtherTeamLeader = task.assigned_to_team_leader && 
                                      task.assigned_to_team_leader !== task.assigned_to;
    
    const result = isAssignedByOtherCreator || isAssignedByOtherTeamLeader;
    
    // Debug logging for assigned subtasks
    console.log('Assigned subtask analysis:', {
      task_id: task.id,
      parent_task_id: task.parent_task_id,
      assigned_to: task.assigned_to,
      created_by: task.created_by,
      assigned_to_team_leader: task.assigned_to_team_leader,
      leadCrmUser_id: leadCrmUser.id,
      isSubtask,
      isCurrentUserTheAssignee,
      isAssignedByOtherCreator,
      isAssignedByOtherTeamLeader,
      result
    });
    
    return result;
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
    // Set attachment to view and show the attachment modal
    setAttachmentToView(attachment);
    setShowAttachmentModal(true);
  };

  // Handle file selection for submit modal
  const handleModalFileChange = (e) => {
    const files = Array.from(e.target.files);
    setModalFiles(files);
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

  // Fetch task comments
  const fetchTaskComments = async () => {
    try {
      const response = await axios.get(
        buildApiUrl(`/tasks/${taskId}/comments`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        // Sort comments by created_at in descending order (newest first)
        const sortedComments = (response.data.data.comments || []).sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setComments(sortedComments);
        setCurrentCommentPage(1); // Reset to first page when comments are fetched
      }
    } catch (error) {
      
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
      
    }
  };

  // Fetch task logs
  const fetchTaskLogs = async () => {
    try {
      const response = await axios.get(
        buildApiUrl(`/tasks/${taskId}/logs`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setLogs(response.data.data.logs);
        setCurrentPage(1); // Reset to first page when logs are fetched
      }
    } catch (error) {
      
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

  // Fetch all bug attachments for the task
  const fetchAllBugAttachments = async () => {
    try {
      setError(null);
      
      // Fetch all bugs first to know which bug attachments to fetch
      const bugsResponse = await axios.get(
        buildApiUrl(`/tasks/${taskId}/bugs`),
        { headers: getAuthHeaders() }
      );
      
      if (bugsResponse.data.success) {
        const allBugs = bugsResponse.data.data;
        
        // For each bug, fetch its attachments
        const attachmentPromises = allBugs.map(async (bug) => {
          try {
            const response = await axios.get(
              buildApiUrl(`/tasks/${taskId}/bugs/${bug.id}/attachments`),
              { headers: getAuthHeaders() }
            );
            
            if (response.data.success) {
              return { bugId: bug.id, attachments: response.data.data };
            } else {
              console.error(`Failed to fetch attachments for bug ${bug.id}:`, response.data.message);
              return { bugId: bug.id, attachments: [] };
            }
          } catch (error) {
            console.error(`Error fetching attachments for bug ${bug.id}:`, error);
            return { bugId: bug.id, attachments: [] };
          }
        });
        
        const attachmentsResults = await Promise.all(attachmentPromises);
        
        // Update bugAttachments state with all fetched attachments
        const newBugAttachments = {};
        attachmentsResults.forEach(result => {
          newBugAttachments[result.bugId] = result.attachments;
        });
        
        setBugAttachments(newBugAttachments);
      } else {
        toast.error(bugsResponse.data.message || 'Failed to fetch bugs for attachments');
        setBugAttachments({});
      }
    } catch (error) {
      console.error('Error fetching all bug attachments:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to fetch all bug attachments');
      }
      setError(error);
      setBugAttachments({});
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

  // // Update bug status (only developer status for employees/team leaders)
  const updateBugStatus = async (bugId, status) => {
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

  // Upload bug attachment
  const uploadBugAttachment = async (bugId, file) => {
    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const response = await axios.post(
        buildApiUrl(`/bugs/${bugId}/attachments`),
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Attachment uploaded successfully');
        fetchBugAttachments(); // Refresh bug attachments
        return response.data.data.attachment;
      } else {
        toast.error(`Failed to upload attachment: ${response.data.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to upload attachment'}`);
      } else {
        toast.error('Network error: Failed to upload attachment');
      }
      return null;
    }
  };

  // Delete bug attachment
  const deleteBugAttachment = async (attachmentId) => {
    try {
      const response = await axios.delete(
        buildApiUrl(`/bug-attachments/${attachmentId}`),
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Attachment deleted successfully');
        fetchBugAttachments(); // Refresh bug attachments
      } else {
        toast.error(`Failed to delete attachment: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to delete attachment'}`);
      } else {
        toast.error('Network error: Failed to delete attachment');
      }
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

  // Function to close all modals
  const closeAllModals = () => {
    setShowCreateModal(false);
    setShowTestCaseSidebar(false);
    setShowBugSidebar(false);
    setShowAttachmentModal(false);
    setShowBugAttachmentsModal(false);
    setShowTestModal(false);
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
        // Refresh appropriate data
        if (isBugAttachment) {
          // Refresh bug attachments
          fetchAllBugAttachments();
        } else {
          fetchTaskAttachments(); // Refresh regular attachments
        }
        return true;
      } else {
        toast.error(response.data.message || 'Failed to delete attachment');
        return false;
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to delete attachment');
      }
      return false;
    }
  };
  
  
  // Function to reset attachment page
  const resetAttachmentPage = () => {
    setCurrentAttachmentPage(1);
  };
  
  // Function to get current attachments for pagination
  const getCurrentAttachments = (allAttachments = attachments) => {
    const indexOfLastAttachment = currentAttachmentPage * attachmentsPerPage;
    const indexOfFirstAttachment = indexOfLastAttachment - attachmentsPerPage;
    return allAttachments.slice(indexOfFirstAttachment, indexOfLastAttachment);
  };
  
  // Function to go to previous attachment page
  const prevAttachmentPage = () => {
    if (currentAttachmentPage > 1) {
      setCurrentAttachmentPage(currentAttachmentPage - 1);
    }
  };
  
  // Function to go to next attachment page
  const nextAttachmentPage = (totalAttachmentsLength = attachments.length) => {
    const totalPages = Math.ceil(totalAttachmentsLength / attachmentsPerPage);
    if (currentAttachmentPage < totalPages) {
      setCurrentAttachmentPage(currentAttachmentPage + 1);
    }
  };
    
  // Function to paginate attachments
  const paginateAttachments = (pageNumber) => setCurrentAttachmentPage(pageNumber);
    
  // Function to set task status to IN_PROGRESS
  const setTaskInProgress = async () => {
    if (!window.confirm('Are you sure you want to set this task back to In Progress?')) {
      return;
    }
      
    try {
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/status`),
        { 
          status: 'IN_PROGRESS',
          completion_notes: 'Task set back to in progress by team leader'
        },
        { headers: getAuthHeaders() }
      );
  
      if (response.data.success) {
        toast.success('Task status updated to In Progress successfully');
        fetchTaskDetails(); // Refresh task details
      } else {
        toast.error(response.data.message || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
        
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to update task status'}`);
      } else {
        toast.error('Network error: Failed to update task status');
      }
    }
  };
  
 
  // Function to update a bug
  const updateBug = async (bugId, updateData) => {
    try {
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/bugs/${bugId}`),
        updateData,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || 'Bug updated successfully');
        fetchTaskBugs(); // Refresh the bugs list
        fetchTaskTestCases(); // Also refresh test cases since bug status might affect test case status
        return true;
      } else {
        toast.error(response.data.message || 'Failed to update bug');
        return false;
      }
    } catch (error) {
      console.error('Error updating bug:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to update bug');
      }
      return false;
    }
  };
  
  // Function to upload attachments to a specific bug
  const uploadBugAttachments = async (bugId, files) => {
    if (!files || files.length === 0) {
      toast.error('No files selected for upload');
      return false;
    }
    
    try {
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        
        return axios.post(
          buildApiUrl(`/tasks/${taskId}/bugs/${bugId}/attachments`),
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
      
      if (allSuccessful) {
        toast.success('Attachments uploaded successfully');
        // Refresh the bug attachments
        if (showBugAttachmentsModal && currentBugForAttachments && currentBugForAttachments.id == bugId) {
          // If we're currently viewing this bug's attachments, refresh them
          const response = await axios.get(
            buildApiUrl(`/tasks/${taskId}/bugs/${bugId}/attachments`),
            { headers: getAuthHeaders() }
          );
          
          if (response.data.success) {
            setCurrentBugAttachments(response.data.data);
          }
        }
        // Also refresh all bug attachments if we're in the attachments tab
        if (subTab === 'attachments') {
          fetchAllBugAttachments();
        }
        return true;
      } else {
        toast.error('Some attachments failed to upload');
        return false;
      }
    } catch (error) {
      console.error('Error uploading bug attachments:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to upload bug attachments');
      }
      return false;
    }
  };
  
  // Function to fetch bug attachments
  const fetchBugAttachments = async (bugId) => {
    try {
      setError(null);
      
      const response = await axios.get(
        buildApiUrl(`/tasks/${taskId}/bugs/${bugId}/attachments`),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        // Update the bugAttachments state for this specific bug
        setBugAttachments(prev => ({
          ...prev,
          [bugId]: response.data.data
        }));
      } else {
        toast.error(response.data.message || 'Failed to fetch bug attachments');
        // Set empty array for this bug
        setBugAttachments(prev => ({
          ...prev,
          [bugId]: []
        }));
      }
    } catch (error) {
      console.error('Error fetching bug attachments:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to fetch bug attachments');
      }
      setError(error);
      // Set empty array for this bug
      setBugAttachments(prev => ({
        ...prev,
        [bugId]: []
      }));
    }
  };
  
  // Function to get attachment URL
  const getAttachmentUrl = (attachment) => {
    const baseUrl = process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
    // Fix the URL by removing the local file system path and keeping only the relative path
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
      
    return fullUrl;
  };
      
    
  // Function to create a new test case
  // const createTestCase = async (testCaseData) => {
  //   try {
  //     const response = await axios.post(
  //       buildApiUrl(`/tasks/${taskId}/test-cases`),
  //       testCaseData,
  //       { headers: getAuthHeaders() }
  //     );
        
  //     if (response.data.success) {
  //       toast.success(response.data.message || 'Test case created successfully');
  //       fetchTaskTestCases(); // Refresh the test cases list
  //       return true;
  //     } else {
  //       toast.error(response.data.message || 'Failed to create test case');
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error('Error creating test case:', error);
  //     if (error.response) {
  //       toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
  //     } else {
  //       toast.error('Network error: Failed to create test case');
  //     }
  //     return false;
  //   }
  // };
    
  // // Function to update a test case
  // const updateTestCase = async (testCaseId, updateData) => {
  //   try {
  //     const response = await axios.put(
  //       buildApiUrl(`/tasks/${taskId}/test-cases/${testCaseId}`),
  //       updateData,
  //       { headers: getAuthHeaders() }
  //     );
        
  //     if (response.data.success) {
  //       toast.success(response.data.message || 'Test case updated successfully');
  //       fetchTaskTestCases(); // Refresh the test cases list
  //       return true;
  //     } else {
  //       toast.error(response.data.message || 'Failed to update test case');
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error('Error updating test case:', error);
  //     if (error.response) {
  //       toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
  //     } else {
  //       toast.error('Network error: Failed to update test case');
  //     }
  //     return false;
  //   }
  // };
    
  // // Function to create a new bug
  // const createBug = async (bugData) => {
  //   try {
  //     const response = await axios.post(
  //       buildApiUrl(`/tasks/${taskId}/bugs`),
  //       bugData,
  //       { headers: getAuthHeaders() }
  //     );
        
  //     if (response.data.success) {
  //       toast.success(response.data.message || 'Bug created successfully');
  //       fetchTaskBugs(); // Refresh the bugs list
  //       return true;
  //     } else {
  //       toast.error(response.data.message || 'Failed to create bug');
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error('Error creating bug:', error);
  //     if (error.response) {
  //       toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
  //     } else {
  //       toast.error('Network error: Failed to create bug');
  //     }
  //     return false;
  //   }
  // };
    
  // // Function to update a bug status
  // const updateBugStatus = async (bugId, updateData) => {
  //   try {
  //     const response = await axios.put(
  //       buildApiUrl(`/tasks/${taskId}/bugs/${bugId}`),
  //       updateData,
  //       { headers: getAuthHeaders() }
  //     );
        
  //     if (response.data.success) {
  //       toast.success(response.data.message || 'Bug updated successfully');
  //       fetchTaskBugs(); // Refresh the bugs list
  //       return true;
  //     } else {
  //       toast.error(response.data.message || 'Failed to update bug');
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error('Error updating bug:', error);
  //     if (error.response) {
  //       toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
  //     } else {
  //       toast.error('Network error: Failed to update bug');
  //     }
  //     return false;
  //   }
  // };
    
  // Function to render bugs table
  // const renderBugsTable = (bugsToRender) => {
  //   return (
  //     <div className="table-responsive">
  //       <table className="table table-hover">
  //         <thead className="table-light">
  //           <tr>
  //             <th>Title</th>
  //             {/* <th>Description</th> */}
  //             <th>Severity</th>
  //             <th>Status</th>
  //             <th>Dev Status</th>
  //             <th>Reported By</th>
  //             <th>Created At</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {bugsToRender.map((bug) => (
  //             <tr key={bug.id} className="cursor-pointer" onClick={() => {
  //               setSelectedBug(bug);
  //               setShowBugSidebar(true);
  //             }}>
  //               <td>{bug.title}</td>
  //               {/* <td>{bug.description}</td> */}
  //               <td>
  //                 <span className={`badge ${
  //                   bug.severity === 'CRITICAL' ? 'bg-danger' :
  //                   bug.severity === 'HIGH' ? 'bg-warning' :
  //                   bug.severity === 'MEDIUM' ? 'bg-info' : 'bg-secondary'
  //                 }`}>
  //                   {bug.severity}
  //                 </span>
  //               </td>
  //               <td>
  //                 <span className={`badge ${
  //                   bug.status === 'NEW' ? 'bg-secondary' :
  //                   bug.status === 'CONFIRMED' ? 'bg-info' :
  //                   bug.status === 'IN_PROGRESS' ? 'bg-warning' :
  //                   bug.status === 'RESOLVED' ? 'bg-success' :
  //                   bug.status === 'REOPENED' ? 'bg-danger' : 'bg-dark'
  //                 }`}>
  //                   {bug.status}
  //                 </span>
  //               </td>
  //               <td>
  //                 <span className={`badge ${
  //                   !bug.developer_status ? 'bg-secondary' :
  //                   bug.developer_status === 'NOT_STARTED' ? 'bg-secondary' :
  //                   bug.developer_status === 'WORKING' ? 'bg-info' :
  //                   bug.developer_status === 'ON_HOLD' ? 'bg-warning' :
  //                   bug.developer_status === 'FIXED' ? 'bg-success' :
  //                   bug.developer_status === 'TESTING' ? 'bg-primary' : 'bg-dark'
  //                 }`}>
  //                   {bug.developer_status || 'pending'}
  //                 </span>
  //               </td>
  //               <td>{bug.reported_by_name}</td>
  //               <td>{bug.created_at ? new Date(bug.created_at).toLocaleDateString() : 'N/A'}</td>
  //             </tr>
  //           ))}
  //         </tbody>
  //       </table>
  //     </div>
  //   );
  // };
    
  
  // Handle adding a log
  const handleAddLog = async (e) => {
    e.preventDefault();
    
    try {
      setLogLoading(true);
      const payload = {
        ...logData,
        task_id: taskId
      };

      const response = await axios.post(
        buildApiUrl(`/tasks/logs`),
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Log added successfully');
        setLogData({
          work_done: '',
          file_location: '',
          changes_made: '',
          challenges: '',
          time_spent: ''
        });
        setShowLogModal(false);
        fetchTaskLogs(); // Refresh logs
      } else {
        toast.error(`Failed to add log: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to add log'}`);
      } else {
        toast.error('Network error: Failed to add log');
      }
    } finally {
      setLogLoading(false);
    }
  };

  // Handle task submission
  const handleSubmitTask = async () => {
    try {
      setIsSubmittingTask(true); // Set loading state to true
      
      // Check if daily logs are written for ALL tasks (both main tasks and subtasks)
      if (logs.length === 0) {
        toast.error('You had not written any daily logs');
        return;
      }

      // First check if all subtasks are completed (for parent tasks)
      if (!task.parent_task_id) {
        // This is a parent task, check if all subtasks are completed
        const subtasksResponse = await axios.get(
          buildApiUrl(`/tasks/${taskId}/subtasks`),
          { headers: getAuthHeaders() }
        );
        
        if (subtasksResponse.data.success) {
          const subtasks = subtasksResponse.data.data.subtasks || [];
          const incompleteSubtasks = subtasks.filter(subtask => 
            subtask.status !== 'COMPLETED' && subtask.status !== 'CANCELLED'
          );
          
          if (incompleteSubtasks.length > 0) {
            toast.error(`Cannot submit to admin. ${incompleteSubtasks.length} subtasks are not completed.`);
            return;
          }
        }
      }
      
      // First upload attachments if any
      if (modalFiles.length > 0) {
        const formData = new FormData();
        
        for (let i = 0; i < modalFiles.length; i++) {
          formData.append('attachment', modalFiles[i]);
        }
        
        try {
          await axios.post(
            buildApiUrl(`/tasks/${taskId}/attachments`),
            formData,
            {
              headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          toast.success('Attachments uploaded successfully');
        } catch (uploadError) {
          
          toast.error('Failed to upload attachments');
          return; // Don't proceed with submission if attachment upload fails
        }
      }
      
      // Determine the status based on task type and assignment
      // For subtasks taken for self by the team leader, mark as COMPLETED directly
      // For main tasks or subtasks assigned by others, submit for review
      const selfTakenSubtask = isSelfTakenSubtask(task);
      const assignedSubtask = isAssignedSubtask(task);
      const selfAssignedMainTask = isSelfAssignedMainTask(task);
      
      // Debug logging to understand which condition is being met
      console.log('Task submission logic:', {
        selfTakenSubtask,
        assignedSubtask,
        selfAssignedMainTask,
        taskType: task.task_type,
        isSubtask: task.is_subtask,
        parentId: task.parent_task_id,
        assignedTo: task.assigned_to,
        assignedToTeamLeader: task.assigned_to_team_leader,
        createdBy: task.created_by,
        currentUser: leadCrmUser.id
      });
      
      let status;
      if (selfTakenSubtask) {
        // Subtasks taken for self by the team leader should be automatically completed
        // This covers the case where the TL created the subtask and assigned it to themselves
        status = 'SUBMITTED';
      } else if (assignedSubtask) {
        // Subtasks assigned by others should go through review process
        status = 'SUBMITTED';
      } else if (selfAssignedMainTask) {
        // Main tasks taken for self should be submitted for admin review
        status = 'SUBMITTED';
      } else {
        // Default case - submit for review
        // This would be for subtasks assigned by others or edge cases
        status = 'SUBMITTED';
      }
      
      // Ensure completion_notes is never empty to pass backend validation
      const completionNotes = modalNotes.trim() || 'Task completed';
      
      const payload = {
        status: status,
        completion_notes: completionNotes
      };

      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/status`),
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        let successMessage;
        if (selfTakenSubtask) {
          successMessage = 'Subtask submitted for review';
        } else if (assignedSubtask) {
          successMessage = 'Subtask submitted for review';
        } else if (selfAssignedMainTask) {
          successMessage = 'Task submitted to admin for review';
        } else {
          // Default message
          if (task.parent_task_id) {
            successMessage = 'Subtask submitted for review';
          } else {
            successMessage = 'Task submitted successfully';
          }
        }
        
        toast.success(successMessage);
        setShowSubmitModal(false);
        setModalNotes('');
        setModalFiles([]);
        fetchTaskDetails(); // Refresh task details
        fetchTaskComments(); // Refresh comments
        fetchTaskAttachments(); // Refresh attachments
      } else {
        // Show the actual error message from the backend
        const errorMessage = response.data.errors ? response.data.errors.join(', ') : response.data.message || 'Failed to submit task';
        toast.error(`Error: ${errorMessage}`);
      }
    } catch (error) {
      
      if (error.response) {
        // Show the actual validation error from the backend
        const errorMessage = error.response.data.errors ? error.response.data.errors.join(', ') : error.response.data.message || error.response.statusText || 'Failed to submit task';
        toast.error(`Error: ${errorMessage}`);
      } else {
        toast.error('Network error: Failed to submit task');
      }
    } finally {
      setIsSubmittingTask(false); // Set loading state to false
    }
  };

  // Handle start task for daily routine tasks
  const handleStartTask = async () => {
    if (!task) return;
    
    setIsStartingTask(true);
    
    try {
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/status`),
        { status: 'IN_PROGRESS' },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success('Task started successfully');
        fetchTaskDetails(); // Refresh the task details
      } else {
        toast.error(response.data.message || 'Failed to start task');
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to start task'}`);
      } else {
        toast.error('Network error: Failed to start task');
      }
    } finally {
      setIsStartingTask(false);
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

  useEffect(() => {
    fetchTaskDetails();
    fetchTaskComments();
    fetchTaskAttachments();
    fetchTaskLogs(); // Fetch logs when component mounts
    fetchTaskTestCases(); // Fetch test cases when component mounts
    // Fetch bugs and bug attachments
    const fetchBugsAndAttachments = async () => {
      await fetchTaskBugs(); // Fetch bugs first
      fetchAllBugAttachments(); // Then fetch all bug attachments
    };
    fetchBugsAndAttachments();
    resetAttachmentPage(); // Reset attachment pagination when task changes
  }, [taskId]);

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
                      onClick={() => navigate('/team-leader/my-tasks')}
                    >
                      Go to My Tasks
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
                        onClick={() => navigate('/team-leader/my-tasks')}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back to My Tasks
                      </button>
                      {/* Start Task button - show for all task types with ASSIGNED or PENDING status */}
                      {(task.status === 'ASSIGNED' || task.status === 'PENDING') && (
                        <button 
                          className="btn btn-outline-primary"
                          onClick={handleStartTask}
                          disabled={isStartingTask}
                        >
                          {isStartingTask ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Starting...
                            </>
                          ) : (
                            <>
                              <i className="ri-play-circle-line me-2"></i>
                              Start Task
                            </>
                          )}
                        </button>
                      )}
                      {/* Submit button - only show if task is not already submitted or completed */}
                      {task.status !== 'SUBMITTED' && task.status !== 'SUBMITTED_TO_ADMIN' && task.status !== 'COMPLETED' && (
                        <button 
                          className="btn btn-success"
                          onClick={() => setShowSubmitModal(true)}
                        > Submit Task
                          {/* <i className="ri-send-plane-line me-2"></i>
                          {isSelfTakenSubtask(task) 
                            ? 'Complete Task' 
                            : task.parent_task_id 
                              ? 'Submit to TL' 
                              : 'Submit to Admin'} */}
                        </button>
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
                          <div className="d-flex gap-2 mb-3">
                            <span className={`badge ${
                              task.status === 'COMPLETED' ? 'bg-success' : 
                              task.status === 'IN_PROGRESS' ? 'bg-warning' : 
                              task.status === 'PENDING' ? 'bg-info' : 
                              task.status === 'SUBMITTED' ? 'bg-primary' : 
                              task.status === 'SUBMITTED_TO_ADMIN' ? 'bg-primary' : 
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
                                    <p className="mb-2"><strong>Assigned By:</strong> {task.created_by_name || task.creator_name || 'Unknown'}</p>
                                    <p className="mb-2"><strong>Assigned To:</strong> {task.assigned_to_name || 'Unknown'}</p>
                                    
                                  </div>
                                  <div className="col-md-6">
                                    <p className="mb-2"><strong>Created At:</strong> {task.created_at ? new Date(task.created_at).toLocaleString() : 'N/A'}</p>
                                    <p className="mb-2"><strong>Updated At:</strong> {task.updated_at ? new Date(task.updated_at).toLocaleString() : 'N/A'}</p>
                                  
                                  </div>
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
                                      {currentComments.map((comment, index) => (
                                        <div key={comment.id} className="card mb-3 border shadow-sm">
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
                                                  comment.comment_type === 'NOTE' ? 'bg-info' :
                                                  comment.comment_type === 'PROGRESS' ? 'bg-success' : 'bg-secondary'
                                                }`}>
                                                  {comment.comment_type}
                                                </span>
                                              )}
                                            </div>
                                            <div className="mt-2">
                                              <p className="mb-0">{comment.comment}</p>
                                            </div>
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
                                    <p className="text-muted mb-0">No comments yet. Be the first to add a comment!</p>
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
                                  <div>
                                    {task.status !== 'CANCELLED' && task.status !== 'COMPLETED' && (
                                      <button 
                                        className="btn btn-sm btn-outline-success me-2"
                                        onClick={() => setShowUploadModal(true)}
                                      >
                                        <i className="ri-upload-line me-1"></i>
                                        Upload
                                      </button>
                                    )}
                                  
                                  </div>
                                </div>
                              </div>
                              <div className="mb-4">
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
                                    <p className="text-muted mb-0">
                                      {task.status === 'CANCELLED' 
                                        ? 'No attachments available for cancelled task.' 
                                        : task.status === 'COMPLETED'
                                        ? 'No attachments available for completed task.'
                                        : 'No attachments uploaded yet.'}
                                    </p>
                                    {task.status !== 'CANCELLED' && task.status !== 'COMPLETED' && (
                                      <button 
                                        className="btn btn-outline-success mt-2 me-2"
                                        onClick={() => setShowUploadModal(true)}
                                      >
                                        <i className="ri-upload-line me-1"></i>
                                        Upload First Attachments
                                      </button>
                                    )}
                                    
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
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                  <h5 className="mb-0">Daily Logs ({logs.length})</h5>
                                  {task.status !== 'COMPLETED' && (
                                    <button 
                                      className="btn btn-outline-primary"
                                      onClick={() => setShowLogModal(true)}
                                    >
                                      <i className="ri-add-line me-1"></i>
                                      Write Log
                                    </button>
                                  )}
                                </div>
                                
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
                                            {log.time_spent && (
                                              <span className="badge bg-info">
                                                {formatTimeSpent(log.time_spent)}
                                              </span>
                                            )}
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
                                    <p className="text-muted mb-0">
                                      {task.status === 'COMPLETED'
                                        ? 'No logs recorded for this completed task.'
                                        : 'No logs yet. Start by adding your first daily log!'}
                                    </p>
                                    {task.status !== 'COMPLETED' && (
                                      <button 
                                        className="btn btn-outline-primary mt-2"
                                        onClick={() => setShowLogModal(true)}
                                      >
                                        <i className="ri-add-line me-1"></i>
                                        Write Your First Log
                                      </button>
                                    )}
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
                      
                      {/* Test Cases Tab */}
                      {activeTab === 'testCases' && (
                        <div className="tab-pane fade show active">
                          <div className="row">
                            <div className="col-12">
                              <div className="mb-4">
                                <h5 className="mb-3">Test Case</h5>
                                
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
                                      <i className="ri-bug-line me-1"></i> Bugs
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
                                              
                                              {/* Show button to add test case if less than 3 and previous test case is passed */}
                                              {testCases.length < 3 && (
                                                (() => {
                                                  // Check if we can create the next test case
                                                  const firstTestCase = testCases.find(tc => tc.test_case_number === 1);
                                                  const secondTestCase = testCases.find(tc => tc.test_case_number === 2);
                                                  
                                                  const canCreateNext = testCases.length === 0 || // Can create first test case
                                                    (testCases.length === 1 && firstTestCase && firstTestCase.status === 'PASSED') || // Can create 2nd if 1st is passed
                                                    (testCases.length === 2 && firstTestCase && firstTestCase.status === 'PASSED' && secondTestCase && secondTestCase.status === 'PASSED'); // Can create 3rd if 1st and 2nd are passed
                                                  
                                                  return canCreateNext ? (
                                                    <div className="col-md-4 mb-3">
                                                      <div className="card h-100 border border-dashed text-center d-flex align-items-center justify-content-center">
                                                        <div className="card-body">
                                                          {/* <button 
                                                            className="btn btn-outline-primary"
                                                            onClick={() => {
                                                              setModalType('test-case');
                                                              setShowCreateModal(true);
                                                            }}
                                                          >
                                                            <i className="ri-add-line"></i> Add Test Case
                                                          </button> */}
                                                          <p className="text-muted small mt-2">Max 3 test cases allowed</p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="col-md-4 mb-3">
                                                      <div className="card h-100 border border-dashed text-center d-flex align-items-center justify-content-center">
                                                        <div className="card-body">
                                                          <p className="text-muted small">Complete previous test case to create next</p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })()
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
                                            {!(subSubTab && subSubTab === 'all') && (
                                              <div className="d-flex gap-2">
                                              {/* <button 
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => {
                                                  // If there's an active test case selection, check its status
                                                  if (subSubTab && subSubTab !== 'all') {
                                                    const selectedTestCase = testCases.find(tc => tc.id == subSubTab);
                                                    
                                                    if (selectedTestCase) {
                                                      // Only allow bug reporting for IN_TEST or FAILED test cases
                                                      if (selectedTestCase.status === 'PASSED') {
                                                        toast.error('Cannot report bugs for a passed test case. Only in-progress or failed test cases can have bugs reported.');
                                                        return;
                                                      }
                                                      
                                                      setNewBug({...newBug, test_case_id: subSubTab});
                                                    }
                                                  } else {
                                                    setNewBug({...newBug, test_case_id: ''});
                                                  }
                                                  
                                                  setModalType('bug');
                                                  setShowCreateModal(true);
                                                }}
                                                disabled={subSubTab && subSubTab !== 'all' && testCases.some(tc => tc.id == subSubTab && tc.status === 'PASSED')}
                                              >
                                                <i className="ri-add-line me-1"></i> Report Bug
                                              </button>
                                              
                                              <button 
                                                className="btn btn-sm btn-outline-warning"
                                                onClick={setTaskInProgress}
                                              >
                                                <i className="ri-refresh-line me-1"></i> Set Task In Progress
                                              </button> */}
                                              </div>
                                            )}
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
                                                            {/* <th>Description</th> */}
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
                                                                {/* <td>{bug.description}</td> */}
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
                                                                    setAttachmentToView(attachment);
                                                                    setShowAttachmentModal(true);
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
      </div>

      {/* Submit Task Modal */}
      {showSubmitModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isSelfTakenSubtask(task)
                    ? 'Submit Subtask for Review'
                    : task && task.parent_task_id
                    ? 'Submit Subtask for Review'
                    : 'Submit Task for Review'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowSubmitModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Completion Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="Add notes about the task completion... (Optional)"
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Attachments (Optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={handleModalFileChange}
                    multiple
                  />
                  {modalFiles.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">
                        Selected files: {modalFiles.map(f => f.name).join(', ')}
                      </small>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleSubmitTask}
                  disabled={isSubmittingTask}
                >
                  {isSubmittingTask ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      {isSelfTakenSubtask(task)
                        ? 'Completing...'
                        : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line me-1"></i>
                      {isSelfTakenSubtask(task)
                        ? 'Submit Subtask'
                        : task.parent_task_id
                        ? 'Submit Subtask'
                        : 'Submit Task'}
                    </>
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
                      <option value="NOTE">Note</option>
                      <option value="PROGRESS">Progress Update</option>
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

      {/* Attachment View Modal */}
      {showAttachmentModal && attachmentToView && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1051 }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{attachmentToView.file_name}</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowAttachmentModal(false);
                  setAttachmentToView(null);
                }}></button>
              </div>
              <div className="modal-body text-center">
                {attachmentToView.file_type && (
                  (attachmentToView.file_type.includes('image') || 
                   attachmentToView.file_type.includes('jpeg') || 
                   attachmentToView.file_type.includes('jpg') || 
                   attachmentToView.file_type.includes('png') || 
                   attachmentToView.file_type.includes('gif') || 
                   attachmentToView.file_type.includes('webp')) ? (
                    <img 
                      src={getAttachmentUrl(attachmentToView)}
                      alt={attachmentToView.file_name} 
                      className="img-fluid"
                      style={{ maxHeight: '70vh' }}
                    />
                  ) : attachmentToView.file_type.includes('video') || 
                      attachmentToView.file_type.includes('mp4') || 
                      attachmentToView.file_type.includes('webm') || 
                      attachmentToView.file_type.includes('ogg') ? (
                    <video 
                      src={getAttachmentUrl(attachmentToView)}
                      controls
                      className="img-fluid"
                      style={{ maxHeight: '70vh' }}
                    />
                  ) : attachmentToView.file_type.includes('pdf') || 
                      attachmentToView.file_type.includes('text') || 
                      attachmentToView.file_type.includes('plain') ? (
                    <iframe 
                      src={getAttachmentUrl(attachmentToView)}
                      title={attachmentToView.file_name}
                      className="w-100"
                      style={{ height: '70vh' }}
                    />
                  ) : (
                    <div>
                      <i className="ri-file-line ri-3x text-muted mb-3"></i>
                      <p>Preview not available for this file type.</p>
                      <a href={getAttachmentUrl(attachmentToView)} download={attachmentToView.file_name} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                        <i className="ri-download-line me-1"></i>
                        Download File
                      </a>
                    </div>
                  )
                )}
              </div>
              <div className="modal-footer">
                <a href={getAttachmentUrl(attachmentToView)} download={attachmentToView.file_name} className="btn btn-outline-primary" onClick={(e) => {
                  e.preventDefault();
                  openAttachment(attachmentToView);
                }}>
                  <i className="ri-download-line me-1"></i>
                  Download
                </a>
                <button type="button" className="btn btn-outline-secondary" onClick={() => {
                  setShowAttachmentModal(false);
                  setAttachmentToView(null);
                }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Log Modal */}
      {showLogModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Daily Log Entry</h5>
                <button type="button" className="btn-close" onClick={() => setShowLogModal(false)}></button>
              </div>
              <form onSubmit={handleAddLog}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">What did you do today? *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={logData.work_done}
                      onChange={(e) => setLogData({...logData, work_done: e.target.value})}
                      placeholder="Describe the work you completed today..."
                      required
                    ></textarea>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">File Location/Path</label>
                        <input
                          type="text"
                          className="form-control"
                          value={logData.file_location}
                          onChange={(e) => setLogData({...logData, file_location: e.target.value})}
                          placeholder="e.g., /project/src/components/TaskView.js"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Time Spent (minutes)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={logData.time_spent}
                          onChange={(e) => setLogData({...logData, time_spent: e.target.value})}
                          placeholder="e.g., 120"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Changes Made</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={logData.changes_made}
                      onChange={(e) => setLogData({...logData, changes_made: e.target.value})}
                      placeholder="Briefly describe the changes you made..."
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Challenges Faced</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={logData.challenges}
                      onChange={(e) => setLogData({...logData, challenges: e.target.value})}
                      placeholder="Any challenges or blockers you encountered..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowLogModal(false)}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-outline-primary"
                    disabled={logLoading}
                  >
                    {logLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line me-1"></i>
                        Save Log
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upload Attachments Modal */}
      {showUploadModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Attachments</h5>
                <button type="button" className="btn-close" onClick={() => setShowUploadModal(false)}></button>
              </div>
              <form onSubmit={handleUploadAttachments}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Select Files</label>
                    <small className="text-muted d-block mb-1">All file types accepted including code files (.js, .html, .css, .py, etc.)</small>
                    <input
                      type="file"
                      className="form-control"
                      onChange={handleUploadFileChange}
                      multiple
                    />
                  </div>
                  
                  {uploadFiles.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label">Customize File Names</label>
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Original Name</th>
                              <th>Custom Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadFiles.map((file, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="avatar-xs bg-light rounded me-2">
                                      <i className={`ri-file-${getFileIcon(file.type)}-line ri-xs text-primary`}></i>
                                    </div>
                                    <span>{file.name}</span>
                                  </div>
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={fileNames[index] || file.name}
                                    onChange={(e) => handleFileNameChange(index, e.target.value)}
                                    placeholder="Enter custom file name"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="alert alert-info">
                        <i className="ri-information-line me-2"></i>
                        Note: Today's date will be automatically appended to the filename to avoid conflicts. All file types are accepted including code files (.js, .html, .css, .py, etc.)
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-outline-success"
                    disabled={uploadFiles.length === 0}
                  >
                    <i className="ri-upload-line me-1"></i>
                    Upload Attachments
                  </button>
                </div>
              </form>
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
                    
                    {/* <div>
                      <label className="form-label fw-bold">Add Attachments to Bug</label>
                      <input
                        ref={bugAttachmentInputRef}
                        type="file"
                        className="form-control"
                        multiple
                        onChange={(e) => {
                          setBugAttachmentFiles(Array.from(e.target.files));
                        }}
                        accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                      <div className="form-text">
                        Select files to attach to this bug. Max file size: 10MB.
                      </div>
                      {bugAttachmentFiles.length > 0 && (
                        <div className="mt-2">
                          <small className="text-muted">Selected files:</small>
                          <ul className="list-unstyled mt-1">
                            {bugAttachmentFiles.map((file, index) => (
                              <li key={index} className="d-flex align-items-center gap-2">
                                <i className="ri-file-line"></i>
                                <span className="text-truncate" style={{ maxWidth: '150px' }}>{file.name}</span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-danger p-0"
                                  onClick={() => {
                                    const newFiles = [...bugAttachmentFiles];
                                    newFiles.splice(index, 1);
                                    setBugAttachmentFiles(newFiles);
                                  }}
                                >
                                  <i className="ri-close-line"></i>
                                </button>
                              </li>
                            ))}
                          </ul>
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={async () => {
                              const success = await uploadBugAttachments(selectedBug.id, bugAttachmentFiles);
                              if (success) {
                                setBugAttachmentFiles([]); // Clear the selected files
                                // Reset the file input
                                if (bugAttachmentInputRef.current) {
                                  bugAttachmentInputRef.current.value = '';
                                }
                              }
                            }}
                          >
                            Upload Attachments
                          </button>
                        </div>
                      )}
                    </div> */}
                  </div>
                </div>
                
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
                                  setAttachmentToView(attachment);
                                  setShowAttachmentModal(true);
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
                                    deleteAttachment(attachment.id, attachment.file_name, true, actualTaskId, currentBugForAttachments.id);
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
  );
};

export default MyTaskUpdatePage;
