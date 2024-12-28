import styles from './middleForm.module.css';
import { ReactNode } from 'react';

interface MiddleFormProps {
  children: ReactNode;
}

export default function MiddleForm({ children }: MiddleFormProps) {
  return <div className={styles.form}>{children}</div>;
}
