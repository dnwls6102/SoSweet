import NavbarIcon from '@/components/navbarIcon';
import styles from './globals.module.css'

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
