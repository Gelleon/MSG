import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from './page';
import api from '@/lib/api';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/components/LanguageSwitcher', () => {
  return function DummyLanguageSwitcher() {
    return <div data-testid="language-switcher">LanguageSwitcher</div>;
  };
});

jest.mock('@/lib/api', () => ({
  post: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(<ForgotPasswordPage />);
    
    expect(screen.getByText('forgotPasswordTitle')).toBeInTheDocument();
    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.getByText('sendResetLink')).toBeInTheDocument();
  });

  it('handles input change', () => {
    render(<ForgotPasswordPage />);
    
    const input = screen.getByLabelText('email') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(input.value).toBe('test@example.com');
  });

  it('submits the form successfully', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    
    render(<ForgotPasswordPage />);
    
    const input = screen.getByLabelText('email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    const button = screen.getByText('sendResetLink');
    fireEvent.click(button);
    
    expect(screen.getByText('loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@example.com' });
      expect(screen.getByText('resetLinkSent')).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith('resetLinkSent');
    });
  });

  it('handles 404 error correctly', async () => {
    const error = {
      response: {
        status: 404,
        data: { message: 'Not Found' }
      }
    };
    (api.post as jest.Mock).mockRejectedValueOnce(error);
    
    render(<ForgotPasswordPage />);
    
    const input = screen.getByLabelText('email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    const button = screen.getByText('sendResetLink');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Endpoint not found (404). Please contact support.');
    });
  });

  it('handles 400 error correctly', async () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Invalid email' }
      }
    };
    (api.post as jest.Mock).mockRejectedValueOnce(error);
    
    render(<ForgotPasswordPage />);
    
    const input = screen.getByLabelText('email');
    fireEvent.change(input, { target: { value: 'invalid@example.com' } });
    
    const button = screen.getByText('sendResetLink');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    const [firstArg] = (toast.error as jest.Mock).mock.calls[0];
    expect(['Invalid email', 'Bad request. Please check your email.']).toContain(firstArg);
  });
});
