import NavbarIcon from '@/components/navbarIcon';
// import styles from './layout.module.css';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <NavbarIcon />
      <div>{children}</div>
    </>
  );
}
