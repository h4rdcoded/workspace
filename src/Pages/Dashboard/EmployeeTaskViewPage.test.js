import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmployeeTaskViewPage from './EmployeeTaskViewPage';

// Mock the ConfigContext
const mockConfigContext = {
  leadCrmUser: { id: 1, name: 'Test Employee' }
};

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ taskId: '1' }),
  useNavigate: () => jest.fn()
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn()
}));

describe('EmployeeTaskViewPage', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <EmployeeTaskViewPage />
      </BrowserRouter>
    );
    
    // Check if the main heading is rendered
    expect(screen.getByText('Task Details')).toBeInTheDocument();
  });
});