'use client';

import NavbarIcon from '@/components/navbarIcon';

export default function ChatAILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarIcon />
      <div>{children}</div>
    </>
  );
}
