import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmployeeDashboard from './EmployeeDashboard';

// Mock the ConfigContext
const mockConfigContext = {
  leadCrmUser: { id: 1, name: 'Test Employee' }
};

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn()
}));

// Mock ConfigContext
jest.mock('../../Context/ConfigContext', () => ({
  useConfig: () => mockConfigContext,
  ConfigContext: {
    Consumer: ({ children }) => children(mockConfigContext),
    Provider: ({ children }) => children
  }
}));

describe('EmployeeDashboard', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <EmployeeDashboard />
      </BrowserRouter>
    );
    
    // Check if the main heading is rendered
    expect(screen.getByText('Employee Dashboard')).toBeInTheDocument();
  });
});