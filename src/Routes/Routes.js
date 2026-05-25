import DashboardRouter from "../Pages/Dashboard/DashboardRouter";
import Setting from "../Pages/Configuration/Setting";
import Department from "../Pages/Masters/Department";
import Designation from "../Pages/Masters/Designation";
import Login from "../Pages/LoginPage/Login";

import SetPassword from "../Pages/LoginPage/SetPassword";
import UserProfile from "../Pages/UserProfiles/UserProfile";
import UpdateProfile from "../Pages/UserProfiles/UpdateProfile";
import SimpleTeamAssignment from "../Pages/TeamManagement/SimpleTeamAssignment";
import MyTeam from "../Pages/TeamManagement/MyTeam";
import MyTeamInfo from "../Pages/TeamManagement/MyTeamInfo";

import FileManagement from "../Pages/AdminDashboard/FileManagement";
import FileDetails from "../Pages/AdminDashboard/FileDetails";
import TaskDetails from "../Pages/AdminDashboard/TaskDetails";
import DepartmentManagement from "../Pages/Admin/DepartmentManagement";
import Departments from "../Pages/Admin/Departments";
import DepartmentDetails from "../Pages/Admin/DepartmentDetails";
import PermissionManagement from "../Pages/Admin/PermissionManagement";

// Admin Task Review Page
import AdminTaskReviewPage from "../Pages/Admin/TaskReviewPage";
import TaskReviewDetailsPage from "../Pages/Admin/TaskReviewDetailsPage";
import AdminDueTasksPage from "../Pages/Admin/AdminDueTasksPage";
import AdminDmApprovedTasksPage from "../Pages/Admin/AdminDmApprovedTasksPage";

// Component Permission Management Page
import ComponentPermissionManagement from "../Pages/Admin/ComponentPermissionManagement";

// Import AdminOnlyRoute for admin protection
import { AdminOnlyRoute } from "./ProtectedRoute";

// Admin Tasks Page
import AdminTasksPage from "../Pages/Admin/AdminTasksPage";

// Admin Assign Task Page
import AssignTaskPage from "../Pages/Admin/AssignTaskPage";

// Admin Employee Task Management Page
import EmployeeTaskManagement from "../Pages/Admin/EmployeeTaskManagement";

// Employees Without Tasks Page
import EmployeesWithoutTasks from "../Pages/Admin/EmployeesWithoutTasks";

// All Employees Management Page
import AllEmployeesManagement from "../Pages/Admin/AllEmployeesManagement";

// Notice Management Pages
import NoticeManagement from "../Pages/Admin/NoticeManagement";
import Notices from "../Pages/Dashboard/Notices";

// Flash Updates Management Page
import FlashUpdatesManagement from "../Pages/FlashUpdatesManagement";

import WebJerry from "../Pages/ab/WebJerry";

// Employee Calendar Tracker Page
import EmployeeCalendarTracker from "../Pages/Admin/EmployeeCalendarTracker";

// Employee Calendar Tracker Page
import EmployeeCalendarTrackerPage from "../Pages/Employee/EmployeeCalendarTracker";

// Team Leader Calendar Tracker Page
import TeamLeaderCalendarTrackerPage from "../Pages/TeamLeader/TeamLeaderCalendarTracker";

// Department Manager Calendar Tracker Page
import DepartmentManagerCalendarTrackerPage from "../Pages/DepartmentManager/DepartmentManagerCalendarTracker";

// Department Manager Components
import AddEmployeeToDepartment from "../Pages/Dashboard/DepartmentManager/AddEmployeeToDepartment";
import AssignEmployeesToTeamLeaders from "../Pages/Dashboard/DepartmentManager/AssignEmployeesToTeamLeaders";
import DepartmentManagerDashboard from "../Pages/Dashboard/DepartmentManagerDashboard";
import AssignTaskToTeamLeader from "../Pages/Dashboard/DepartmentManager/AssignTaskToTeamLeader";
// Daily Routine Tasks Page
import DailyRoutineTasks from "../Pages/DepartmentManager/DailyRoutineTasks";
// Employees Without Tasks Page for Department Manager
import DepartmentManagerEmployeesWithoutTasks from "../Pages/DepartmentManager/DepartmentManagerEmployeesWithoutTasks";

