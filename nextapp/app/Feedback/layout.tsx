import NavbarIcon from '@/components/navbarIcon';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <NavbarIcon />
      {children}
    </>
  );
}
