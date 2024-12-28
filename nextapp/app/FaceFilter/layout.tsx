import NavbarIcon from '@/components/navbarIcon';

export default function MainPageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <NavbarIcon />
      {children}
    </>
  );
}
