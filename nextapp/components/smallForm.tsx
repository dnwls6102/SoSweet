import styles from './smallForm.module.css';
import { ReactNode } from 'react';

interface SmallFormProps {
  children: ReactNode;
}

export default function SmallForm({ children }: SmallFormProps) {
  return <div className={styles.form}>{children}</div>;
}
