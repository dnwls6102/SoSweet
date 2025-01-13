import React from 'react';
import styles from './warningModal.module.css';

interface WarningModalProps {
  message: string;
}

export default function WarningModal({ message }: WarningModalProps) {
  return (
    <div className={styles.warningModal}>
      <div className={styles.warningContent}>{message}</div>
    </div>
  );
}
