'use client';

import React from 'react';
import styles from './card.module.css';

interface CardProps {
  name: string;
  age: number;
  job: string;
}

const Card: React.FC<CardProps> = ({ name, age, job }) => {
  return (
    <div className={styles.card}>
      <div className={styles.container}>
        <div className={styles.imageContainer}>
          {/* 이미지가 들어갈 부분 */}
        </div>
        <div className={styles.textContainer}>
          <h3 className={styles.title}>{`${name}, ${age}`}</h3>
          <p className={styles.job}>{job}</p>
        </div>
      </div>
    </div>
  );
};

export default Card;
