'use client';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import styles from './page.module.css';
import { useState } from 'react';

interface UserPayload {
  user_id: string;
  user_gender: string;
  user_nickname: string;
  iat: number;
  exp: number;
}

function SetAI() {
  const router = useRouter();
  const token = Cookies.get('access');
  let ID = '';
  let gender = '';
  let user_nickname = '';
  if (token) {
    const decoded = jwtDecode<UserPayload>(token);
    ID = decoded.user_id;
    gender = decoded.user_gender;
    user_nickname = decoded.user_nickname;
  }
  const [ai_name, setAiName] = useState('');
  const [ai_age, setAiAge] = useState('');
  const [ai_personality, setAiPersonality] = useState('');
  const [ai_job, setAiJob] = useState('');
  const [ai_hobby, setAiHobby] = useState('');
  const [waiting, setWaiting] = useState(false);

  const handleNavigation = async () => {
    setWaiting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/ai/dialog/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: ID,
            user_gender: gender,
            user_nickname: user_nickname,
            ai_name: ai_name,
            ai_age: ai_age,
            ai_personality: ai_personality,
            ai_job: ai_job,
            ai_hobby: ai_hobby,
          }),
        },
      );
      if (response.ok) {
        console.log('성공');
      } else {
        console.error('서버에서 200 반환안함');
      }
    } catch (error) {
      console.error('서버 요청 전송 오류:', error);
    }
    router.replace('/ChatAI');
  };

  if (waiting) {
    return (
      <div className={styles.loading}>
        <p>AI를 생성 중이에요</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>대화 상대 만들기</h1>
        <p className={styles.subtitle}>
          대화하고 싶은 사람을 직접 만들어 보세요!
        </p>

        <div className={styles.content}>
          <div className={styles.imageSection}>
            {/* 이미지가 들어갈 회색 영역 */}
            <button onClick={handleNavigation} className={styles.submitButton}>
              AI 생성하기
            </button>
          </div>

          <div className={styles.formSection}>
            <div className={styles.inputGroup}>
              <label>대화 상대의 이름을 정해 주세요.</label>
              <textarea
                className={styles.input}
                onChange={(e) => setAiName(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>나이는 어떻게 될까요?</label>
              <textarea
                className={styles.input}
                onChange={(e) => setAiAge(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>상대는 어떤 성격인가요? 자유롭게 적어 주세요.</label>
              <textarea
                className={styles.input}
                onChange={(e) => setAiPersonality(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>상대의 직업은 무엇인가요?</label>
              <textarea
                className={styles.input}
                onChange={(e) => setAiJob(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>상대의 취미를 알려주세요.</label>
              <textarea
                className={styles.input}
                onChange={(e) => setAiHobby(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetAI;
