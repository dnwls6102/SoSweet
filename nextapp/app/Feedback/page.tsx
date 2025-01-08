'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import styles from './page.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { VictoryPie } from 'victory';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import router from 'next/router';

const COLORS = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#FFB6C1',
];

interface EmotionScores {
  [key: string]: number;
}

interface EmoFeedbackResponse {
  emo_feedback_result: EmotionScores;
}

interface UserPayload {
  user_id: string;
  iat: number;
  exp: number;
}

export default function Feedback() {
  const [number, setNumber] = useState(null);
  const [emotionData, setEmotionData] = useState<EmotionScores | null>(null);
  const [verbal, setVerbal] = useState(null);
  const [nonverbal, setNonverbal] = useState(null);
  const [summary, setSummary] = useState('');

  // Redux store에서 데이터 가져오기
  const feedbackData = useSelector((state: RootState) => state.feedback);
  const room_id = useSelector((state: RootState) => state.socket.room);
  const isAIChat = useSelector((state: RootState) => state.aiFlag.isAIChat);

  const token = Cookies.get('access');
  let ID = '';
  if (token) {
    const decoded = jwtDecode<UserPayload>(token);
    ID = decoded.user_id;
  } else {
    alert('유효하지 않은 접근입니다.');
    router.replace('/');
  }

  useEffect(() => {
    if (feedbackData.summary) {
      setSummary(feedbackData.summary);
      fetchEmotionData();
    }
  }, [feedbackData.summary]);

  // 표정 정보 받아오기
  const fetchEmotionData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/feedback/faceinfo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: room_id,
            user_id: ID,
          }),
        },
      );
      console.log('room_id:', room_id);
      console.log('userID:', ID);

      if (response.ok) {
        const data: EmoFeedbackResponse = await response.json();
        console.log('가져온 표정 정보임다 :', data);
        //종합 감정 정보 추출하기
        const sorted_scores = data.emo_feedback_result;

        // 객체를 배열로 변환하여 값 기준으로 내림차순 정렬 후 다시 객체로 변환
        const sortedEmotions = Object.fromEntries(
          Object.entries(sorted_scores).sort(
            ([, a], [, b]) => (b as number) - (a as number),
          ),
        );

        //내림차순 정렬된 감정 정보 배열
        setEmotionData(sortedEmotions);
      } else {
        console.log('데이터 가져오기 실패:', response.status);
      }
    } catch (error) {
      console.log('서버 오류:', error);
    }
  };

  // 언어적 분석 받아오기
  const fetchVerbalData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/feedback/talk/${userID}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setVerbal(data); // verbal 데이터 상태에 저장
      } else {
        console.log('언어적 데이터 가져오기 실패:', response.status);
      }
    } catch (error) {
      console.log('서버 오류:', error);
    }
  };

  // 비언어적 분석 받아오기
  const fetchNonverbalData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/feedback/notalk/${userID}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setNonverbal(data); // nonverbal 데이터 상태에 저장
      } else {
        console.log('비언어적 데이터 가져오기 실패:', response.status);
      }
    } catch (error) {
      console.log('서버 오류:', error);
    }
  };

  // 비언어적 습관 몇 분 몇 초에 했는지 받아오기
  const fetchNonverbalTimeline = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/feedback/timeline/${userID}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const timelineData = await response.json();
        console.log('비언어적 습관 시간 데이터:', timelineData); // 테스트용, 나중에 삭제 가능
      } else {
        console.log(
          '비언어적 습관 시간 데이터 가져오기 실패:',
          response.status,
        );
      }
    } catch (error) {
      console.log('서버 오류:', error);
    }
  };

  // 사용자 대화 한 줄 평가 받아오기
  const fetchSummary = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/feedback?userID=${userID}&number=${number}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const summary = await response.json();
        setSummary(summary.comment);
      } else {
        console.log('한 줄 평가 데이터 가져오기 실패:', response.status);
      }
    } catch (error) {
      console.log('서버 오류:', error);
    }
  };

  // 데이터 요청
  useEffect(() => {
    fetchEmotionData();
    fetchVerbalData();
    fetchNonverbalData();
    fetchNonverbalTimeline();
    fetchSummary();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.logo}>💖소스윗</div>
      <h1 className={styles.title}>당신의 소개팅력은?</h1>

      {/* 차트 */}
      {emotionData ? (
        <div className={styles.chartContainer}>
          <VictoryPie
            data={Object.entries(emotionData)
              .slice(0, 7)
              .map(([emotion, value]) => ({
                x: emotion,
                y: value,
              }))}
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
      ) : (
        <div className={styles.loading}>
          <p>감정 데이터를 불러오는 중입니다.</p>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* 차트 세부 정보 */}
      <div className={styles.chartDetails}>
        <h3>Top 3 감정 순위</h3>
        <ul>
          {emotionData &&
            Object.entries(emotionData)
              .slice(0, 3)
              .map(([emotion, value], index) => (
                <li key={emotion}>
                  {index + 1}위: {emotion} ({value}%)
                </li>
              ))}
        </ul>
      </div>

      {/* 대화 분석 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>대화 분석</h2>
        {feedbackData.summary ? (
          // <p>verbal</p>
          <>{feedbackData.summary}</>
        ) : (
          <div className={styles.loading}>
            <p>대화 분석 데이터를 불러오는 중입니다.</p>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>

      {/* 비언어적 분석 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>동작 분석</h2>
        {nonverbal ? (
          <p>{nonverbal}</p>
        ) : (
          // <>
          //   <p>
          //     전반적으로 슬픔이 많습니다. 편안하게 긴장을 풀고, 자연스러운
          //     표정을 지어볼까요?
          //   </p>
          //   <p>눈눈 맞춤 빈도는 80%입니다. 아주 잘하고 계시네요!</p>
          //   <p>
          //     대화 중 귀를 만지는 횟수가 5회 이상이었습니다. 긴장하실 때 귀를
          //     만지는 습관이 있으신 것 같아요!
          //   </p>
          // </>
          <div className={styles.loading}>
            <p>동작 분석 데이터를 불러오는 중입니다.</p>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>

      {/* 상대방의 피드백 */}
      {!isAIChat && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>상대방의 평가</h2>
          {feedbackData.partnerFeedback ? (
            <div className={styles.partnerFeedback}>
              <p>별점: {'★'.repeat(feedbackData.partnerFeedback.rating)}</p>
              <p>코멘트: {feedbackData.partnerFeedback.comment}</p>
              <p>
                재매칭 의사:{' '}
                {feedbackData.partnerFeedback.like
                  ? '만나고 싶어요'
                  : '다음에요'}
              </p>
            </div>
          ) : (
            <div className={styles.loading}>
              <p>상대방의 평가 데이터를 불러오는 중입니다.</p>
              <div className={styles.spinner}></div>
            </div>
          )}
        </div>
      )}

      {/* 종합 평가 */}
      <div className={styles.overallSection}>
        <div className={styles.overallTitle}>종합 평가</div>
        {summary ? (
          <div className={styles.overallText}>
            <p>{summary}</p>
            <p>
              당신은 <span className={styles.highlight}>연애고자</span> 입니다.
              <br /> <br />
              당신의 소개팅 등급은
            </p>
            <div className={styles.rankContainer}>
              <Image
                src="/bronze-icon.svg"
                alt="등급 아이콘"
                width={65}
                height={65}
                className={styles.rankIcon}
              />
              <span className={styles.rankText}>브론즈</span>
            </div>
          </div>
        ) : (
          <div className={styles.loading}>
            <p>평가 데이터를 불러오는 중입니다.</p>
            <div className={styles.spinner}></div>
          </div>
        )}
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
        <Link
          href="/MainPage"
          style={{ textDecoration: 'none' }}
          className={styles.link}
        >
          <button className={styles.mainPageButton}>
            <span style={{ marginRight: '10px' }}>🏠</span> 메인 페이지로
            돌아가기
          </button>
        </Link>
      </div>

      <div className={styles.footer}>© 2024 SoSweet Analysis Report</div>
    </div>
  );
}
