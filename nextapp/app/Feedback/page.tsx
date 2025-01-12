'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import styles from './page.module.css';
// import Image from 'next/image';
// import Link from 'next/link';
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

interface NonverbalData {
  user_id: string;
  room_id: string;
  counters: {
    hand_message_count: number;
    folded_arm_message_count: number;
    side_move_message_count: number;
  };
}

export default function Feedback() {
  const [emotionData, setEmotionData] = useState<EmotionScores | null>(null);
  const [nonverbal, setNonverbal] = useState<NonverbalData | null>(null);
  const [summary, setSummary] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [selectedTab, setSelectedTab] = useState('emotion');
  const [user_id, setUserID] = useState('');

  // Redux store에서 데이터 가져오기
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
    console.log('Feedback UseEfect');
    console.log(feedbackData.summary);
    console.log(feedbackData.conclusion);
    if (feedbackData.summary) {
      console.log('Redux에 저장되어 있음');
      setSummary(feedbackData.summary);
      setConclusion(feedbackData.conclusion);
      fetchEmotionData();
      fetchNonverbalData();
    }
  }, [feedbackData.summary, feedbackData.conclusion]);

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
            room_id: isAIChat ? 'ai' : room_id,
            user_id: user_id,
          }),
        },
      );

      console.log('room_id:', isAIChat ? 'ai' : room_id);
      console.log('userID:', user_id);

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
        const data: NonverbalData = await response.json();
        console.log('동작 분석 데이터 받아온 것 확인!!!!!!!!!!!!!!! : ', data);
        setNonverbal(data); // nonverbal 데이터 상태에 저장
      } else {
        console.log('비언어적 데이터 가져오기 실패:', response.status);
      }
    } catch (error) {
      console.log('서버 오류:', error);
    }
  };

  // 데이터 요청
  useEffect(() => {
    fetchEmotionData();
    fetchNonverbalData();
  }, []);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>당신의 소개팅력은?</h1>
      </header>

      {/* 탭 메뉴 */}
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
            {tab === 'overall' ? '종합 평가' : ''}
          </button>
        ))}
      </div>

      {/* 컨테이너 */}
      <div className={styles.container}>
        {/* 감정 분석 */}
        {selectedTab === 'emotion' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>감정 분석</h2>

            {/* 차트와 차트 외부에 데이터 정렬 */}
            <div className={styles.chartWithLegend}>
              <div className={styles.chartContainer}>
                {emotionData ? (
                  <>
                    {/* VictoryPie 차트 */}
                    <VictoryPie
                      colorScale={COLORS}
                      innerRadius={0}
                      labels={() => null}
                      animate={{
                        duration: 1000,
                        onLoad: { duration: 500 },
                      }}
                      data={Object.entries(emotionData)
                        .slice(0, 7) // 상위 7개 데이터만 선택
                        .map(([emotion, value]) => ({
                          x: emotion,
                          y: value,
                        }))}
                    />

                    {/* 차트 외부 데이터 정렬 */}
                    <div className={styles.legendContainer}>
                      {Object.entries(emotionData)
                        .slice(0, 7) // 상위 7개 데이터만 선택
                        .map(([emotion, value]) => ({
                          x: emotion,
                          y: value,
                        }))
                        .sort((a, b) => b.y - a.y) // y 값이 큰 순서대로 정렬
                        .map((item, index) => (
                          <div key={index} className={styles.legendItem}>
                            <div
                              className={styles.colorBox}
                              style={{ backgroundColor: COLORS[index] }}
                            ></div>
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
                    <div className={styles.spinner}></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 대화 분석 */}
        {selectedTab === 'verbal' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>대화 분석</h2>
            {summary ? (
              <div className={styles.summaryText}>{summary}</div>
            ) : (
              <div className={styles.loading}>
                <p>대화 분석 데이터를 불러오는 중입니다.</p>
                <div className={styles.spinner}></div>
              </div>
            )}
          </div>
        )}

        {/* 동작 분석 */}
        {selectedTab === 'nonverbal' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>동작 분석</h2>
            <div className={styles.actionsWrapper}>
              {nonverbal ? (
                // nonverbal가 문자열이 아니라면(즉 객체라면) counters에 접근
                typeof nonverbal === 'object' && nonverbal.counters ? (
                  <div className={styles.actionsWrapper}>
                    {/* Action 1) 산만한 손 동작 */}
                    <div className={styles.actionItem}>
                      <h2>👋</h2>
                      <h4>산만한 손 동작</h4>
                      <p>{nonverbal.counters.hand_message_count} 회</p>
                    </div>

                    {/* Action 2) 산만한 팔 동작 */}
                    <div className={styles.actionItem}>
                      <h2>🙆‍♀️</h2>
                      <h4>산만한 팔 동작</h4>
                      <p>{nonverbal.counters.folded_arm_message_count} 회</p>
                    </div>

                    {/* Action 3) 좌우 움직임 */}
                    <div className={styles.actionItem}>
                      <h2>🕺</h2>
                      <h4>좌우 움직임</h4>
                      <p>{nonverbal.counters.side_move_message_count} 회</p>
                    </div>
                  </div>
                ) : typeof nonverbal === 'string' ? (
                  // 혹은 만약 API가 문자열만 넘겨줄 때 처리
                  <p>{nonverbal}</p>
                ) : (
                  // nonverbal 형식이 예기치 않은 경우
                  <p>동작 분석 데이터를 해석할 수 없습니다.</p>
                )
              ) : (
                <div className={styles.loading}>
                  <p>동작 분석 데이터를 불러오는 중입니다.</p>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 종합 평가 */}
        {selectedTab === 'overall' && (
          <div className={styles.section}>
            {/* 상대방의 피드백 */}
            {!isAIChat && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>상대방의 평가</h2>
                {feedbackData.partnerFeedback ? (
                  <div className={styles.partnerFeedback}>
                    <p>
                      평점: {'♥'.repeat(feedbackData.partnerFeedback.rating)}
                    </p>
                    <p>코멘트: {feedbackData.partnerFeedback.comment}</p>
                    <p>
                      재매칭 의사:{' '}
                      {feedbackData.partnerFeedback.like
                        ? '💕 다시 만나고 싶어요'
                        : '💔 만나고 싶지 않아요'}
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
            <div className={styles.overallSection}>
              <div className={styles.overallTitle}>종합 평가</div>
              {conclusion ? (
                <div className={styles.overallText}>
                  <p>{conclusion}</p>
                  <p>
                    당신은 <span className={styles.highlight}>연애고자</span>{' '}
                    입니다.
                    {/* <br /> <br />
              당신의 소개팅 등급은 */}
                  </p>
                  {/* <div className={styles.rankContainer}>
              <Image
                src="/bronze-icon.svg"
                alt="등급 아이콘"
                width={65}
                height={65}
                className={styles.rankIcon}
              />
              <span className={styles.rankText}>브론즈</span>
            </div> */}
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
          </div>
        )}

        {/* 메인 페이지로 이동 */}
        {/* <div className={styles.buttonContainer}>
        <Link
          href="/MainPage"
          style={{ textDecoration: 'none' }}
          className={styles.link}
        >
          <button className={styles.mainPageButton}>
            메인 페이지로 돌아가기
          </button>
        </Link>
      </div> */}

        <div className={styles.footer}>© 2024 SoSweet Analysis Report</div>
      </div>
    </div>
  );
}