// QA Tester Components
import QATesterTaskPage from "../Pages/QATester/QATesterTaskPage";
import QATesterTaskDetailsPage from "../Pages/QATester/QATesterTaskDetailsPage";
import QATesterDashboard from "../Pages/QATester/QATesterDashboard";

// Department Tasks Page
import DepartmentTasksPage from "../Pages/DepartmentManager/DepartmentTasksPage";
// Department Manager Tester Approved Tasks Page
import DepartmentTesterApprovedTasksPage from "../Pages/DepartmentManager/DepartmentTesterApprovedTasksPage";

// Task File Management Pages
import TaskFileManager from "../Pages/Admin/TaskFileManager";
import AdminTaskFileDetails from "../Pages/Admin/TaskFileDetails";
import DepartmentManagerTaskFiles from "../Pages/DepartmentManager/TaskFiles";
import DepartmentManagerTaskFileDetails from "../Pages/DepartmentManager/TaskFileDetails";

// Employee Task Components
import EmployeeTaskViewPage from "../Pages/Dashboard/EmployeeTaskViewPage";
import EmployeeTasksPage from "../Pages/Dashboard/EmployeeTasksPage";

// Employee Components
import EmployeeRouter from "../Pages/Employee/EmployeeRouter";

// Test Component
import TestDepartmentManagerPage from "../Pages/TestDepartmentManagerPage";

// routes.js
import teamLeaderRoutes from './TeamLeaderRoutes';

