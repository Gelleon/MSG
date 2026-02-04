import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from '../Sidebar';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/',
  Link: ({children}: any) => <a>{children}</a>,
}));

jest.mock('@/lib/store', () => ({
  useAuthStore: () => ({
    user: { id: '1', username: 'TestUser', role: 'ADMIN' },
    logout: jest.fn(),
  }),
}));

jest.mock('@/lib/notification-store', () => ({
  useNotificationStore: () => ({
    soundEnabled: true,
    visualEnabled: true,
    toggleSound: jest.fn(),
    toggleVisual: jest.fn(),
  }),
}));

// Mock translations
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock useChatStore with mutable state for tests
const mockJoinRoom = jest.fn();
const mockUpdateRoom = jest.fn();
const mockCreateRoom = jest.fn();
const mockDeleteRoom = jest.fn();
const mockFetchRooms = jest.fn();

let mockRooms = [
  { id: '1', name: 'General', isPrivate: false, description: 'General chat' },
  { id: '2', name: 'Random', isPrivate: false, description: 'Random stuff' },
];

jest.mock('@/lib/chat-store', () => ({
  useChatStore: () => ({
    rooms: mockRooms,
    currentRoomId: '1',
    fetchRooms: mockFetchRooms,
    joinRoom: mockJoinRoom,
    createRoom: mockCreateRoom,
    updateRoom: mockUpdateRoom,
    deleteRoom: mockDeleteRoom,
  }),
}));

// Mock UI components that might cause issues in tests
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

jest.mock('@/components/ui/context-menu', () => ({
  ContextMenu: ({ children }: any) => <div>{children}</div>,
  ContextMenuTrigger: ({ children }: any) => <div>{children}</div>,
  ContextMenuContent: ({ children }: any) => <div>{children}</div>,
  ContextMenuItem: ({ children, onClick }: any) => <div onClick={onClick} role="button">{children}</div>,
  ContextMenuSeparator: () => null,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => null,
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRooms = [
      { id: '1', name: 'General', isPrivate: false, description: 'General chat' },
      { id: '2', name: 'Random', isPrivate: false, description: 'Random stuff' },
    ];
  });

  it('renders sidebar with rooms', () => {
    render(<Sidebar />);
    // Since we mock translations to return keys, and Sidebar component uses tSidebar('chats')? 
    // Wait, in Sidebar.tsx: <span ...>MSG.</span>
    // And search placeholder: tSidebar('searchPlaceholder') -> 'searchPlaceholder'
    expect(screen.getByPlaceholderText('searchPlaceholder')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Random')).toBeInTheDocument();
  });

  it('filters rooms based on search query', () => {
    render(<Sidebar />);
    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    
    fireEvent.change(searchInput, { target: { value: 'Gen' } });
    
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.queryByText('Random')).not.toBeInTheDocument();
  });

  it('opens edit dialog and updates room details', async () => {
    render(<Sidebar />);
    
    // Find the edit button (rename context menu item)
    // We mock ContextMenuItem to be always visible and clickable
    // tSidebar('rename') -> 'rename'
    const renameButtons = screen.getAllByText('rename');
    fireEvent.click(renameButtons[0]); // Click the first one (General room)
    
    // Dialog should be open
    const nameInput = screen.getByDisplayValue('General');
    const descInput = screen.getByDisplayValue('General chat');
    
    expect(nameInput).toBeInTheDocument();
    expect(descInput).toBeInTheDocument();
    
    // Change values
    fireEvent.change(nameInput, { target: { value: 'General Updated' } });
    fireEvent.change(descInput, { target: { value: 'New description' } });
    
    // Submit
    // tDialogs('renameRoom.submit') -> 'renameRoom.submit'
    fireEvent.click(screen.getByText('renameRoom.submit'));
    
    await waitFor(() => {
        expect(mockUpdateRoom).toHaveBeenCalledWith('1', {
            name: 'General Updated',
            description: 'New description'
        });
    });
  });
});
