import { render, screen } from '@testing-library/react';
import ChatHeader from '../ChatHeader';
import { useChatStore } from '@/lib/chat-store';
import { useAuthStore } from '@/lib/store';

// Mock stores
jest.mock('@/lib/chat-store');
jest.mock('@/lib/store');
jest.mock('@/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => '/dashboard',
}));
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

describe('ChatHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render "Private" button when room is private', () => {
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      rooms: [{ id: '1', name: 'Private Room', isPrivate: true }],
      currentRoomId: '1',
      socket: { on: jest.fn(), off: jest.fn() },
      leaveRoom: jest.fn(),
    });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { role: 'ADMIN' },
    });

    render(<ChatHeader />);
    
    // Check for button by text content or title
    expect(screen.queryByText('privateSession')).toBeNull();
    expect(screen.queryByTitle('privateSession')).toBeNull();
  });

  it('should render "Private" button when room is public and user is ADMIN', () => {
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      rooms: [{ id: '1', name: 'Public Room', isPrivate: false }],
      currentRoomId: '1',
      socket: { on: jest.fn(), off: jest.fn() },
      leaveRoom: jest.fn(),
    });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { role: 'ADMIN' },
    });

    render(<ChatHeader />);
    
    expect(screen.getByText('privateSession')).toBeInTheDocument();
  });

  it('should not render "Private" button when user is CLIENT', () => {
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      rooms: [{ id: '1', name: 'Public Room', isPrivate: false }],
      currentRoomId: '1',
      socket: { on: jest.fn(), off: jest.fn() },
      leaveRoom: jest.fn(),
    });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { role: 'CLIENT' },
    });

    render(<ChatHeader />);
    
    expect(screen.queryByText('privateSession')).toBeNull();
  });
});
