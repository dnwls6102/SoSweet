'use client';

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { setReduxSocket, setRoom } from '../../store/socketSlice';

interface UserPayload {
  user_id: string;
  user_gender: string;
  iat: number;
  exp: number;
}
export default function MatchingPerson() {
  const router = useRouter();
  const [isMatching, setIsMatching] = useState(false);
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [user_id, setUserID] = useState('');
  const [user_gender, setUserGender] = useState('');
  const dispatch = useDispatch();
  let makeConnectAudio: HTMLAudioElement;
  if (typeof window !== 'undefined') {
    makeConnectAudio = new Audio('/makeConnect.mp3');
    makeConnectAudio.loop = true;
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isMatching) {
        makeConnectAudio.play();
      } else {
        makeConnectAudio.pause();
        makeConnectAudio.currentTime = 0;
      }
      return () => {
        makeConnectAudio.pause();
        makeConnectAudio.currentTime = 0;
      };
    }
  }, [isMatching]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('access');
      if (token) {
        const decoded = jwtDecode<UserPayload>(token);
        setUserID(decoded.user_id);
        setUserGender(decoded.user_gender);
      } else {
        alert('유효하지 않은 접근입니다.');
        router.replace('/');
      }
      // 소켓 연결 초기화
      const newSocket = io(`${process.env.NEXT_PUBLIC_SERVER_URL}`, {
        path: '/api/match',
        transports: ['websocket'],
      });
      setSocket(newSocket);
      dispatch(setReduxSocket(newSocket));

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('matchSuccess', async (data: { room_id: string }) => {
        console.log('Match success:', data);
        makeConnectAudio.pause();
        makeConnectAudio.currentTime = 0;
        dispatch(setRoom(data.room_id));
        router.push(`/MatchingPerson/ChatHuman?room=${data.room_id}`);
      });

      // 뒤로가기 이벤트 발생 시 메인 페이지로 이동
      window.addEventListener('popstate', () => {
        newSocket.emit('match-disconnect');
        newSocket.disconnect();
        router.push('/MainPage');
      });
      return;
    }
  }, [router, dispatch]);

  const handleMatching = () => {
    setIsMatching(true);
    if (socket) {
      socket.emit('startMatching', {
        user_id: user_id,
        gender: user_gender,
      });
    }
  };

  if (isMatching) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loading}>
            <p>매칭을 찾고 있어요</p>
            <div className={styles.spinner}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.leftSection}>
          <Image
            src="/matching-illustration.svg"
            alt="Matching Illustration"
            width={750}
            height={750}
            className={styles.matchImage}
          />
        </div>
        <div className={styles.rightSection}>
          <div className={styles.rankContainer}>
            <span className={styles.rankText}>
              지금 클릭하세요, <br /> 당신의 운명이 로딩 중입니다!
            </span>
            {/* <span className={styles.rankText}>나의 등급</span>
            <Image
              src="/bronze-icon.svg"
              alt="Rank Icon"
              width={60}
              height={60}
              className={styles.rankIcon}
            />
            <span className={styles.rankLevel}>브론즈</span> */}
          </div>
          <button className={styles.matchButton} onClick={handleMatching}>
            매칭 시작
          </button>
        </div>
      </div>
    </div>
  );
}
