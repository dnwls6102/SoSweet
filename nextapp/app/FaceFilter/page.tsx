'use client';

import React from 'react';
import Header from '../../components/header';
import VideoWithFilter from './VideoWithFilter';
import styles from './page.module.css';

export default function FaceFilterPage() {
  return (
    <>
      <Header />
      <div className={styles.app}>
        <h1 className={styles.heading}>Face Filter Test</h1>
        <VideoWithFilter />
      </div>
    </>
  );
}

