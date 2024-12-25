import styles from './globals.module.css';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html>
      <body className={styles.back}>{children}</body>
    </html>
  );
}
