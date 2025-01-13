'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import { VictoryPie } from 'victory';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import router from 'next/router';
import Image from 'next/image';

const DEFAULT_NONVERBAL = {
  counters: {
    hand_message_count: 0,
    folded_arm_message_count: 0,
    side_move_message_count: 0,
  },
};

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

interface NonverbalData {
  counters: {
    hand_message_count: number;
    folded_arm_message_count: number;
    side_move_message_count: number;
  };
}

export default function Feedback() {
  const [nonverbal, setNonverbal] = useState(DEFAULT_NONVERBAL);
  const [emotionData, setEmotionData] = useState<EmotionScores | null>(null);
  // const [nonverbal, setNonverbal] = useState<NonverbalData | string | null>(
  //   null,
  // );
  const [summary, setSummary] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [selectedTab, setSelectedTab] = useState('emotion');
  const [user_id, setUserID] = useState('');

  const feedbackData = useSelector((state: RootState) => state.feedback);
  const room_id = useSelector((state: RootState) => state.socket.room);
  const isAIChat = useSelector((state: RootState) => state.aiFlag.isAIChat);

  useEffect(() => {
    const token = Cookies.get('access');
    if (token) {
      const decoded = jwtDecode<UserPayload>(token);
      setUserID(decoded.user_id);
    } else {
      alert('유효하지 않은 접근입니다.');
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    if (feedbackData.summary) {
      setSummary(feedbackData.summary);
      setConclusion(feedbackData.conclusion);
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
            user_id: user_id,
          }),
        },
      );

      if (response.ok) {
        const data: EmoFeedbackResponse = await response.json();
        const sorted_scores = data.emo_feedback_result;
        const sortedEmotions = Object.fromEntries(
          Object.entries(sorted_scores).sort(
            ([, a], [, b]) => (b as number) - (a as number),
          ),
        );
        setEmotionData(sortedEmotions);
      } else {
        console.log('데이터 가져오기 실패:', response.status);
      }
    } catch (error) {
      console.log('서버 오류:', error);
    }
  };

  // 동작 분석 받아오기
  const fetchNonverbalData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/feedback/actioninfo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: room_id,
            user_id: user_id,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log('동작 분석 데이터 받아온 것 확인!!!!!!!!!!!!!!! : ', data);
        setNonverbal(data); // nonverbal 데이터 상태에 저장
      } else {
        console.log('비언어적 데이터 가져오기 실패:', response.status);
      }
    } catch (error) {
      console.log('서버 오류:', error);
    }
  };

  useEffect(() => {
    fetchEmotionData();
    fetchNonverbalData();
  }, [user_id]);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>당신의 소개팅력은?</h1>
      </header>

      <div className={styles.tabMenu}>
        {['emotion', 'verbal', 'nonverbal', 'overall'].map((tab) => (
          <button
            key={tab}
            className={selectedTab === tab ? styles.focusedTab : ''}
            onClick={() => setSelectedTab(tab)}
          >
            {tab === 'emotion' ? '감정 분석' : ''}
            {tab === 'verbal' ? '대화 분석' : ''}
            {tab === 'nonverbal' ? '동작 분석' : ''}
            {tab === 'overall' ? '종합 분석' : ''}
          </button>
        ))}
      </div>

      <div className={styles.container}>
        {selectedTab === 'emotion' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>감정 분석</h2>
            <div className={styles.chartWithLegend}>
              <div className={styles.chartContainer}>
                {emotionData ? (
                  <>
                    <VictoryPie
                      colorScale={COLORS}
                      innerRadius={0}
                      labels={() => null}
                      animate={{
                        duration: 1000,
                        onLoad: { duration: 500 },
                      }}
                      data={Object.entries(emotionData)
                        .slice(0, 7)
                        .map(([emotion, value]) => ({
                          x: emotion,
                          y: value,
                        }))}
                    />
                    <div className={styles.legendContainer}>
                      {Object.entries(emotionData)
                        .slice(0, 7)
                        .map(([emotion, value]) => ({
                          x: emotion,
                          y: value,
                        }))
                        .sort((a, b) => b.y - a.y)
                        .map((item, index) => (
                          <div key={index} className={styles.legendItem}>
                            <div
                              className={styles.colorBox}
                              style={{ backgroundColor: COLORS[index] }}
                            />
                            <span className={styles.legendText}>
                              {item.x} {item.y}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.loading}>
                    <p>감정 데이터를 불러오는 중입니다.</p>
                    <div className={styles.spinner} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'verbal' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>대화 분석</h2>
            {conclusion ? (
              <div className={styles.summaryText}>{conclusion}</div>
            ) : (
              <div className={styles.loading}>
                <p>대화 분석 데이터를 불러오는 중입니다.</p>
                <div className={styles.spinner} />
              </div>
            )}
          </div>
        )}

        {selectedTab === 'nonverbal' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>동작 분석</h2>
            <div className={styles.actionsWrapper}>
              {nonverbal ? (
                typeof nonverbal === 'object' && nonverbal.counters ? (
                  <div className={styles.actionsWrapper}>
                    <div className={styles.actionItem}>
                      <Image
                        src="/hand.svg"
                        alt="Hand Icon"
                        width={190}
                        height={180}
                        className={styles.icon}
                      />
                      <h4>산만한 손 동작</h4>
                      <p>{nonverbal.counters.hand_message_count} 회</p>
                    </div>
                    <div className={styles.actionItem}>
                      <Image
                        src="/facepalm.svg"
                        alt="Facepalm Icon"
                        width={190}
                        height={180}
                      />
                      <h4>눈에 손 올리기</h4>
                      <p>{nonverbal.counters.folded_arm_message_count} 회</p>
                    </div>
                    <div className={styles.actionItem}>
                      <Image
                        src="/sidemove.svg"
                        alt="Sidemove Icon"
                        width={190}
                        height={180}
                        className={styles.icon}
                      />
                      <h4>좌우 움직임</h4>
                      <p>{nonverbal.counters.side_move_message_count} 회</p>
                    </div>
                  </div>
                ) : typeof nonverbal === 'string' ? (
                  <p>{nonverbal}</p>
                ) : (
                  <div className={styles.loading}>
                    <p>동작 분석 데이터를 해석할 수 없습니다.</p>
                    <div className={styles.spinner} />
                  </div>
                )
              ) : (
                <div className={styles.loading}>
                  <p>동작 분석 데이터를 불러오는 중입니다.</p>
                  <div className={styles.spinner} />
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'overall' && (
          <div className={styles.section}>
            {!isAIChat && (
              <div className={styles.commentSection}>
                <h2 className={styles.commentTitle}>상대방의 평가</h2>
                {feedbackData.partnerFeedback ? (
                  <>
                    <div className={styles.commentContent}>
                      <div className={styles.ratingWrapper}>
                        <span className={styles.ratingHeart}>
                          {' '}
                          {'❤'.repeat(feedbackData.partnerFeedback.rating)}
                        </span>
                      </div>
                      <div className={styles.matchingStatusWrapper}>
                        <span className={styles.matchingStatus}>
                          {' '}
                          {feedbackData.partnerFeedback.like
                            ? '💕 다시 만나고 싶어요'
                            : '💔 만나고 싶지 않아요'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.commentText}>
                      {feedbackData.partnerFeedback.comment}
                    </p>
                  </>
                ) : (
                  <div className={styles.loading}>
                    <p>상대방의 평가 데이터를 불러오는 중입니다.</p>
                    <div className={styles.spinner} />
                  </div>
                )}
              </div>
            )}

            <div className={styles.overallSection}>
              <div className={styles.overallTitle}>종합 평가</div>
              {summary ? (
                <div className={styles.overallText}>
                  <p>{summary}</p>
                  <p>
                    당신은 <span className={styles.highlight}>연애고자</span>{' '}
                    입니다.
                  </p>
                </div>
              ) : (
                <div className={styles.loading}>
                  <p>평가 데이터를 불러오는 중입니다.</p>
                  <div className={styles.spinner} />
                </div>
              )}
            </div>

            <div className={styles.buttonContainer}>
              <Link
                href="/MainPage"
                style={{ textDecoration: 'none' }}
                className={styles.link}
              >
                <button className={styles.mainPageButton}>
                  메인 페이지로 돌아가기
                </button>
              </Link>
            </div>
          </div>
        )}

        <div className={styles.footer}>© 2024 SoSweet Analysis Report</div>
      </div>
    </div>
  );
}
