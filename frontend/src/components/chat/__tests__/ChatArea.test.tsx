import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatArea from '../ChatArea';
import { useChatStore } from '@/lib/chat-store';
import { useAuthStore } from '@/lib/store';

// Mock stores
jest.mock('@/lib/chat-store');
jest.mock('@/lib/store');
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'ru',
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
window.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: mockObserve,
  unobserve: jest.fn(),
  disconnect: mockDisconnect,
}));

(window as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('ChatArea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMessages = [
    { id: '1', content: 'Hello', senderId: 'user1', createdAt: new Date().toISOString(), sender: { name: 'User 1', email: 'user1@example.com' } },
    { id: '2', content: 'Hi', senderId: 'user2', createdAt: new Date().toISOString(), sender: { name: 'User 2', email: 'user2@example.com' } },
  ];

  it('renders messages correctly', () => {
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      messages: mockMessages,
      currentRoomId: 'room1',
      rooms: [{ id: 'room1', name: 'Room 1' }],
      loadMoreMessages: jest.fn(),
      isLoadingHistory: false,
      hasMoreMessages: false,
      deleteMessage: jest.fn(),
      socket: { emit: jest.fn() },
      setReplyingTo: jest.fn(),
      fetchReplyMessage: jest.fn(),
      setEditingMessage: jest.fn(),
      markRoomAsRead: jest.fn(),
      typingUsers: {}
    });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 'user1' },
    });

    render(<ChatArea />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('scrolls to bottom on first load', () => {
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      messages: mockMessages,
      currentRoomId: 'room1',
      rooms: [{ id: 'room1', name: 'Room 1' }],
      loadMoreMessages: jest.fn(),
      isLoadingHistory: false,
      hasMoreMessages: false,
      deleteMessage: jest.fn(),
      socket: { emit: jest.fn() },
      setReplyingTo: jest.fn(),
      fetchReplyMessage: jest.fn(),
      setEditingMessage: jest.fn(),
      markRoomAsRead: jest.fn(),
      typingUsers: {}
    });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 'user1' },
    });

    render(<ChatArea />);
    
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'end' }));
  });

  it('shows loading indicator when loading history', () => {
     (useChatStore as unknown as jest.Mock).mockReturnValue({
      messages: mockMessages,
      currentRoomId: 'room1',
      rooms: [{ id: 'room1', name: 'Room 1' }],
      loadMoreMessages: jest.fn(),
      isLoadingHistory: true,
      hasMoreMessages: true,
      deleteMessage: jest.fn(),
      socket: { emit: jest.fn() },
      setReplyingTo: jest.fn(),
      fetchReplyMessage: jest.fn(),
      setEditingMessage: jest.fn(),
      markRoomAsRead: jest.fn(),
      typingUsers: {}
    });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 'user1' },
    });

    const { container } = render(<ChatArea />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('loads history when scrolled to top', async () => {
    const loadMoreMessages = jest.fn().mockResolvedValue(undefined);
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      messages: mockMessages,
      currentRoomId: 'room1',
      rooms: [{ id: 'room1', name: 'Room 1' }],
      loadMoreMessages,
      isLoadingHistory: false,
      hasMoreMessages: true,
      deleteMessage: jest.fn(),
      socket: { emit: jest.fn() },
      setReplyingTo: jest.fn(),
      fetchReplyMessage: jest.fn(),
      setEditingMessage: jest.fn(),
      markRoomAsRead: jest.fn(),
      typingUsers: {}
    });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 'user1' },
    });

    const { container } = render(<ChatArea />);
    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
    expect(viewport).toBeTruthy();

    Object.defineProperty(viewport, 'scrollTop', { value: 0, writable: true });
    Object.defineProperty(viewport, 'scrollHeight', { value: 1000, writable: true });
    Object.defineProperty(viewport, 'clientHeight', { value: 600, writable: true });

    fireEvent.scroll(viewport);

    await waitFor(() => {
      expect(loadMoreMessages).toHaveBeenCalled();
    });
  });
});
