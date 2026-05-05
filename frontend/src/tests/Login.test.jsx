import { render, screen } from '@testing-library/react';
import Login from '../pages/Login';

describe('Login Component', () => {
  it('renders email and password inputs', () => {
    render(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
