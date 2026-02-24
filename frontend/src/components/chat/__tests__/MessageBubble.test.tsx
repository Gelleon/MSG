import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageBubble from '../MessageBubble';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    cn: actual.cn, // Keep actual cn
    // We want to test the REAL getUserDisplayName, so we don't mock it
  };
});

jest.mock('@/lib/store', () => ({
  useAuthStore: () => ({ user: { id: 'me' } }),
}));

jest.mock('@/lib/appearance-store', () => ({
  useAppearanceStore: () => ({ customColorIndex: null }),
}));

jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

jest.mock('@/lib/chat-store', () => ({
  useChatStore: (selector: any) => selector({ replyingTo: null, loadingReplyId: null }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

describe('MessageBubble sender name', () => {
  const baseMessage = {
    id: 'msg-1',
    content: 'Hello @Bob',
    senderId: 'user-1',
    sender: { name: 'Alice', email: 'alice@example.com' },
    createdAt: new Date().toISOString(),
    roomId: 'room-1',
  };

  it('renders sender name without @ prefix', () => {
    render(
      <MessageBubble
        message={baseMessage}
        isMe={false}
        isSameSender={false}
        showDate={false}
        showAvatar={true}
        showName={true}
        showTranslations={false}
        onDelete={jest.fn()}
        onInviteToPrivate={jest.fn()}
        onReply={jest.fn()}
        onEdit={jest.fn()}
        onViewHistory={jest.fn()}
        onImageClick={jest.fn()}
        deletingId={null}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('@Alice')).not.toBeInTheDocument();
  });

  it('displays mention text without @ in message content', () => {
    render(
      <MessageBubble
        message={baseMessage}
        isMe={false}
        isSameSender={false}
        showDate={false}
        showAvatar={true}
        showName={true}
        showTranslations={false}
        onDelete={jest.fn()}
        onInviteToPrivate={jest.fn()}
        onReply={jest.fn()}
        onEdit={jest.fn()}
        onViewHistory={jest.fn()}
        onImageClick={jest.fn()}
        deletingId={null}
      />
    );

    const mention = screen.getByText('Bob');
    expect(mention).toBeInTheDocument();
    expect(mention).toHaveClass('text-primary');
  });

  it('renders email if name is missing', () => {
    const messageNoName = {
      ...baseMessage,
      sender: { ...baseMessage.sender, name: null, email: 'alice@example.com' },
    };

    render(
      <MessageBubble
        message={messageNoName}
        isMe={false}
        isSameSender={false}
        showDate={false}
        showAvatar={true}
        showName={true}
        showTranslations={false}
        onDelete={jest.fn()}
        onInviteToPrivate={jest.fn()}
        onReply={jest.fn()}
        onEdit={jest.fn()}
        onViewHistory={jest.fn()}
        onImageClick={jest.fn()}
        deletingId={null}
      />
    );

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('handles null sender safely', () => {
    const messageNullSender = {
      ...baseMessage,
      sender: null as any, // Force null to test runtime behavior
    };

    render(
      <MessageBubble
        message={messageNullSender}
        isMe={false}
        isSameSender={false}
        showDate={false}
        showAvatar={true}
        showName={true}
        showTranslations={false}
        onDelete={jest.fn()}
        onInviteToPrivate={jest.fn()}
        onReply={jest.fn()}
        onEdit={jest.fn()}
        onViewHistory={jest.fn()}
        onImageClick={jest.fn()}
        deletingId={null}
      />
    );

    expect(screen.getByText('Пользователь')).toBeInTheDocument();
  });
});
