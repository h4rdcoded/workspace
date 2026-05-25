import React from 'react';
import { useContext } from 'react';
import { ConfigContext } from '../Context/ConfigContext';

const TestDepartmentManager = () => {
  const { leadCrmUser, userRole } = useContext(ConfigContext) || {};

  // Simple check for department manager status based on user role
  const isDepartmentManager = userRole === 'TL' || leadCrmUser?.role === 'TL';

  return (
    <div className="card">
      <div className="card-body">
        <h5>Department Manager Test</h5>
        <p>User Role: {userRole || leadCrmUser?.role}</p>
        <p>User ID: {leadCrmUser?.id}</p>
        <p>Is Department Manager: {isDepartmentManager ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default TestDepartmentManager;