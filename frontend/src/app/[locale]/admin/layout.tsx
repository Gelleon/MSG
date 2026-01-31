'use client';

import { PrivateChatNotifier } from '@/components/chat/PrivateChatNotifier';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PrivateChatNotifier />
      {children}
    </>
  );
}
