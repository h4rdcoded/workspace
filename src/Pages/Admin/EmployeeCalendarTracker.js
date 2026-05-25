import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../Context/ConfigContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { buildApiUrl, getAuthHeaders } from '../../config/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

const EmployeeCalendarTracker = () => {
  const { leadCrmUser } = useContext(ConfigContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State variables
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);

  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        buildApiUrl('/departments'),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setDepartments(response.data.data);
      } else {
        toast.error('Failed to load departments');
      }
    } catch (error) {
      toast.error('Error loading departments');
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch employees for a department
  const fetchEmployees = async (deptId) => {
    try {
      const response = await axios.get(
        buildApiUrl(`/departments/${deptId}/employees`),
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        const employeeData = response.data.data.employees || response.data.data;
        setEmployees(employeeData);
        setFilteredEmployees(employeeData);
        return employeeData;
      } else {
        toast.error('Failed to load employees');
        return [];
      }
    } catch (error) {
      toast.error('Error loading employees');
      console.error('Error fetching employees:', error);
      return [];
    }
  };

  // Fetch calendar data for an employee
  const fetchCalendarData = async (employeeId, month, year) => {
    setLoading(true);
    try {
      // Fetch all tasks for the employee (including daily routine tasks)
      const tasksResponse = await axios.get(
        buildApiUrl(`/tasks/user/${employeeId}`),
        { headers: getAuthHeaders() }
      );
      
      // Fetch all logs for the employee
      const logsResponse = await axios.get(
        buildApiUrl(`/tasks/logs/user/${employeeId}`),
        { headers: getAuthHeaders() }
      );
      
      if (tasksResponse.data.success && logsResponse.data.success) {
        // Process data to create calendar structure
        const processedData = processCalendarData(
          tasksResponse.data.data.tasks || tasksResponse.data.data,
          logsResponse.data.data.logs || logsResponse.data.data,
          month,
          year
        );
        setCalendarData(processedData);
      } else {
        toast.error('Failed to load calendar data');
      }
    } catch (error) {
      toast.error('Error loading calendar data');
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process calendar data to determine day colors
  const processCalendarData = (tasks, logs, month, year) => {
    const data = {};
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    // Get all days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create a map of logs by date for quick lookup
    const logsByDate = {};
    logs.forEach(log => {
      const logDate = new Date(log.created_at);
      const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
      if (!logsByDate[dateStr]) {
        logsByDate[dateStr] = [];
      }
      logsByDate[dateStr].push(log);
    });
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDate = new Date(year, month, day);
      
      // Check if this is a future date
      const isFutureDate = currentDate > today;
      
      // Check if this is a Sunday (day of week = 0)
      const dayOfWeek = currentDate.getDay();
      const isSunday = dayOfWeek === 0;
      
      if (isFutureDate) {
        // Gray color for future dates
        data[dateStr] = { color: 'gray', tasks: [], logs: logsByDate[dateStr] || [] };
      } else if (isSunday) {
        // Check if Sunday has any activity (tasks or logs)
        const logsForDate = logsByDate[dateStr] || [];
        const taskIdsWithLogs = new Set(logsForDate.map(log => log.task_id));
        
        // Filter tasks that are active on this date OR have logs
        const relevantTasks = tasks.filter(task => {
          const taskCreatedDate = new Date(task.created_at);
          taskCreatedDate.setHours(0, 0, 0, 0);
          const taskCompletedDate = task.completed_at ? new Date(task.completed_at) : null;
          if (taskCompletedDate) {
            taskCompletedDate.setHours(0, 0, 0, 0);
          }
          
          // Check if task is active or has logs
          const isActiveStatus = task.status === 'IN_PROGRESS';
          const isCreatedBeforeOrOnDate = taskCreatedDate <= currentDate;
          const isNotCompletedOrCompletedAfterDate = !taskCompletedDate || taskCompletedDate >= currentDate;
          const isActiveTask = isActiveStatus && isCreatedBeforeOrOnDate && isNotCompletedOrCompletedAfterDate;
          const hasLogs = taskIdsWithLogs.has(task.id);
          
          return isActiveTask || hasLogs;
        });
        
        const hasActivityOnSunday = relevantTasks.length > 0 || logsForDate.length > 0;
        
        // If Sunday has no activity, show as gray (holiday/idle)
        if (!hasActivityOnSunday) {
          data[dateStr] = { color: 'gray', tasks: [], logs: [] };
        } else {
          // If Sunday has activity, still show as gray for holiday indication but show the activity
          data[dateStr] = { color: 'gray', tasks: relevantTasks, logs: logsForDate };
        }
      } else {
        // Filter tasks that are active on this date OR tasks that have logs on this date
        // Include daily routine tasks specifically
        const relevantTasks = tasks.filter(task => {
          const taskCreatedDate = new Date(task.created_at);
          taskCreatedDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
          const taskCompletedDate = task.completed_at ? new Date(task.completed_at) : null;
          if (taskCompletedDate) {
            taskCompletedDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
          }
          
          // For daily routine tasks, they should only be active on their creation date
          if (task.task_type === 'DAILY_ROUTINE') {
            // Reset time part for comparison
            const createdDate = new Date(taskCreatedDate);
            createdDate.setHours(0, 0, 0, 0);
            const currentCompareDate = new Date(currentDate);
            currentCompareDate.setHours(0, 0, 0, 0);
            
            // Daily routine task is only active on its creation date
            const isCreatedOnThisDate = createdDate.getTime() === currentCompareDate.getTime();
            const isNotCompleted = !taskCompletedDate || new Date(taskCompletedDate) >= currentDate;
            
            // Check if task has logs on this specific date
            const logsForDate = logsByDate[dateStr] || [];
            const taskHasLogsOnThisDate = logsForDate.some(log => log.task_id === task.id);
            
            // Include daily routine task if:
            // 1. It was created on this date AND is not completed, OR
            // 2. It has logs on this specific date
            return (isCreatedOnThisDate && isNotCompleted) || taskHasLogsOnThisDate;
          }
          
          // For regular tasks, check if they were active on this date
          const isActiveStatus = task.status === 'IN_PROGRESS';
          const isCreatedBeforeOrOnDate = taskCreatedDate <= currentDate;
          const isNotCompletedOrCompletedAfterDate = !taskCompletedDate || taskCompletedDate >= currentDate;
          const isActiveTask = isActiveStatus && isCreatedBeforeOrOnDate && isNotCompletedOrCompletedAfterDate;
          
          // Check if task has logs on this specific date (this includes completed tasks)
          const logsForDate = logsByDate[dateStr] || [];
          const taskHasLogsOnThisDate = logsForDate.some(log => log.task_id === task.id);
          
          // Include task if:
          // 1. It's currently active (ASSIGNED, IN_PROGRESS, SUBMITTED) OR
          // 2. It has logs on this specific date (even if completed)
          return isActiveTask || taskHasLogsOnThisDate;
        });
        
        // Get logs for this date
        const logsForDate = logsByDate[dateStr] || [];
        
        // Always show all relevant tasks
        const finalTasksToShow = relevantTasks;
        
        // Determine color based on log status for all relevant tasks
        if (finalTasksToShow.length > 0) {
          // Check if logs exist for any of the relevant tasks on this date
          const taskIdsWithLogs = new Set(logsForDate.map(log => log.task_id));
          
          // Check if ALL tasks have logs written
          const allTasksHaveLogs = finalTasksToShow.length > 0 && 
            finalTasksToShow.every(task => taskIdsWithLogs.has(task.id));
          
          if (allTasksHaveLogs) {
            // Green: All tasks have logs written
            data[dateStr] = { color: 'green', tasks: finalTasksToShow, logs: logsForDate };
          } else {
            // Red: Not all tasks have logs written (some or none)
            data[dateStr] = { color: 'red', tasks: finalTasksToShow, logs: logsForDate };
          }
        } else {
          // Yellow: No relevant tasks for this date
          // But check if there are logs for this date (which might be from completed tasks)
          if (logsForDate.length > 0) {
            // Show logs even if no active tasks
            data[dateStr] = { color: 'yellow', tasks: [], logs: logsForDate };
          } else {
            // No tasks and no logs
            data[dateStr] = { color: 'yellow', tasks: [], logs: logsForDate };
          }
        }
      }
    }
    
    return data;
  };

  // Handle department selection
  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setSelectedDepartment(deptId);
    setSelectedEmployee('');
    setEmployees([]);
    setCalendarData({});
    
    if (deptId) {
      fetchEmployees(deptId);
    }
  };

  // Handle employee selection
  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setSelectedEmployee(empId);
    
    if (empId) {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      fetchCalendarData(empId, month, year);
    }
  };

  // Handle date change (month navigation)
  const handleDateChange = (date) => {
    const newDate = new Date(date[0]);
    setCurrentDate(newDate);
    
    if (selectedEmployee) {
      const month = newDate.getMonth();
      const year = newDate.getFullYear();
      fetchCalendarData(selectedEmployee, month, year);
    }
  };

  // Handle search input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 0) {
      const filtered = employees.filter(employee =>
        employee.name.toLowerCase().includes(query.toLowerCase()) ||
        employee.email.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEmployees(filtered);
      setShowDropdown(true);
    } else {
      setFilteredEmployees(employees);
      setShowDropdown(false);
    }
  };

  // Handle employee selection from search dropdown
  const handleSelectEmployee = (employee) => {
    setSearchQuery(employee.name);
    setSelectedEmployee(employee.user_id || employee.id);
    setShowDropdown(false);
    
    // Set department based on selected employee
    if (employee.department_id) {
      setSelectedDepartment(employee.department_id.toString());
    }
    
    // Load calendar data
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    fetchCalendarData(employee.user_id || employee.id, month, year);
  };

  // Handle day click
  const handleDayClick = (dateStr, dayData) => {
    if (dayData && (dayData.tasks.length > 0 || dayData.logs.length > 0)) {
      setTaskDetails({
        date: dateStr,
        tasks: dayData.tasks,
        logs: dayData.logs
      });
    }
  };

  // Close task details modal
  const closeTaskDetails = () => {
    setTaskDetails(null);
  };

  // Navigate to task details page
  const viewTaskDetails = (taskId) => {
   
    navigate(`/admin/task_approvel/${taskId}`);
  };

  // Calculate total time spent from logs
  const calculateTotalTime = (logs) => {
    return logs.reduce((total, log) => total + (parseInt(log.time_spent) || 0), 0);
  };

  // Format time in hours and minutes
  const formatTime = (totalMinutes) => {
    if (!totalMinutes || totalMinutes === 0) return null;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeFromParams = async () => {
      await fetchDepartments();
      
      // Check for URL parameters and auto-select employee/department if provided
      const employeeId = searchParams.get('employeeId');
      const departmentId = searchParams.get('departmentId');
      const month = searchParams.get('month');
      const year = searchParams.get('year');
      
      // Set date if provided
      if (month && year) {
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        setCurrentDate(date);
      }
      
      // Set department if provided
      if (departmentId) {
        setSelectedDepartment(departmentId);
        const employeeData = await fetchEmployees(departmentId);
        
        // Set employee if provided
        if (employeeId && employeeData.length > 0) {
          // Find the employee in the list
          const employee = employeeData.find(emp => 
            (emp.user_id || emp.id)?.toString() === employeeId.toString()
          );
          
          if (employee) {
            handleSelectEmployee(employee);
          }
        }
      }
    };
    
    initializeFromParams();
  }, []);

  // Update filtered employees when employees change
  useEffect(() => {
    setFilteredEmployees(employees);
  }, [employees]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    handleDateChange([newDate]);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    handleDateChange([newDate]);
  };

  // Generate calendar view
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create calendar grid
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendarData[dateStr];
      
      let dayClass = "calendar-day";
      if (dayData) {
        dayClass += ` ${dayData.color}-day`;
      }
      
      // Calculate total time spent for this day
      const totalTimeMinutes = dayData && dayData.logs ? calculateTotalTime(dayData.logs) : 0;
      const formattedTime = formatTime(totalTimeMinutes);
      const tasksCount = dayData && dayData.tasks ? dayData.tasks.length : 0;
      const logsCount = dayData && dayData.logs ? dayData.logs.length : 0;
      const hasActivity = tasksCount > 0 || logsCount > 0;
      
      calendarDays.push(
        <div 
          key={day} 
          className={dayClass}
          onClick={() => handleDayClick(dateStr, dayData)}
        >
          <span className="day-number">{day}</span>
          {hasActivity && (
            <div className="day-activity-info">
              {tasksCount > 0 && (
                <div className="activity-item">
                  <i className="ri-task-line"></i>
                  <span>{tasksCount} {tasksCount === 1 ? 'task' : 'tasks'}</span>
                </div>
              )}
              {logsCount > 0 && (
                <div className="activity-item">
                  <i className="ri-file-list-line"></i>
                  <span>{logsCount} {logsCount === 1 ? 'log' : 'logs'}</span>
                </div>
              )}
              {formattedTime && (
                <div className="activity-item ">
                  <i className="ri-time-line"></i>
                  <span>{formattedTime}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return calendarDays;
  };

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
                      <h4 className="mb-0">Employee Calendar Tracker</h4>
                      <p className="text-muted mb-0">Track employee task logs and activities</p>
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

              {/* Controls */}
              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-4 mb-3">
                  <label className="form-label">Employee</label>
                  <select
                    className="form-select"
                    value={selectedEmployee}
                    onChange={handleEmployeeChange}
                    disabled={!selectedDepartment}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.user_id || emp.id} value={emp.user_id || emp.id}>
                        {emp.name} 
                      </option>
                    ))} 
                  </select>
                </div>
                
                <div className="col-md-4 mb-3">
                  <label className="form-label">Search Employee</label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search employee by name or email"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => searchQuery && setShowDropdown(true)}
                    />
                    {showDropdown && filteredEmployees.length > 0 && (
                      <div className="dropdown-menu show w-100 position-absolute mt-1" style={{ zIndex: 1000 }}>
                        {filteredEmployees.map(emp => (
                          <button
                            key={emp.user_id || emp.id}
                            className="dropdown-item"
                            onClick={() => handleSelectEmployee(emp)}
                          >
                            {emp.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Calendar Controls */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <button className="btn btn-outline-primary navigation-btn" onClick={goToPreviousMonth}>
                          <i className="ri-arrow-left-s-line"></i>
                        </button>
                        <h5 className="mb-0">
                          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h5>
                        <button className="btn btn-outline-primary navigation-btn" onClick={goToNextMonth}>
                          <i className="ri-arrow-right-s-line"></i>
                        </button>
                        <div className="d-flex gap-2">
                          <Flatpickr
                            value={currentDate}
                            onChange={handleDateChange}
                            options={{
                              dateFormat: "F Y",
                              altInput: true,
                              altFormat: "F Y",
                              mode: "single"
                            }}
                            className="form-control"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>



 {/* Employee Name Display */}
                          {selectedEmployee && (
                            <div className="employee-name-display">
                            {
                                employees.find(emp => 
                                  (emp.user_id || emp.id) == selectedEmployee
                                )?.name || 'Unknown Employee'
                              }
                            </div>
                          )}
                          





              {/* Calendar */}
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div className="card-body">
                      {loading ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2">Loading calendar data...</p>
                        </div>
                      ) : selectedEmployee ? (
                        <div className="calendar-container">
                          <div className="calendar-grid">
                            <div className="calendar-header">
                              <div className="calendar-day-header">Sunday</div>
                              <div className="calendar-day-header">Monday</div>
                              <div className="calendar-day-header">Tuesday</div>
                              <div className="calendar-day-header">Wednesday</div>
                              <div className="calendar-day-header">Thursday</div>
                              <div className="calendar-day-header">Friday</div>
                              <div className="calendar-day-header">Saturday</div>
                            </div>
                            <div className="calendar-body">
                              {renderCalendar()}
                            </div>
                          </div>
                          
                          {/* Legend */}
                          <div className="calendar-legend mt-4">
                            <div className="d-flex flex-wrap justify-content-center">
                              <div className="legend-item">
                                <div className="legend-color gray-day"></div>
                                <span>Future Dates</span>
                              </div>
                              <div className="legend-item">
                                <div className="legend-color green-day"></div>
                                <span>Tasks with Logs</span>
                              </div>
                              <div className="legend-item">
                                <div className="legend-color red-day"></div>
                                <span>Tasks without Logs</span>
                              </div>
                              <div className="legend-item">
                                <div className="legend-color yellow-day"></div>
                                <span>No Tasks</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i className="ri-calendar-line display-4 text-muted"></i>
                          <h5 className="mt-3">Select an Employee</h5>
                          <p className="text-muted">Please select a department and employee to view their calendar</p>
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

      {/* Task Details Modal */}
      {taskDetails && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Task Details for {taskDetails.date}</h5>
                <button type="button" className="btn-close" onClick={closeTaskDetails}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-12">
                    <h6>Tasks ({taskDetails.tasks.length})</h6>
                    {taskDetails.tasks.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Task Title</th>
                              <th>Status</th>
                              <th>Priority</th>
                              <th>Logs Written</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {taskDetails.tasks.map(task => {
                              // Check if logs exist for this task on this date
                              const taskLogs = taskDetails.logs.filter(log => log.task_id === task.id);
                              const hasLogs = taskLogs.length > 0;
                              
                              return (
                                <tr key={task.id}>
                                  <td>{task.title}</td>
                                  <td>
                                    <span className={`badge ${
                                      task.status === 'COMPLETED' ? 'bg-success' :
                                      task.status === 'IN_PROGRESS' ? 'bg-warning' :
                                      task.status === 'ASSIGNED' ? 'bg-info' : 'bg-secondary'
                                    }`}>
                                      {task.status}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      task.priority === 'HIGH' ? 'bg-danger' :
                                      task.priority === 'MEDIUM' ? 'bg-warning' : 'bg-secondary'
                                    }`}>
                                      {task.priority}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      hasLogs ? 'bg-success' : 'bg-danger'
                                    }`}>
                                      {hasLogs ? 'Yes' : 'No'}
                                    </span>
                                    {hasLogs && (
                                      <span className="ms-2">({taskLogs.length} log{taskLogs.length !== 1 ? 's' : ''})</span>
                                    )}
                                  </td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => viewTaskDetails(task.id)}
                                    >
                                      <i className="ri-eye-line me-1"></i>
                                      View
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted">No tasks found for this date.</p>
                    )}
                  </div>
                  
                  <div className="col-12 mt-4">
                    <h6>Logs ({taskDetails.logs.length})</h6>
                    <p>Total Time Spent: {Math.floor(calculateTotalTime(taskDetails.logs) / 60)} hours {calculateTotalTime(taskDetails.logs) % 60} minutes</p>
                    {taskDetails.logs.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Work Done</th>
                              <th>Time Spent</th>
                              <th>Task</th>
                            </tr>
                          </thead>
                          <tbody>
                            {taskDetails.logs.map(log => (
                              <tr key={log.id}>
                                <td>{log.work_done}</td>
                                <td>{Math.floor(log.time_spent / 60)}h {log.time_spent % 60}m</td>
                                <td>{log.task_title}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted">No logs found for this date.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeTaskDetails}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .calendar-container {
          padding: 20px;
        }
        
        .calendar-grid {
          display: grid;
          grid-template-rows: auto 1fr;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        
        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: bold;
          padding: 15px 0;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          color: #212529;
        }
        
        [data-bs-theme="dark"] .calendar-header {
          background-color: #2b3035;
          border-bottom: 1px solid #495057;
          color: #f8f9fa;
        }
        
        .calendar-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          padding: 8px;
          background-color: transparent;
        }
        
        .calendar-day-header {
          padding: 10px 0;
          color: #495057;
          font-weight: 600;
        }
        
        [data-bs-theme="dark"] .calendar-day-header {
          color: #f8f9fa;
        }
        
        .calendar-day {
          min-height: 140px;
          background-color: #ffffff;
          padding: 10px;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
        }
        
        [data-bs-theme="dark"] .calendar-day {
          background-color: #2b3035;
        }
        
        .calendar-day:hover {
          background-color: #f8f9fa;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        [data-bs-theme="dark"] .calendar-day:hover {
          background-color: #343a40;
        }
        
        .calendar-day.empty {
          background-color: #f8f9fa;
          cursor: default;
          opacity: 0.6;
        }
        
        [data-bs-theme="dark"] .calendar-day.empty {
          background-color: #343a40;
        }
        
        .calendar-day.empty:hover {
          background-color: #f8f9fa;
          transform: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        [data-bs-theme="dark"] .calendar-day.empty:hover {
          background-color: #343a40;
        }
        
        .day-number {
          font-weight: bold;
          font-size: 1.1em;
          color: #495057;
          margin-bottom: 4px;
        }
        
        [data-bs-theme="dark"] .day-number {
          color: #f8f9fa;
        }
        
        .gray-day {
          background-color: rgba(220, 220, 220, 0.5) !important;
        }
        
        [data-bs-theme="dark"] .gray-day {
          background-color: rgba(108, 117, 125, 0.5) !important;
        }
        
        .green-day {
          background-color: rgba(40, 167, 69, 0.6) !important;
        }
        
        [data-bs-theme="dark"] .green-day {
          background-color: rgba(40, 167, 69, 0.6) !important;
        }
        
        .red-day {
          background-color: rgba(220, 53, 69, 0.7) !important;
        }
        
        [data-bs-theme="dark"] .red-day {
          background-color: rgba(220, 53, 69, 0.6) !important;
        }
        
        .yellow-day {
          background-color: rgba(255, 193, 7, 0.5) !important;
        }
        
        [data-bs-theme="dark"] .yellow-day {
          background-color: rgba(255, 193, 7, 0.5) !important;
        }
        
        .day-activity-info {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }
        
        .activity-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75em;
          font-weight: 600;
          color: #495057;
          padding: 3px 6px;
          background-color: rgba(255, 255, 255, 0.85);
          border-radius: 4px;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        
        .activity-item i {
          font-size: 0.9em;
          color: #6c757d;
        }
        
        .activity-item.time-item {
          background-color: rgba(13, 110, 253, 0.15);
          color: #0d6efd;
        }
        
        .activity-item.time-item i {
          color: #0d6efd;
        }
        
        [data-bs-theme="dark"] .activity-item {
          color: #f8f9fa;
          background-color: rgba(0, 0, 0, 0.4);
        }
        
        [data-bs-theme="dark"] .activity-item i {
          color: #adb5bd;
        }
        
        [data-bs-theme="dark"] .activity-item.time-item {
          background-color: rgba(13, 110, 253, 0.3);
          color: #6ea8fe;
        }
        
        [data-bs-theme="dark"] .activity-item.time-item i {
          color: #6ea8fe;
        }
        
        .calendar-day:hover .activity-item {
          background-color: rgba(255, 255, 255, 0.95);
          transform: translateX(2px);
        }
        
        [data-bs-theme="dark"] .calendar-day:hover .activity-item {
          background-color: rgba(0, 0, 0, 0.5);
        }
        
        .calendar-day:hover .activity-item.time-item {
          background-color: rgba(13, 110, 253, 0.25);
        }
        
        [data-bs-theme="dark"] .calendar-day:hover .activity-item.time-item {
          background-color: rgba(13, 110, 253, 0.4);
        }
        
        .calendar-legend {
          display: flex;
          justify-content: center;
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        
        [data-bs-theme="dark"] .calendar-legend {
          background-color: #2b3035;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          margin: 0 15px;
        }
        
        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          margin-right: 8px;
        }
        
        .gray-day.legend-color {
          background-color: rgba(220, 220, 220, 0.8);
          border: 1px solid rgba(200, 200, 200, 0.8);
        }
        
        [data-bs-theme="dark"] .gray-day.legend-color {
          background-color: rgba(108, 117, 125, 0.8);
          border: 1px solid rgba(120, 129, 134, 0.8);
        }
        
        .green-day.legend-color {
          background-color: rgba(40, 167, 69, 0.8);
          border: 1px solid rgba(45, 180, 75, 0.8);
        }
        
        [data-bs-theme="dark"] .green-day.legend-color {
          background-color: rgba(40, 167, 69, 0.8);
          border: 1px solid rgba(45, 180, 75, 0.8);
        }
        
        .red-day.legend-color {
          background-color: rgba(220, 53, 69, 0.8);
          border: 1px solid rgba(230, 60, 75, 0.8);
        }
        
        [data-bs-theme="dark"] .red-day.legend-color {
          background-color: rgba(220, 53, 69, 0.8);
          border: 1px solid rgba(230, 60, 75, 0.8);
        }
        
        .yellow-day.legend-color {
          background-color: rgba(255, 193, 7, 0.8);
          border: 1px solid rgba(255, 200, 10, 0.8);
        }
        
        [data-bs-theme="dark"] .yellow-day.legend-color {
          background-color: rgba(255, 193, 7, 0.8);
          border: 1px solid rgba(255, 200, 10, 0.8);
        }
        
        .navigation-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .employee-name-display {
          text-align: center;
          margin-top: 15px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 8px;
          font-weight: 500;
        }
        
        [data-bs-theme="dark"] .employee-name-display {
          background-color: #2b3035;
          color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default EmployeeCalendarTracker;