'use client';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import styles from './page.module.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useRef, useState } from 'react';

interface UserPayload {
  user_id: string;
  user_gender: string;
  user_nickname: string;
  iat: number;
  exp: number;
}

export default function FeedbackAI() {
  const summary = useSelector((state: RootState) => state.GPTfeedback.summary);
  const audioUrl = useSelector(
    (state: RootState) => state.GPTfeedback.audioUrl,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const [user_gender, setUserGender] = useState('');

  // 토큰 디코딩을 위한 useEffect
  useEffect(() => {
    const token = Cookies.get('access');
    if (token) {
      const decoded = jwtDecode<UserPayload>(token);
      setUserGender(decoded.user_gender);
    } else {
      alert('유효하지 않은 접근입니다.');
      router.replace('/');
    }
  }, [router]);
  const image_src = user_gender === '남성' ? '/kgirl.jpg' : '/kboy.jpg';

  useEffect(() => {
    audioRef.current = new Audio(audioUrl);
    audioRef.current.play();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const handleNavigation = (path: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    router.push(path);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>상대의 한줄 평</h1>
        <div className={styles.content}>
          <div className={styles.imageSection}>
            <Image
              src={image_src}
              alt="AI 이미지"
              width={400}
              height={400}
              className={styles.aiImage}
            />
          </div>
          <div className={styles.feedbackSection}>
            <p className={styles.feedbackText}>{summary}</p>
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.button} ${styles.moreButton}`}
                onClick={() => handleNavigation('/SetAI')}
              >
                한번 더 하기!
              </button>
              <button
                className={`${styles.button} ${styles.mainButton}`}
                onClick={() => handleNavigation('/MainPage')}
              >
                메인 화면으로
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
