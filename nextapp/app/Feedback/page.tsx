'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import styles from './page.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { VictoryPie } from 'victory';

// const data = [
//   { x: '슬픔', y: 30.0 },
//   { x: '놀람', y: 25.0 },
//   { x: '무난', y: 20.0 },
//   { x: '분노', y: 10.0 },
//   { x: '행복', y: 8.0 },
//   { x: '설렘', y: 7.0 },
// ];

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

export default function Feedback() {
  const [id, setId] = useState('');
  const [emotionData, setEmotionData] = useState([]);
  const [sortedData, setSortedData] = useState([]);

  const handleEmotionData = async () => {
    try {
      const response = await fetch('/api/feedback/faceinfo/{userID}', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.logo}>💖소스윗</div>
      <h1 className={styles.title}>당신의 소개팅력은?</h1>
      
      {/* 차트 */}
      <div className={styles.chartContainer}>
        <VictoryPie
          data={data}
          colorScale={COLORS}
          innerRadius={100}
          style={{
            labels: { fill: 'black', fontSize: 16, fontWeight: 'bold' },
          }}
          animate={{
            duration: 1000,
            onLoad: { duration: 500 },
          }}
        />
      </div>

      {/* 차트 세부 정보 */}
      <div className={styles.chartDetails}>
        <h3>Top 3 감정 순위</h3>
        <ul>
          <li>1위: 슬픔 (30.0%)</li>
          <li>2위: 놀람 (25.0%)</li>
          <li>3위: 무난 (20.0%)</li>
        </ul>
      </div>

      {/* 언어적 분석 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>언어적 분석</h2>
        <p>대화 중 사용자가 말한 비율이 70% 이상입니다. 조금 더 경청해 주세요~</p>
        <p>'음', '아니', '어..' 같은 표현이 10회 이상입니다. 이러한 표현은 자신감 없는 인상을 주기에 줄이는 연습을 해보세요~</p>
      </div>
      
      {/* 비언어적 분석 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>비언어적 분석</h2>
        <p>전반적으로 슬픈 표정이 많습니다. 편안하게 긴장을 풀고, 자연스러운 표정을 지어볼까요?</p>
        <p>눈 맞춤 빈도는 80%입니다. 아주 잘하고 계시네요!</p>
        <p>대화 중 귀를 만지는 횟수가 5회 이상이었습니다. 긴장하실 때 귀를 만지는 습관이 있으신 것 같아요!</p>
      </div>

      {/* 종합 평가 */}
      <div className={styles.overallSection}>
        <div className={styles.overallTitle}>종합 평가</div>
        <div className={styles.overallText}>
          당신은 <span className={styles.highlight}>연애고자</span> 입니다.<br />
          등급: 
          <div className={styles.rankContainer}>
            <Image 
              src="/bronze-icon.svg"
              alt="등급 아이콘"
              width={60}
              height={60}
              className={styles.rankIcon}
            />
            <span className={styles.rankText}>브론즈</span>
          </div>
        </div>
      </div>
      
      {/* 실전 대비 개선 */}
      <div className={styles.tipsSection}>
        <h2 className={styles.tipsTitle}>실전 대비 개선 Tips</h2>
        <div className={styles.tipsContent}>
          <p>실전 소개팅에서는 다음 팁을 시도해 보세요:</p>
          <ul>
            <li>자연스러운 대화 흐름 유지하기</li>
            <li>적절한 눈맞춤과 미소로 긍정적인 인상을 주기</li>
            <li>감정을 너무 숨기지 말고 적절히 표현하기</li>
            <li>상대방의 반응에 귀 기울이며 대화 이어나가기</li>
          </ul>
        </div>
      </div>

      {/* 메인 페이지로 이동 */}
      <div className={styles.buttonContainer}>
        <Link href="/MainPage" className={styles.link}>
          <button className={styles.mainPageButton}>메인 페이지로 돌아가기</button>
        </Link>
      </div>

      <div className={styles.footer}>© 2024 SoSweet Analysis Report</div>
    </div>
  );
}
