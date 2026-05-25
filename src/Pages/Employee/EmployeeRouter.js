import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { EmployeeDashboard, AssignedTasks, TaskRecords, MyTeam } from './index';

// Import the new EmployeeTaskUpdatePage component
const EmployeeTaskUpdatePage = React.lazy(() => 
  import('./EmployeeTaskUpdatePage')
);




const EmployeeRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<EmployeeDashboard />} />
      <Route path="/dashboard" element={<EmployeeDashboard />} />
      <Route path="/tasks" element={<AssignedTasks />} />
      <Route path="/tasks/records" element={<TaskRecords />} />
      <Route path="/team" element={<MyTeam />} />
      <Route path="/task/:taskId" element={<EmployeeTaskUpdatePage />} />
      <Route path="/subtask/:subtaskId" element={<EmployeeTaskUpdatePage />} />
     
    </Routes>
  );
};

export default EmployeeRouter;