import React from 'react';
import { Route } from 'react-router-dom';
import TeamLeaderDashboard from '../Pages/Dashboard/TeamLeaderDashboard';
import AssignedTasksPage from '../Pages/TeamLeader/AssignedTasksPage';
import TaskBreakdownPage from '../Pages/TeamLeader/TaskBreakdownPage';
import ViewTaskPage from '../Pages/TeamLeader/ViewTaskPage';


import TaskReviewPage from '../Pages/TeamLeader/TaskReviewPage';
import TeamLeaderTaskReviewDetailsPage from '../Pages/TeamLeader/TeamLeaderTaskReviewDetailsPage';
import MyTasksPage from '../Pages/TeamLeader/MyTasksPage';
import MyTaskUpdatePage from '../Pages/TeamLeader/MyTaskUpdatePage';

// Define the team leader routes as an array of route objects
const teamLeaderRoutes = [
  { path: "/team-leader/dashboard", element: <TeamLeaderDashboard /> },
  { path: "/team-leader/assigned-tasks", element: <AssignedTasksPage /> },
  { path: "/team-leader/my-tasks", element: <MyTasksPage /> },
  { path: "/team-leader/my-task/:taskId", element: <MyTaskUpdatePage /> },
  { path: "/team-leader/task/:taskId/breakdown", element: <TaskBreakdownPage /> },
  { path: "/team-leader/task/:taskId/view", element: <ViewTaskPage /> },
  { path: "/team-leader/task-review", element: <TaskReviewPage /> },
  { path: "/team-leader/task-review/:taskId", element: <TeamLeaderTaskReviewDetailsPage /> },
];

export default teamLeaderRoutes;