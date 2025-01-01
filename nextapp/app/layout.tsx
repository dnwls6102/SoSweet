import styles from './globals.module.css';
import { Providers } from './providers';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html>
      <body className={styles.back}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