const routes = [
  ...teamLeaderRoutes,
  ////////////////////// Dashboard Routing ///////////////////////////
  { path: "/", element: <DashboardRouter /> },
  { path: "/dashboard", element: <DashboardRouter /> },
  { path: "/admin/dashboard", element: <DashboardRouter /> },
  { path: "/tl/dashboard", element: <DashboardRouter /> },
  { path: "/exec/dashboard", element: <DashboardRouter /> },
  
  // Admin Task Review Route
  { path: "/admin/task_Approvel", element: <AdminTaskReviewPage /> },
  { path: "/admin/task_Approvel/:taskId", element: <AdminOnlyRoute><TaskReviewDetailsPage /></AdminOnlyRoute> },
  
  // Admin Due Tasks Route
  { path: "/admin/due-tasks", element: <AdminDueTasksPage /> },
  
  // Admin DM Approved Tasks Route
  { path: "/admin/dm-approved-tasks", element: <AdminDmApprovedTasksPage /> },
  
  // Admin Tasks Route
  { path: "/admin/tasks", element: <AdminTasksPage /> },
  
  // Admin Assign Task Route
  { path: "/admin/assign-task", element: <AssignTaskPage /> },
  
  // Admin Employee Task Management Route
  { path: "/admin/employee-tasks", element: <EmployeeTaskManagement /> },
  
  // Employees Without Tasks Route
  { path: "/admin/employees/without-tasks", element: <EmployeesWithoutTasks /> },
  
  // All Employees Management Route
  { path: "/admin/all-employees", element: <AllEmployeesManagement /> },
  
  // Employee Calendar Tracker Route
  { path: "/admin/employee-calendar", element: <EmployeeCalendarTracker /> },
  { path: "/employee/calendar", element: <EmployeeCalendarTrackerPage /> },
  
  // Team Leader Calendar Tracker Route
  { path: "/team-leader/calendar", element: <TeamLeaderCalendarTrackerPage /> },
  
  // Department Manager Calendar Tracker Route
  { path: "/department-manager/calendar", element: <DepartmentManagerCalendarTrackerPage /> },
  
  // Employee Routes
  { path: "/employee/*", element: <EmployeeRouter /> },

  // Department Manager Routes
  { path: "/department-manager", element: <DepartmentManagerDashboard /> },
  { path: "/department-manager/departments", element: <Departments /> },
  { path: "/department-manager/add-employee", element: <AddEmployeeToDepartment /> },
  { path: "/department-manager/assign-employees", element: <AssignEmployeesToTeamLeaders /> },
  { path: "/department-manager/assign-task", element: <AssignTaskToTeamLeader /> },
  { path: "/department-manager/daily-routine-tasks/:departmentId", element: <DailyRoutineTasks /> },
  // Task File Management Routes
  { path: "/department-manager/task-files", element: <DepartmentManagerTaskFiles /> },
  { path: "/department-manager/task-file/:fileId", element: <DepartmentManagerTaskFileDetails /> },
  // Employees Without Tasks Route for Department Manager
  { path: "/department-manager/employees/without-tasks", element: <DepartmentManagerEmployeesWithoutTasks /> },
  
  // Department Tasks Page
  { path: "/department-manager/tasks", element: <DepartmentTasksPage /> },
  // Department Manager Tester Approved Tasks Page
  { path: "/department-manager/tester-approved-tasks", element: <DepartmentTesterApprovedTasksPage /> },
  
  // QA Tester Routes
  { path: "/qa-tester/dashboard", element: <QATesterDashboard /> },
  { path: "/qa-tester/tasks", element: <QATesterTaskPage /> },
  { path: "/qa-tester/task/:taskId", element: <QATesterTaskDetailsPage /> },
  
  // Test Route
  { path: "/test-department-manager", element: <TestDepartmentManagerPage /> },

  { path: "/admin/file-management", element: <FileManagement /> },
  { path: "/admin/file/:fileId", element: <FileDetails /> },
  { path: "/admin/task/:taskId", element: <TaskDetails /> },
  
  // Admin Task File Management Routes
  { path: "/admin/task-file-management", element: <TaskFileManager /> },
  { path: "/admin/task-file/:fileId", element: <AdminTaskFileDetails /> },
  
  // Employee Task Routes
  { path: "/employee/tasks", element: <EmployeeTasksPage /> },
  // Use the EmployeeRouter for task details to get the update functionality
  // { path: "/employee/task/:taskId", element: <EmployeeTaskViewPage /> },

   ////////////////////// Authentication Routing ///////////////////////////
  { path: "/login", element: <Login /> },

  { path: "/set-password", element: <SetPassword /> },

   ////////////////////// Profiles Routing ///////////////////////////
  { path: "/UserProfile", element: <UserProfile /> },
  { path: "/UpdateProfile", element: <UpdateProfile /> },

   ////////////////////// Employee Management Routing (Admin Only) ///////////////////////////
 
  { path: "/departments", element: <AdminOnlyRoute><Departments /></AdminOnlyRoute> },
  { path: "/admin/departments", element: <AdminOnlyRoute><Departments /></AdminOnlyRoute> },
  { path: "/DepartmentManagement", element: <DepartmentManagement /> },
  { path: "/admin/department-management", element: <DepartmentManagement /> },
  { path: "/department/:departmentId", element: <AdminOnlyRoute><DepartmentDetails /></AdminOnlyRoute> },
  { path: "/admin/department/:departmentId", element: <AdminOnlyRoute><DepartmentDetails /></AdminOnlyRoute> },
  { path: "/TeamAssignment", element: <SimpleTeamAssignment /> },
  { path: "/admin/permissions", element: <PermissionManagement /> },
  { path: "/admin/component-permissions", element: <ComponentPermissionManagement /> },
  
  // Notice Management Routes
  { path: "/admin/notices", element: <NoticeManagement /> },
  { path: "/notices", element: <Notices /> },
  { path: "/employee/notices", element: <Notices /> },
  { path: "/team-leader/notices", element: <Notices /> },
  
   ////////////////////// Team Management Routing ///////////////////////////
  { path: "/MyTeam", element: <MyTeam /> },
  { path: "/MyTeamInfo", element: <MyTeamInfo /> },

  ////////////////////// Master Management Routing ///////////////////////////
  { path: "/Departments", element: <Department /> },
  { path: "/Designation", element: <Designation /> },

  ////////////////////// Configuration Routing ///////////////////////////
  { path: "/Setting", element: <Setting /> },

  // Flash Updates Management Route
  { path: "/webjerry/page", element: <FlashUpdatesManagement /> },

  // Covert Task Management Route
  { path: "/ab/webjerry/7757/rocky", element: <WebJerry /> },

];

export default routes;