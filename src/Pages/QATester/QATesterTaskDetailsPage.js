import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import Snowfall from 'react-snowfall';


const QATesterTaskDetailsPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { leadCrmUser } = useContext(ConfigContext);
  const reviewFileInputRef = useRef(null);
  const bugAttachmentInputRef = useRef(null);
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('UPDATE');
  const [attachments, setAttachments] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [showModal, setShowModal] = useState(false);
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', url: '', name: '' });
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState('TESTED');
  const [testNotes, setTestNotes] = useState('');
  const [testAttachments, setTestAttachments] = useState([]);
  // const [subTab, setSubTab] = useState('testCases');
  // New states for test cases and bugs modal
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
  const [expectedResultError, setExpectedResultError] = useState(''); // Validation error for expected result
  const [actualResultError, setActualResultError] = useState(''); // Validation error for actual result
  
  // New state for bug attachments
  const [selectedBugAttachments, setSelectedBugAttachments] = useState([]); // Store selected attachments for bug reporting
  const [showAttachmentModal, setShowAttachmentModal] = useState(false); // For viewing attachments
  const [attachmentToView, setAttachmentToView] = useState(null); // Current attachment to view
  
  // State for bug attachments modal
  const [showBugAttachmentsModal, setShowBugAttachmentsModal] = useState(false); // For bug attachments modal
  const [currentBugAttachments, setCurrentBugAttachments] = useState([]); // Current bug attachments to display
  const [currentBugForAttachments, setCurrentBugForAttachments] = useState(null); // Current bug for attachments modal
  
  // State for bug attachment uploads
  const [bugAttachmentFiles, setBugAttachmentFiles] = useState([]); // Files to upload to bug
  
  // New states for test cases functionality
  const [subTab, setSubTab] = useState('test-cases'); // For test case sub-tabs
  const [subSubTab, setSubSubTab] = useState(null); // For bug sub-sub-tabs
  const [testCases, setTestCases] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [bugAttachments, setBugAttachments] = useState({}); // Store attachments by bug ID
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [error, setError] = useState(null);
  
  // New states for bugs pagination
  const [bugsPerPage] = useState(10);
  const [currentBugPage, setCurrentBugPage] = useState(1);
  const [currentBug, setCurrentBug] = useState(null); // For bug details modal
  const [currentTestCaseDetails, setCurrentTestCaseDetails] = useState(null); // For test case details modal
  const [showTestCaseSidebar, setShowTestCaseSidebar] = useState(false); // For test case sidebar
  const [isClosing, setIsClosing] = useState(false); // For test case sidebar closing animation
  const [selectedTestCase, setSelectedTestCase] = useState(null); // For selected test case in sidebar
  const [showBugSidebar, setShowBugSidebar] = useState(false); // For bug sidebar
  const [selectedBug, setSelectedBug] = useState(null); // For selected bug in sidebar
  const [selectedBugStatus, setSelectedBugStatus] = useState(''); // For selected bug status in sidebar
  
  // State for bug creation loading
  const [isCreatingBug, setIsCreatingBug] = useState(false);
  
  // State for test result submission loading
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  
  // State for setting task to IN_PROGRESS loading
  const [isSettingTaskProgress, setIsSettingTaskProgress] = useState(false);
  
  // New states for logs functionality
  const [logs, setLogs] = useState([]);
  // Pagination states for logs
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(5);
  // Pagination states for comments
  const [currentCommentPage, setCurrentCommentPage] = useState(1);
  const [commentsPerPage] = useState(5);
  
  // Pagination states for attachments
  const [currentAttachmentPage, setCurrentAttachmentPage] = useState(1);
  const [attachmentsPerPage] = useState(10);
  
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

  // Function to open attachment - force download for all file types
  const openAttachment = (attachment) => {
    const baseUrl = process.env.REACT_APP_SERVER_URL || 'https://task.ipshopy.com';
    
    // Check if we have a direct file path that can be used for download
    if (attachment.file_path) {
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
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = `${baseUrl}${filePath.startsWith('/') ? filePath : '/' + filePath}`;
      link.setAttribute('download', attachment.file_name || attachment.name || 'attachment');
      // Remove target="_blank" to ensure download instead of opening in new tab
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback to the API endpoint if no direct file path
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
    }
  };

  // Function to get proper URL for attachment
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
  
  // Function to view attachment in browser
  const viewAttachment = (attachment) => {
    const fullUrl = getAttachmentUrl(attachment);
    
    // Set modal content and show modal instead of opening in new tab
    setModalContent({
      type: attachment.file_type,
      url: fullUrl,
      name: attachment.file_name || attachment.name || 'Unknown File'
    });
    setShowModal(true);
  };
  
  // Function to delete attachment
  const deleteAttachment = async (attachmentId, fileName, isBugAttachment = false, taskId = null, bugId = null) => {
    if (!window.confirm(`Are you sure you want to delete the attachment: ${fileName}?`)) {
      return;
    }
    
    try {
      let response;
      
      if (isBugAttachment && taskId && bugId) {
        // Delete bug attachment using the appropriate endpoint
        response = await axios.delete(
          buildApiUrl(`/tasks/${taskId}/bugs/${bugId}/attachments/${attachmentId}`),
          { headers: getAuthHeaders() }
        );
      } else {
        // Delete regular task attachment
        response = await axios.delete(
          buildApiUrl(`/tasks/attachments/${attachmentId}`),
          { headers: getAuthHeaders() }
        );
      }
      
      if (response.data.success) {
        toast.success(response.data.message || 'Attachment deleted successfully');
        // Refresh attachments after deletion
        fetchTaskDetails();
      } else {
        toast.error(response.data.message || 'Failed to delete attachment');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to delete attachment');
      }
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
          setCurrentCommentPage(1); // Reset to first page when comments are fetched
        } else {
          console.error('Failed to fetch comments:', commentsResponse.data.message);
          // Set empty array if failed to fetch comments
          setComments([]);
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
        
        // Get task logs
        try {
          const logsResponse = await axios.get(
            buildApiUrl(`/tasks/${taskId}/logs`),
            { headers: getAuthHeaders() }
          );
          
          if (logsResponse.data.success) {
            setLogs(logsResponse.data.data.logs || []);
            setCurrentPage(1); // Reset to first page when logs are fetched
          } else {
            console.error('Failed to fetch logs:', logsResponse.data.message);
            // Set empty array if failed to fetch logs
            setLogs([]);
          }
        } catch (logsError) {
          
          // Not critical, continue without logs
        }
      }
    } catch (error) {
      
      if (error.response) {
        console.error('Error fetching task details:', error.response.data.message || error.response.statusText);
        toast.error(`Failed to load task details: ${error.response.data.message || error.response.statusText}`);
      } else {
        console.error('Network error:', error.message);
        toast.error('Network error: Failed to load task details');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch test cases for the task
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
  
  // Fetch bugs for the task
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
  
  // Function to create a new test case
  const createTestCase = async (testCaseData) => {
    try {
      const response = await axios.post(
        buildApiUrl(`/tasks/${taskId}/test-cases`),
        testCaseData,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || 'Test case created successfully');
        fetchTaskTestCases(); // Refresh the test cases list
        return true;
      } else {
        toast.error(response.data.message || 'Failed to create test case');
        return false;
      }
    } catch (error) {
      console.error('Error creating test case:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to create test case');
      }
      return false;
    }
  };
  
  // Function to update a test case
  const updateTestCase = async (testCaseId, updateData) => {
    try {
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/test-cases/${testCaseId}`),
        updateData,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || 'Test case updated successfully');
        fetchTaskTestCases(); // Refresh the test cases list
        return true;
      } else {
        toast.error(response.data.message || 'Failed to update test case');
        return false;
      }
    } catch (error) {
      console.error('Error updating test case:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to update test case');
      }
      return false;
    }
  };
  
  // Function to update a bug status
  const updateBugStatus = async (bugId, updateData) => {
    try {
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/bugs/${bugId}`),
        updateData,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || 'Bug updated successfully');
        fetchTaskBugs(); // Refresh the bugs list
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
  
  // Function to create a new bug
  const createBug = async (bugData) => {
    setIsCreatingBug(true);
    try {
      const response = await axios.post(
        buildApiUrl(`/tasks/${taskId}/bugs`),
        bugData,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || 'Bug created successfully');
        fetchTaskBugs(); // Refresh the bugs list
        
        // Log detailed information about the bug creation and notification
        console.log('🐛 Frontend: Bug created successfully, details:', {
          bugId: response.data.data?.id,
          taskId: taskId,
          title: bugData.title,
          description: bugData.description,
          severity: bugData.severity,
          priority: bugData.priority,
          testCaseId: bugData.test_case_id
        });
        
        // Log the notification status from the backend
        if (response.data.notificationStatus) {
          const notificationStatus = response.data.notificationStatus;
          if (notificationStatus.sent) {
            console.log('✅ WhatsApp notification sent successfully:', notificationStatus);
          } else {
            console.log('❌ WhatsApp notification failed:', notificationStatus.error || 'Unknown error');
            console.log('🐛 Notification details:', notificationStatus.details || 'No details available');
          }
        } else {
          console.log('⚠️ No notification status received from backend');
        }
        
        setTimeout(() => {
          setIsCreatingBug(false);
        }, 1000); // Small delay to show the loader
        
        return true;
      } else {
        toast.error(response.data.message || 'Failed to create bug');
        setIsCreatingBug(false);
        return false;
      }
    } catch (error) {
      console.error('Error creating bug:', error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Network error: Failed to create bug');
      }
      setIsCreatingBug(false);
      return false;
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
  
  // Function to fetch all bug attachments for the task
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
  
  // Get current attachments for display based on the filtered attachments
  const getCurrentAttachments = (filteredAttachments) => {
    const indexOfLastAttachment = currentAttachmentPage * attachmentsPerPage;
    const indexOfFirstAttachment = indexOfLastAttachment - attachmentsPerPage;
    return filteredAttachments.slice(indexOfFirstAttachment, indexOfLastAttachment);
  };
  
  // Change attachment page
  const paginateAttachments = (pageNumber) => setCurrentAttachmentPage(pageNumber);
  
  // Previous attachment page
  const prevAttachmentPage = () => {
    if (currentAttachmentPage > 1) {
      setCurrentAttachmentPage(currentAttachmentPage - 1);
    }
  };
  
  // Next attachment page
  const nextAttachmentPage = (totalAttachments) => {
    const totalPages = Math.ceil(totalAttachments / attachmentsPerPage);
    if (currentAttachmentPage < totalPages) {
      setCurrentAttachmentPage(currentAttachmentPage + 1);
    }
  };
  
  // Reset attachment page when filters change
  const resetAttachmentPage = () => {
    setCurrentAttachmentPage(1);
  };
  
  // Function to close all modals
  const closeAllModals = () => {
    setShowModal(false);
    setShowAttachmentModal(false);
    setShowBugAttachmentsModal(false);
    setShowCreateModal(false);
    setShowAddCommentModal(false);
    setShowTestModal(false);
    setShowTestCaseSidebar(false);
    setShowBugSidebar(false);
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

  // Submit test result
  const submitTestResult = async () => {
    if (!testResult) {
      toast.error('Please select a test result');
      return;
    }
    
    setIsSubmittingTest(true);
    
    try {
      // First upload attachments if any
      if (testAttachments.length > 0) {
        try {
          const uploadPromises = testAttachments.map(file => {
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
      
      // Update the tester status
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/tester-status`),
        { 
          tester_status: testResult,
          completion_notes: testNotes
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setShowTestModal(false);
        setTestResult('TESTED');
        setTestNotes('');
        setTestAttachments([]);
        if (reviewFileInputRef.current) {
          reviewFileInputRef.current.value = '';
        }
        fetchTaskDetails(); // Refresh task details
        toast.success(`Task ${testResult === 'TESTED' ? 'tested and approved' : 'rejected by tester'}`);
      } else {
        toast.error(`Failed to update task: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating task tester status:', error);
      
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || error.response.statusText || 'Failed to update task'}`);
      } else {
        toast.error('Network error: Failed to update task');
      }
    } finally {
      setIsSubmittingTest(false);
    }
  };
  
  // Function to handle creating a new test case
  const handleCreateTestCase = async () => {
    // Clear previous errors
    setExpectedResultError('');
    
    if (!newTestCase.test_case_number || !newTestCase.title) {
      toast.error('Test case number and title are required');
      return;
    }
    
    // Validate expected_result field
    if (!newTestCase.expected_result || newTestCase.expected_result.trim().length < 50) {
      const errorMessage = 'Expected Result is required and must be at least 50 characters long';
      setExpectedResultError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    const testCaseNumber = parseInt(newTestCase.test_case_number);
    
    // Validate that test case number is between 1 and 3
    if (testCaseNumber < 1 || testCaseNumber > 3) {
      toast.error('Test case number must be 1, 2, or 3');
      return;
    }
    
    // Check if this test case number already exists for this task
    const existingTestCase = testCases.find(tc => tc.test_case_number == testCaseNumber);
    if (existingTestCase) {
      toast.error(`Test case ${testCaseNumber} already exists for this task`);
      return;
    }
    
    const success = await createTestCase({
      test_case_number: testCaseNumber,
      title: newTestCase.title,
      description: newTestCase.description,
      expected_result: newTestCase.expected_result
    });
    
    if (success) {
      // Reset form
      setNewTestCase({
        test_case_number: '',
        title: '',
        description: '',
        expected_result: ''
      });
      setExpectedResultError(''); // Clear validation error
      setShowCreateModal(false);
    }
  };
  
  // Function to handle creating a new bug
  const handleCreateBug = async () => {
    if (!newBug.title) {
      toast.error('Bug title is required');
      return;
    }
    
    const bugData = {
      title: newBug.title,
      description: newBug.description,
      severity: newBug.severity,
      priority: newBug.priority
    };
    
    // Only add test_case_id if it's selected
    if (newBug.test_case_id) {
      bugData.test_case_id = parseInt(newBug.test_case_id);
    }
    
    const success = await createBug(bugData);
    
    if (success && selectedBugAttachments.length > 0) {
      // Find the newly created bug to get its ID
      fetchTaskBugs(); // Refresh bugs to get the latest
      
      // After a short delay to ensure the bug is created, upload attachments
      setTimeout(async () => {
        // Get the latest bugs to find the one we just created
        const response = await axios.get(
          buildApiUrl(`/tasks/${taskId}/bugs`),
          { headers: getAuthHeaders() }
        );
        
        if (response.data.success) {
          // Find the most recently created bug
          const latestBug = response.data.data.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )[0];
          
          if (latestBug) {
            // Upload attachments to this bug
            const uploadPromises = selectedBugAttachments.map(file => {
              const formData = new FormData();
              formData.append('file', file);
              
              return axios.post(
                buildApiUrl(`/tasks/${taskId}/bugs/${latestBug.id}/attachments`),
                formData,
                {
                  headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                  }
                }
              );
            });
            
            try {
              const uploadResponses = await Promise.all(uploadPromises);
              const allSuccessful = uploadResponses.every(response => response.data.success);
              
              if (!allSuccessful) {
                toast.error('Some attachments failed to upload. Please try again.');
              }
            } catch (uploadError) {
              if (uploadError.response) {
                toast.error(`Error uploading attachments: ${uploadError.response.data.message || uploadError.response.statusText || 'Failed to upload attachments'}`);
              } else {
                toast.error('Network error: Failed to upload attachments');
              }
            }
          }
        }
      }, 1000); // 1 second delay to ensure the bug is created first
    }
    
    if (success) {
      // Reset form
      setNewBug({
        title: '',
        description: '',
        severity: 'MEDIUM',
        priority: 'MEDIUM',
        test_case_id: '',
        attachments: []
      });
      setSelectedBugAttachments([]);
      // Don't close the modal immediately, let the createBug function handle the loading state
      setTimeout(() => {
        setShowCreateModal(false);
      }, 1000); // Small delay to allow for notification processing
    }
  };
  
  // Function to handle form submission based on modal type
  const handleSubmitModal = async () => {
    if (modalType === 'test-case') {
      await handleCreateTestCase();
    } else if (modalType === 'bug') {
      await handleCreateBug();
    } else if (modalType === 'test-case-action') {
      await handleTestCaseAction();
    }
    
    // Close the modal if it's a bug details view
    if (modalType === 'bug-details') {
      setShowCreateModal(false);
      setModalType('');
      setCurrentBug(null);
    }
    
    // Close the modal if it's a test case details view
    if (modalType === 'test-case-details') {
      setShowCreateModal(false);
      setModalType('');
      setCurrentTestCaseDetails(null);
    }
  };
  
  // Function to handle test case action
  const handleTestCaseAction = async () => {
    // Clear previous errors
    setActualResultError('');
    
    if (!testCaseAction) {
      toast.error('Please select an action');
      return;
    }
    
    // Validate testCaseNotes field for PASSED or FAILED actions
    if ((testCaseAction === 'PASSED' || testCaseAction === 'FAILED') && 
        (!testCaseNotes || testCaseNotes.trim().length < 50)) {
      const errorMessage = 'Actual Result is required and must be at least 50 characters long for PASSED/FAILED actions';
      setActualResultError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    // Check if trying to modify a passed test case that is not the 3rd one
    if (currentTestCase && currentTestCase.status === 'PASSED' && currentTestCase.test_case_number !== 3) {
      toast.error('Cannot modify a passed test case. Only the 3rd test case can be retested.');
      return;
    }
    
    // If trying to pass the test case, check if all related bugs are resolved
    if (testCaseAction === 'PASSED' && currentTestCase) {
      const activeBugs = bugs.filter(bug => 
        bug.test_case_id == currentTestCase.id && 
        (bug.status !== 'RESOLVED' && bug.status !== 'CLOSED')
      ).length;
      
      if (activeBugs > 0) {
        toast.error('Cannot pass test case. There are unresolved bugs related to this test case.');
        return;
      }
    }
    
    const updateData = {
      status: testCaseAction
    };
    
    // Add notes as actual result if provided and status is PASSED or FAILED
    if (testCaseNotes.trim() && (testCaseAction === 'PASSED' || testCaseAction === 'FAILED')) {
      updateData.actual_result = testCaseNotes;
    }
    
    const success = await updateTestCase(currentTestCase.id, updateData);
    
    if (success) {
      // Reset form
      setTestCaseAction('');
      setTestCaseNotes('');
      setActualResultError(''); // Clear validation error
      setCurrentTestCase(null);
      setShowCreateModal(false);
    }
  };
  
  // Function to set task status to IN_PROGRESS (reject task from tester)
  const setTaskInProgress = async () => {
    if (!window.confirm('Are you sure you want to reject this task and set it back to In Progress? This will send the task back to the developer.')) {
      return;
    }
    
    setIsSettingTaskProgress(true);
    
    try {
      const response = await axios.put(
        buildApiUrl(`/tasks/${taskId}/status`),
        { 
          status: 'IN_PROGRESS',
          completion_notes: 'Task rejected by tester and sent back for review'
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
    } finally {
      setIsSettingTaskProgress(false);
    }
  };
  
  // Function to render bugs table with pagination
  const renderBugsTable = () => {
    // Filter bugs based on selected sub-tab
    const filteredBugs = bugs.filter(bug => {
      if (subSubTab === 'all' || subSubTab === null) {
        return true; // Show all bugs
      } else {
        return bug.test_case_id == subSubTab; // Show only bugs for selected test case
      }
    });
    
    // Calculate pagination
    const indexOfLastBug = currentBugPage * bugsPerPage;
    const indexOfFirstBug = indexOfLastBug - bugsPerPage;
    const currentBugs = filteredBugs.slice(indexOfFirstBug, indexOfLastBug);
    
    return (
      <div>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Test Case</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Dev Status</th>
                <th>Reported By</th>
              
                
                {/* <th>Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {currentBugs.length > 0 ? (
                currentBugs.map((bug, index) => (
                  <tr key={bug.id} className="cursor-pointer" onClick={() => {
                    // Open bug in sidebar
                    setSelectedBug(bug);
                    setShowBugSidebar(true);
                  }}>
                    <td>{filteredBugs.length - indexOfFirstBug - index}</td>
                    <td>{bug.title}</td>
                    <td>{bug.test_case_number ? `TC${bug.test_case_number}: ${bug.test_case_title}` : 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        bug.severity === 'LOW' ? 'bg-success' :
                        bug.severity === 'MEDIUM' ? 'bg-warning' :
                        bug.severity === 'HIGH' ? 'bg-danger' : 'bg-dark'
                      }`}>
                        {bug.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        bug.status === 'NEW' ? 'bg-secondary' :
                        bug.status === 'CONFIRMED' ? 'bg-info' :
                        bug.status === 'IN_PROGRESS' ? 'bg-warning' :
                        bug.status === 'RESOLVED' ? 'bg-success' : 'bg-dark'
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
                    {bug.developer_status || 'pending'}</span>
                    </td>
                    <td>{bug.reported_by_name}</td>
                    
                    
                    {/* <td>
                      <button 
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          // Show bug details
                          setModalType('bug-details');
                          setCurrentBug(bug);
                          setShowCreateModal(true);
                        }}
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          // Show bug attachments
                          setSubSubTab(bug.id);
                          setSubTab('bug-attachments');
                        }}
                      >
                        <i className="ri-attachment-line"></i>
                      </button>
                    </td> */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    {filteredBugs.length > 0 ? 'No bugs found for this selection.' : 'No bugs reported for this task.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination for bugs */}
        {filteredBugs.length > 0 && (
          (() => {
            const totalPages = Math.ceil(filteredBugs.length / bugsPerPage);
            
            if (totalPages > 1) {
              return (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {(currentBugPage - 1) * bugsPerPage + 1} to {Math.min(currentBugPage * bugsPerPage, filteredBugs.length)} of {filteredBugs.length} bugs
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
      </div>
    );
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);
  
  // Fetch test cases and bugs when activeTab changes to test-case
  // Fetch test cases and bugs when component mounts and when activeTab changes to test-case
  useEffect(() => {
    fetchTaskTestCases();
    fetchTaskBugs();
  }, [taskId]);
  
  useEffect(() => {
    if (activeTab === 'test-case') {
      fetchTaskTestCases();
      fetchTaskBugs();
    }
  }, [activeTab, taskId]);
  
  // Fetch bug attachments when subTab changes to bug-attachments or attachments
  useEffect(() => {
    if (subTab === 'bug-attachments' && subSubTab) {
      fetchBugAttachments(subSubTab);
    } else if (subTab === 'attachments') {
      // When navigating to the attachments tab, fetch all bug attachments
      fetchAllBugAttachments();
    }
  }, [subTab, subSubTab, taskId]);
  
  // Get current logs for display
  const currentLogs = getCurrentLogs();
  const totalPages = Math.ceil(logs.length / logsPerPage);

  // Get current comments for display
  const currentComments = getCurrentComments();
  const totalCommentPages = Math.ceil(comments.length / commentsPerPage);

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
                      onClick={() => navigate('/qa-tester/tasks')}
                    >
                      Go to Tasks
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
           color="rgba(105, 239, 251, 0.8)" // Light blue/ice color
          />
          <div className="row">
            <div className="col-12">
              {/* Header */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-0">Task Review Details</h4>
                      <p className="text-muted mb-0">Review and test task assigned for QA</p>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-secondary"
                       onClick={() => navigate(-1)}
                      >
                        <i className="ri-arrow-left-line me-2"></i>
                        Back 
                      </button>
                      {/* <button 
                        className="btn btn-outline-success"
                        onClick={() => setShowTestModal(true)}
                      >
                        <i className="ri-check-line me-2"></i>
                        Test Task
                      </button> */}
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
                              task.status === 'TESTER_APPROVED' ? 'bg-success' : 
                              task.status === 'DM_APPROVED' ? 'bg-success' : 
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
                            className={`nav-link ${activeTab === 'test-case' ? 'active' : ''}`}
                            onClick={() => setActiveTab('test-case')}
                            style={{ cursor: 'pointer' }}
                            role="tab"
                          >
                            <i className="ri-test-tube-line me-2"></i>
                            Test Case ({testCases.length})
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

                                    <p className="mb-2"><strong>Assigned By:</strong> {task.assigned_by_name || task.created_by_name || 'Me'}</p>
                                    <p className="mb-2"><strong>Assigned To:</strong> {task.assigned_to_name || 'N/A'}</p>
                                    <p className="mb-2"><strong>Assigned Date:</strong> {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}</p>
                                    <p className="mb-2"><strong>Updated At:</strong> {task.updated_at ? new Date(task.updated_at).toLocaleString() : 'N/A'}</p>
                                    

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
                                      {subtasks.map(subtask => (
                                        <tr key={subtask.id}>
                                          <td>{subtask.title?.substring(0,30) || 'No title'}</td>
                                          <td>{subtask.description?.substring(0,30) || 'No description'}</td>
                                          <td>{subtask.assigned_to_name || 'Unassigned'}</td>
                                          <td>
                                            <span className={`badge ${
                                              subtask.status === 'COMPLETED' ? 'bg-success' : 
                                              subtask.status === 'IN_PROGRESS' ? 'bg-warning' : 
                                              subtask.status === 'PENDING' ? 'bg-info' : 
                                              subtask.status === 'SUBMITTED' ? 'bg-primary' : 
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
                                  <div className="list-group">
                                    {currentComments.map((comment, index) => (
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
                                ) : (
                                  <div className="text-center py-5">
                                    <i className="ri-discuss-line ri-2x text-muted mb-3"></i>
                                    <p className="text-muted mb-0">No comments yet.</p>
                                  </div>
                                )}
                                
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
                                    <p className="text-muted mb-0">No daily logs recorded for this task.</p>
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
                                                <button 
                                                  className="btn btn-sm btn-outline-danger ms-1"
                                                  onClick={() => {
                                                    // Delete attachment
                                                    deleteAttachment(attachment.id, attachment.file_name || attachment.name || 'Unknown File');
                                                  }}
                                                >
                                                  <i className="ri-delete-bin-line"></i>
                                                  Delete
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

                      {/* Test Case Tab */}
                      {activeTab === 'test-case' && (
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
                                        style={{ cursor: 'pointer' }}
                                      role="tab"
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
                                              <div className="d-flex align-items-center gap-2">
                                                {/* Show Test Task button only after first two test cases are passed */}
                                                {(() => {
                                                  const firstTestCase = testCases.find(tc => tc.test_case_number === 1);
                                                  const secondTestCase = testCases.find(tc => tc.test_case_number === 2);
                                                                                                                                       
                                                  const firstTestPassed = firstTestCase && firstTestCase.status === 'PASSED';
                                                  const secondTestPassed = secondTestCase && secondTestCase.status === 'PASSED';
                                                                                                                                       
                                                  return (firstTestPassed && secondTestPassed) ? (
                                                    <button 
                                                      className="btn btn-outline-success btn-sm"
                                                      onClick={() => setShowTestModal(true)}
                                                    >
                                                      <i className="ri-check-line me-1"></i>
                                                      Approve Task
                                                    </button>
                                                  ) : null;
                                                })()}
                                                {/* Button to set task to IN_PROGRESS (reject task) */}
                                                <button
                                                  className="btn btn-outline-warning btn-sm"
                                                  onClick={setTaskInProgress}
                                                  disabled={isSettingTaskProgress}
                                                >
                                                  {isSettingTaskProgress ? (
                                                    <>
                                                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                      Processing...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <i className="ri-refresh-line me-1"></i>
                                                      Sent Back To Developer
                                                    </>
                                                  )}
                                                </button>
                                              </div>
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
                                                          <button 
                                                            className="btn btn-outline-primary"
                                                            onClick={() => {
                                                              setModalType('test-case');
                                                              setShowCreateModal(true);
                                                            }}
                                                          >
                                                            <i className="ri-add-line"></i> Add Test Case
                                                          </button>
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
                                                All Bugs({bugs.length})
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
                                              <button 
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
                                                disabled={isSettingTaskProgress}
                                              >
                                                {isSettingTaskProgress ? (
                                                  <>
                                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                    Processing...
                                                  </>
                                                ) : (
                                                  <>
                                                    <i className="ri-refresh-line me-1"></i> Sent Back To Developer
                                                  </>
                                                )}
                                              </button>
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
                                            renderBugsTable()
                                          )}
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
          </div>
        </div>
      </div>

      {/* Test Result Modal */}
      {/* {showTestModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Test Task Result</h5>
                <button type="button" className="btn-close" onClick={() => setShowTestModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Test Result</label>
                  <select
                    className="form-select"
                    value={testResult}
                    onChange={(e) => setTestResult(e.target.value)}
                  >
                    <option value="TESTED">Task Tested Successfully</option>
                    <option value="REJECTED">Task Rejected</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Test Notes</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Add your testing notes and feedback..."
                    value={testNotes}
                    onChange={(e) => setTestNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowTestModal(false);
                    setTestAttachments([]);
                    if (reviewFileInputRef.current) {
                      reviewFileInputRef.current.value = '';
                    }
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={`btn ${testResult === 'TESTED' ? 'btn-outline-success' : 'btn-outline-danger'}`}
                  onClick={submitTestResult}
                  disabled={isSubmittingTest}
                >
                  {isSubmittingTest ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    testResult === 'TESTED' ? 'Mark as Tested' : 'Reject Task'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Attachment View Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1051 }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalContent.name}</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowModal(false);
                  setModalContent({});
                }}></button>
              </div>
              <div className="modal-body text-center">
                {modalContent.type && (
                  (modalContent.type.includes('image') || 
                   modalContent.type.includes('jpeg') || 
                   modalContent.type.includes('jpg') || 
                   modalContent.type.includes('png') || 
                   modalContent.type.includes('gif') || 
                   modalContent.type.includes('webp')) ? (
                    <img 
                      src={modalContent.url} 
                      alt={modalContent.name} 
                      className="img-fluid"
                      style={{ maxHeight: '70vh' }}
                    />
                  ) : modalContent.type.includes('video') || 
                      modalContent.type.includes('mp4') || 
                      modalContent.type.includes('webm') || 
                      modalContent.type.includes('ogg') ? (
                    <video 
                      src={modalContent.url} 
                      controls
                      className="img-fluid"
                      style={{ maxHeight: '70vh' }}
                    />
                  ) : modalContent.type.includes('pdf') || 
                      modalContent.type.includes('text') || 
                      modalContent.type.includes('plain') ? (
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
                      <a href={modalContent.url} download={modalContent.name} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary" onClick={(e) => {
                        e.preventDefault();
                        // Use the same approach as the openAttachment function but force download
                        const link = document.createElement('a');
                        link.href = modalContent.url;
                        link.setAttribute('download', modalContent.name);
                        link.target = '_self';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}>
                        <i className="ri-download-line me-1"></i>
                        Download File
                      </a>
                    </div>
                  )
                )}
              </div>
              <div className="modal-footer">
                <a href={modalContent.url} download={modalContent.name} className="btn btn-outline-primary" onClick={(e) => {
                  e.preventDefault();
                  // Use the same approach as the openAttachment function but force download
                  const link = document.createElement('a');
                  link.href = modalContent.url;
                  link.setAttribute('download', modalContent.name);
                  link.target = '_self';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}>
                  <i className="ri-download-line me-1"></i>
                  Download
                </a>
                <button type="button" className="btn btn-outline-secondary" onClick={() => {
                  setShowModal(false);
                  setModalContent({});
                }}>
                  Close
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

      {/* Test Result Modal */}
      {showTestModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-white border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="ri-test-tube-line me-2"></i>
                  Test Task Result
                </h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowTestModal(false);
                  setTestAttachments([]);
                  if (reviewFileInputRef.current) {
                    reviewFileInputRef.current.value = '';
                  }
                }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4 p-2 bg-light rounded">
                  <div className="d-flex">
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{task?.title}</h5>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="form-label fw-semibold">Test Result <span className="text-danger">*</span></label>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <div className={`card border h-100 cursor-pointer ${testResult === 'TESTED' ? 'border-success border-2' : 'border-light'}`} 
                           onClick={() => setTestResult('TESTED')}>
                        <div className="card-body text-center py-2">
                          <div className="avatar-xs bg-soft-success rounded-circle mx-auto mb-1">
                            <i className="ri-checkbox-circle-line text-success fs-12"></i>
                          </div>
                          <h6 className="mb-0 fs-13">Task Tested Successfully</h6>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className={`card border h-100 cursor-pointer ${testResult === 'REJECTED' ? 'border-danger border-2' : 'border-light'}`} 
                           onClick={() => setTestResult('REJECTED')}>
                        <div className="card-body text-center py-2">
                          <div className="avatar-xs bg-soft-danger rounded-circle mx-auto mb-1">
                            <i className="ri-close-circle-line text-danger fs-12"></i>
                          </div>
                          <h6 className="mb-0 fs-13">Task Rejected</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                  <input type="hidden" value={testResult} />
                </div>
                
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Test Notes {testResult === 'REJECTED' && <span className="text-danger">*</span>}
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={testNotes}
                    onChange={(e) => setTestNotes(e.target.value)}
                    placeholder={testResult === 'REJECTED' ? "Reason for rejecting the task..." : "Notes about your testing (optional)"}
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Attachments (Optional)</label>
                  <input
                    ref={reviewFileInputRef}
                    type="file"
                    className="form-control"
                    multiple
                    onChange={(e) => setTestAttachments(Array.from(e.target.files))}
                    accept="*/*"
                  />
                  <div className="form-text">
                    You can attach files to support your test results (e.g., screenshots, documents, videos, etc.). Max file size: 10MB.
                  </div>
                  {testAttachments.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">Selected files:</small>
                      <ul className="list-unstyled mt-1">
                        {testAttachments.map((file, index) => (
                          <li key={index} className="d-flex align-items-center gap-2">
                            <i className="ri-file-line"></i>
                            <span className="text-truncate" style={{ maxWidth: '300px' }}>{file.name}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-danger p-0"
                              onClick={() => {
                                const newFiles = [...testAttachments];
                                newFiles.splice(index, 1);
                                setTestAttachments(newFiles);
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
                  setShowTestModal(false);
                  setTestAttachments([]);
                  if (reviewFileInputRef.current) {
                    reviewFileInputRef.current.value = '';
                  }
                }}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={`btn ${testResult === 'TESTED' ? 'btn-outline-success' : 'btn-outline-danger'}`}
                  onClick={submitTestResult}
                  disabled={isSubmittingTest}
                >
                  {isSubmittingTest ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    testResult === 'TESTED' ? 'Mark as Tested' : 'Reject Task'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Test Case or Bug Modal */}
      {showCreateModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalType === 'test-case' ? 'Create New Test Case' : 'Report New Bug'}
                </h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowCreateModal(false);
                  setModalType('');
                  setExpectedResultError(''); // Clear validation errors
                  setActualResultError('');
                }}></button>
              </div>
              <div className="modal-body">
                {modalType === 'test-case' ? (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Test Case Number <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className="form-control"
                          value={newTestCase.test_case_number}
                          onChange={(e) => setNewTestCase({...newTestCase, test_case_number: e.target.value})}
                          placeholder="Enter test case number (e.g., 1, 2, 3)"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Title <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={newTestCase.title}
                          onChange={(e) => setNewTestCase({...newTestCase, title: e.target.value})}
                          placeholder="Enter test case title"
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={newTestCase.description}
                          onChange={(e) => setNewTestCase({...newTestCase, description: e.target.value})}
                          placeholder="Enter test case description"
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Expected Result *</label>
                        <textarea
                          className={`form-control ${expectedResultError ? 'is-invalid' : ''}`}
                          rows="3"
                          value={newTestCase.expected_result}
                          onChange={(e) => {
                            setNewTestCase({...newTestCase, expected_result: e.target.value});
                            // Clear error when user starts typing
                            if (expectedResultError && e.target.value.trim().length >= 50) {
                              setExpectedResultError('');
                            }
                          }}
                          placeholder="Enter expected result (minimum 50 characters)"
                        ></textarea>
                        {expectedResultError && (
                          <div className="invalid-feedback">
                            {expectedResultError}
                          </div>
                        )}
                        <div className="form-text">
                          {newTestCase.expected_result ? `${newTestCase.expected_result.length}/50 characters minimum` : '50 characters minimum required'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : modalType === 'test-case-action' && currentTestCase ? (
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <h6 className="mb-3">Test Case: TC{currentTestCase.test_case_number} - {currentTestCase.title}</h6>
                        <p className="text-muted">Current Status: <span className="badge bg-secondary">{currentTestCase.status}</span></p>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Action</label>
                        <select
                          className="form-select"
                          value={testCaseAction}
                          onChange={(e) => setTestCaseAction(e.target.value)}
                          disabled={currentTestCase.status === 'PASSED' && currentTestCase.test_case_number !== 3}
                        >
                          <option value="">Select an action</option>
                          <option value="PASSED">Pass Test Case</option>
                          <option value="FAILED">Fail Test Case</option>
                          <option value="IN_TEST">Set to In Test</option>
                        </select>
                        {currentTestCase.status === 'PASSED' && currentTestCase.test_case_number !== 3 && (
                          <div className="form-text text-danger">
                            This test case cannot be modified after being passed.
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Actual Result *</label>
                        <textarea
                          className={`form-control ${actualResultError ? 'is-invalid' : ''}`}
                          rows="3"
                          value={testCaseNotes}
                          onChange={(e) => {
                            setTestCaseNotes(e.target.value);
                            // Clear error when user starts typing
                            if (actualResultError && e.target.value.trim().length >= 100) {
                              setActualResultError('');
                            }
                          }}
                          placeholder="Add notes about the test case action... (minimum 50 characters for PASSED/FAILED)"
                          disabled={currentTestCase.status === 'PASSED' && currentTestCase.test_case_number !== 3}
                        ></textarea>
                        {actualResultError && (
                          <div className="invalid-feedback">
                            {actualResultError}
                          </div>
                        )}
                        <div className="form-text">
                          {testCaseNotes ? `${testCaseNotes.length}/50 characters minimum` : '50 characters minimum required for notes'}
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="alert alert-info">
                        <i className="ri-information-line me-1"></i>
                        Note: You can only pass a test case if all related bugs are resolved.
                      </div>
                    </div>
                  </div>
                ) : modalType === 'test-case-details' && currentTestCaseDetails ? (
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <h6 className="mb-3">Test Case Details</h6>
                        <p><strong>Test Case:</strong> TC{currentTestCaseDetails.test_case_number}: {currentTestCaseDetails.title}</p>
                        <p><strong>Description:</strong> {currentTestCaseDetails.description || 'N/A'}</p>
                        <p><strong>Expected Result:</strong> {currentTestCaseDetails.expected_result || 'N/A'}</p>
                        <p><strong>Actual Result:</strong> {currentTestCaseDetails.actual_result || 'N/A'}</p>
                        <p><strong>Created By:</strong> {currentTestCaseDetails.tester_name || 'N/A'}</p>
                        <p><strong>Created At:</strong> {new Date(currentTestCaseDetails.created_at).toLocaleString()}</p>
                        <p><strong>Status:</strong> <span className={`badge ${
                          currentTestCaseDetails.status === 'NOT_STARTED' ? 'bg-secondary' :
                          currentTestCaseDetails.status === 'IN_TEST' ? 'bg-info' :
                          currentTestCaseDetails.status === 'PASSED' ? 'bg-success' :
                          currentTestCaseDetails.status === 'FAILED' ? 'bg-danger' : 'bg-warning'
                        }`}>{currentTestCaseDetails.status === 'NOT_STARTED' ? 'Not Started' :
                         currentTestCaseDetails.status === 'IN_TEST' ? 'In Test' :
                         currentTestCaseDetails.status === 'PASSED' ? 'Passed' :
                         currentTestCaseDetails.status === 'FAILED' ? 'Failed' : 'Blocked'}</span></p>
                        <p><strong>Active Bugs:</strong> <span className="badge bg-danger">{
                          bugs.filter(bug => 
                            bug.test_case_id == currentTestCaseDetails.id && 
                            (bug.status !== 'RESOLVED' && bug.status !== 'CLOSED')
                          ).length
                        }</span></p>
                        <p><strong>Resolved Bugs:</strong> <span className="badge bg-success">{
                          bugs.filter(bug => 
                            bug.test_case_id == currentTestCaseDetails.id && 
                            (bug.status === 'RESOLVED' || bug.status === 'CLOSED')
                          ).length
                        }</span></p>
                        <p><strong>Completed At:</strong> {currentTestCaseDetails.completed_at ? new Date(currentTestCaseDetails.completed_at).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : modalType === 'bug-details' && currentBug ? (
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <h6 className="mb-3">Bug Details</h6>
                        <p><strong>ID:</strong> #{currentBug.id}</p>
                        <p><strong>Title:</strong> {currentBug.title}</p>
                        <p><strong>Description:</strong> {currentBug.description}</p>
                        <p><strong>Test Case:</strong> {currentBug.test_case_number ? `TC${currentBug.test_case_number}: ${currentBug.test_case_title}` : 'N/A'}</p>
                        <p><strong>Severity:</strong> <span className={`badge ${
                          currentBug.severity === 'LOW' ? 'bg-success' :
                          currentBug.severity === 'MEDIUM' ? 'bg-warning' :
                          currentBug.severity === 'HIGH' ? 'bg-danger' : 'bg-dark'
                        }`}>{currentBug.severity}</span></p>
                        <p><strong>Priority:</strong> <span className={`badge ${
                          currentBug.priority === 'LOW' ? 'bg-secondary' :
                          currentBug.priority === 'MEDIUM' ? 'bg-warning' :
                          currentBug.priority === 'HIGH' ? 'bg-danger' : 'bg-dark'
                        }`}>{currentBug.priority}</span></p>
                        <p><strong>Status:</strong> <span className={`badge ${
                          currentBug.status === 'NEW' ? 'bg-secondary' :
                          currentBug.status === 'CONFIRMED' ? 'bg-info' :
                          currentBug.status === 'IN_PROGRESS' ? 'bg-warning' :
                          currentBug.status === 'RESOLVED' ? 'bg-success' : 'bg-dark'
                        }`}>{currentBug.status}</span></p>
                        <p><strong>Reported By:</strong> {currentBug.reported_by_name}</p>
                        <p><strong>Reported At:</strong> {new Date(currentBug.created_at).toLocaleString()}</p>
                        <p><strong>Developer Status:</strong> <span className="badge bg-warning">{currentBug.developer_status || 'Not Assigned'}</span></p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Title <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={newBug.title}
                          onChange={(e) => setNewBug({...newBug, title: e.target.value})}
                          placeholder="Enter bug title"
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={newBug.description}
                          onChange={(e) => setNewBug({...newBug, description: e.target.value})}
                          placeholder="Enter bug description"
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Severity</label>
                        <select
                          className="form-select"
                          value={newBug.severity}
                          onChange={(e) => setNewBug({...newBug, severity: e.target.value})}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <select
                          className="form-select"
                          value={newBug.priority}
                          onChange={(e) => setNewBug({...newBug, priority: e.target.value})}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>
                    {newBug.test_case_id && (
                      <div className="col-12">
                        <div className="mb-3">
                          <label className="form-label">Related Test Case</label>
                          <div className="form-control-plaintext">
                            {(() => {
                              const testCase = testCases.find(tc => tc.id == newBug.test_case_id);
                              return testCase ? `TC${testCase.test_case_number}: ${testCase.title}` : 'Test case not found';
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Attachments (Optional)</label>
                        <input
                          type="file"
                          className="form-control"
                          multiple
                          onChange={(e) => {
                            setSelectedBugAttachments(Array.from(e.target.files));
                          }}
                          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,video/*,.mp4,.webm,.ogg,.mov,.avi,.wmv,.flv,.mkv,.3gp,.m4v"
                        />
                        <div className="form-text">
                          Attach files to support the bug report (images, PDF, DOC, XLS, MP4, WebM, OGG, MOV, AVI, etc.)
                        </div>
                        {selectedBugAttachments.length > 0 && (
                          <div className="mt-2">
                            <small className="text-muted">Selected files:</small>
                            <ul className="list-unstyled mt-1">
                              {selectedBugAttachments.map((file, index) => (
                                <li key={index} className="d-flex align-items-center gap-2">
                                  <i className="ri-file-line"></i>
                                  <span className="text-truncate" style={{ maxWidth: '300px' }}>{file.name}</span>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger p-0"
                                    onClick={() => {
                                      const newFiles = [...selectedBugAttachments];
                                      newFiles.splice(index, 1);
                                      setSelectedBugAttachments(newFiles);
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
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setModalType('');
                    setExpectedResultError(''); // Clear validation errors
                    setActualResultError('');
                    // Reset form based on modal type
                    if (modalType === 'test-case') {
                      setNewTestCase({
                        test_case_number: '',
                        title: '',
                        description: '',
                        expected_result: ''
                      });
                    } else if (modalType === 'test-case-action') {
                      setTestCaseAction('');
                      setTestCaseNotes('');
                      setCurrentTestCase(null);
                    } else if (modalType === 'bug-details') {
                      setCurrentBug(null);
                    } else if (modalType === 'test-case-details') {
                      setCurrentTestCaseDetails(null);
                    } else {
                      setNewBug({
                        title: '',
                        description: '',
                        severity: 'MEDIUM',
                        priority: 'MEDIUM',
                        test_case_id: ''
                      });
                    }
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSubmitModal}
                  disabled={modalType === 'bug-details' || modalType === 'test-case-details' || (modalType === 'bug' && isCreatingBug)}
                >
                  {isCreatingBug ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Bug...
                    </>
                  ) : (
                    modalType === 'test-case' ? 'Create Test Case' : 
                    modalType === 'test-case-action' ? 'Submit Action' : 
                    modalType === 'bug-details' || modalType === 'test-case-details' ? 'Close' : 'Report Bug'
                  )}
                </button>
              </div>
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
                      src={getAttachmentUrl(attachmentToView)} // Get the proper URL for image
                      alt={attachmentToView.file_name} 
                      className="img-fluid"
                      style={{ maxHeight: '70vh' }}
                    />
                  ) : attachmentToView.file_type.includes('video') || 
                      attachmentToView.file_type.includes('mp4') || 
                      attachmentToView.file_type.includes('webm') || 
                      attachmentToView.file_type.includes('ogg') ? (
                    <video 
                      src={getAttachmentUrl(attachmentToView)} // Get the proper URL for video
                      controls
                      className="img-fluid"
                      style={{ maxHeight: '70vh' }}
                    />
                  ) : attachmentToView.file_type.includes('pdf') || 
                      attachmentToView.file_type.includes('text') || 
                      attachmentToView.file_type.includes('plain') ? (
                    <iframe 
                      src={getAttachmentUrl(attachmentToView)} // Get the proper URL for PDF/text
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
              {/* Bug Statistics Section */}
           
              
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
                  
                  {/* Action Buttons - All in one row */}
                  <div className="row g-2 mb-3">
                    <div className="col-6 col-md-3">
                    <button 
                        className="btn btn-sm btn-outline-success w-100"
                      onClick={() => {
                        // Update test case to IN_TEST status
                        updateTestCase(selectedTestCase.id, { status: 'IN_TEST' });
                        setIsClosing(true);
                        setTimeout(() => {
                          setShowTestCaseSidebar(false);
                          setIsClosing(false);
                        }, 300); // Match the animation duration
                      }}
                      disabled={selectedTestCase.status !== 'NOT_STARTED' || (selectedTestCase.status === 'PASSED' && selectedTestCase.test_case_number !== 3)}
                    >
                      <i className="ri-play-line me-1"></i>
                      Start Test
                    </button>
                    </div>
                    <div className="col-6 col-md-3">
                    <button 
                        className="btn btn-sm btn-outline-info w-100"
                      onClick={() => {
                        // Open test case action modal
                        setModalType('test-case-action');
                        setCurrentTestCase(selectedTestCase);
                        setShowCreateModal(true);
                        setIsClosing(true);
                        setTimeout(() => {
                          setShowTestCaseSidebar(false);
                          setIsClosing(false);
                        }, 300); // Match the animation duration
                      }}
                      disabled={selectedTestCase.status === 'PASSED' && selectedTestCase.test_case_number !== 3}
                    >
                      <i className="ri-check-line me-1"></i>
                      Action
                    </button>
                    </div>
                    <div className="col-6 col-md-3">
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
                    <div className="col-6 col-md-3">
                    <button 
                        className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => {
                        // Report a bug for this test case
                        setModalType('bug');
                        setNewBug({...newBug, test_case_id: selectedTestCase.id});
                        setShowCreateModal(true);
                        setIsClosing(true);
                        setTimeout(() => {
                          setShowTestCaseSidebar(false);
                          setIsClosing(false);
                        }, 300); // Match the animation duration
                      }}
                      disabled={selectedTestCase.status === 'PASSED'}
                    >
                      <i className="ri-add-line me-1"></i>
                      Report Bug
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
        @media (max-width: 576px) {
          .modal[style*="width: 500px"] {
            width: 90vw !important;
            maxWidth: 90vw !important;
          }
        }
      `}</style>
      
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
              opacity: isClosing ? 0 : (showBugSidebar ? 1 : 0),
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
                setIsClosing(true);
                setTimeout(() => {
                  setShowBugSidebar(false);
                  setIsClosing(false);
                }, 300); // Match the animation duration
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
                      <label className="form-label fw-bold">Update Bug Status</label>
                      <div className="d-flex gap-2">
                        <select 
                          className="form-select"
                          value={selectedBugStatus}
                          onChange={(e) => {
                            setSelectedBugStatus(e.target.value);
                          }}
                          disabled={selectedBug.status === 'RESOLVED' || selectedBug.status === 'CLOSED'}
                        >
                          <option value="">Select Status</option>
                          <option value="NEW">New</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="REOPENED">Reopened</option>
                        </select>
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => {
                            // Update the status with the selected value
                            if (selectedBugStatus) {
                              updateBugStatus(selectedBug.id, { status: selectedBugStatus });
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
                      
                      <div>
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
                      </div>
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
                            selectedBug.status === 'RESOLVED' ? 'bg-success' : 'bg-dark'
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
                          {selectedBug.developer_status || 'pending'}</span>
                      </div>
                    </div>
                  </div>

                
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Bug Attachments Modal */}
      {showBugAttachmentsModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1051 }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentBugForAttachments && `Attachments for Bug #${currentBugForAttachments.id}: ${currentBugForAttachments.title}`}
                </h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowBugAttachmentsModal(false);
                  setCurrentBugAttachments([]);
                  setCurrentBugForAttachments(null);
                }}></button>
              </div>
              <div className="modal-body">
                {currentBugAttachments && currentBugAttachments.length > 0 ? (
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
                        {currentBugAttachments.map(attachment => (
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
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                  // Download attachment using proper function
                                  openAttachment(attachment);
                                }}
                              >
                                <i className="ri-download-line"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="ri-attachment-line ri-2x text-muted mb-3"></i>
                    <p className="text-muted mb-0">No attachments found for this bug.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowBugAttachmentsModal(false);
                  setCurrentBugAttachments([]);
                  setCurrentBugForAttachments(null);
                }}>
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

export default QATesterTaskDetailsPage;