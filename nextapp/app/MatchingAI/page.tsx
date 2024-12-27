'use client';

import React from 'react';
import Card from '../../components/card';
import styles from './page.module.css';

const MatchingAI = () => {
  const cardData = [
    { name: '김두식', age: 23, job: '교사' },
    { name: '조필두', age: 27, job: '배우' },
    { name: '곽병철', age: 28, job: '의사' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.cardsContainer}>
        {cardData.map((card, index) => (
          <Card key={index} name={card.name} age={card.age} job={card.job} />
        ))}
      </div>
    </div>
  );
};

export default MatchingAI;
