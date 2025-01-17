'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useDispatch } from 'react-redux';
import { setGPTFeedback, setGPTAudioUrl } from '@/store/GPTfeedbackSlice';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import Image from 'next/image';

interface UserPayload {
  user_id: string;
  user_gender: string;
  user_nickname: string;
  iat: number;
  exp: number;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
        isFinal?: boolean;
      };
      isFinal?: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: { error: string }) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onspeechstart: () => void;
  onspeechend: () => void;
  state?: string;
}

interface Window {
  webkitSpeechRecognition: new () => SpeechRecognition;
}

interface Message {
  text: string;
  isUser: boolean;
}

export default function Chat() {
  const router = useRouter();
  const [user_id, setUserId] = useState('');
  const [user_gender, setUserGender] = useState('');
  const [user_nickname, setUserNickname] = useState('');
  // 토큰 디코딩을 위한 useEffect
  useEffect(() => {
    const token = Cookies.get('access');
    if (token) {
      const decoded = jwtDecode<UserPayload>(token);
      setUserId(decoded.user_id);
      setUserGender(decoded.user_gender);
      setUserNickname(decoded.user_nickname);
    } else {
      alert('유효하지 않은 접근입니다.');
      router.replace('/');
    }
  }, [router]);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const video_src = user_gender === '남성' ? '/kgirl.mp4' : '/kboy.mp4';

  // 비디오 첫 프레임 캡처를 위한 useEffect
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, [video_src]);

  const isRecording = useRef<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scriptRef = useRef('');
  const recognition = useRef<SpeechRecognition | null>(null);

  const dispatch = useDispatch();

  // 말풍선 자동 스크롤
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const [waiting, setWaiting] = useState(false);

  let disconnectAudio: HTMLAudioElement;
  let connectAudio: HTMLAudioElement;
  if (typeof window !== 'undefined') {
    disconnectAudio = new Audio('/disconnect.mp3');
    connectAudio = new Audio('/connect.mp3');
  }

  const trySendScript = async (script: string) => {
    if (!user_id) {
      console.log('user_id가 아직 설정되지 않았습니다.');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/ai/dialog`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ script, user_id, user_gender }),
        },
      );

      if (response.ok) {
        const encodedScript = await response.headers.get('X-Script');
        if (encodedScript) {
          const decodedBytes = Buffer.from(encodedScript, 'base64');
          const decodedScript = new TextDecoder('utf-8').decode(decodedBytes);
          setMessages((prev) => [
            ...prev,
            { text: decodedScript, isUser: false },
          ]);
        }
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        if (typeof window !== 'undefined') {
          const audio = new Audio(audioUrl);

          audio.addEventListener('play', () => {
            setIsPlaying(true);
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current
                .play()
                .catch((e) => console.error('비디오 재생 실패:', e));
            }
          });

          audio.addEventListener('ended', () => {
            setIsPlaying(false);
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
            isRecording.current = true;
            recognition.current?.start();
          });

          audio.play().catch((e) => console.error('오디오 재생 실패:', e));
        }
      }
    } catch (error) {
      console.log('서버 오류 발생 : ', error);
    }
  };

  const handleStartRecording = () => {
    if (!recognition.current) return;

    recognition.current.onstart = () => {
      isRecording.current = true;
    };

    recognition.current.onspeechstart = () => {};

    //onresult : 음성 인식 결과가 발생할때마다 호출됨
    recognition.current.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (
          event.results[i].isFinal &&
          event.results[i][0].transcript.trim() !== ''
        ) {
          const newScript = event.results[i][0].transcript;
          setMessages((prev) => [...prev, { text: newScript, isUser: true }]);
          scriptRef.current += newScript;
        }
      }

      if (scriptRef.current !== '') {
        isRecording.current = false;
        recognition.current?.stop();
        trySendScript(scriptRef.current);
        scriptRef.current = '';
      }
    };

    recognition.current.onspeechend = () => {
      /* 이곳에 trySendScript로 발화 내용을 전송하면
         문제점 : 사용자가 발화하지 않는다고 판단하는 시간을 너무 보수적으로 잡음
         --> chunk 내용이 엄청 길어지게 됨
      */
      // scriptRef.current = '';
    };

    recognition.current.onend = () => {
      if (isRecording.current) {
        recognition.current?.start();
      }
    };

    recognition.current.onerror = (event: { error: string }) => {
      if (event.error !== 'no-speech')
        console.log('Speech recognition error:', event.error);
    };

    recognition.current.start();
  };

  // 음성 인식 초기화를 위한 useEffect
  useEffect(() => {
    if (!user_id) return; // user_id가 설정되기 전에는 실행하지 않음

    if (!('webkitSpeechRecognition' in window)) {
      alert('지원하지 않는 브라우저입니다.');
      return;
    }
    connectAudio.play();

    recognition.current = new (
      window as unknown as Window
    ).webkitSpeechRecognition();
    recognition.current.lang = 'ko';
    recognition.current.continuous = true;

    handleStartRecording();

    return () => {
      if (recognition.current) {
        recognition.current.stop();
        isRecording.current = false;
      }
    };
  }, [user_id]); // user_id를 의존성 배열에 추가

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]); // script 대신 messages를 dependency로 변경

  const handleNavigation = async () => {
    setWaiting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/ai/dialog/end`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: 'end',
            user_id,
            user_nickname,
            user_gender,
          }),
          credentials: 'include',
        },
      );

      if (response.ok) {
        const encodedScript = response.headers.get('X-Script');
        if (encodedScript) {
          const decodedBytes = Buffer.from(encodedScript, 'base64');
          const decodedScript = new TextDecoder('utf-8').decode(decodedBytes);
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          dispatch(setGPTFeedback(decodedScript));
          dispatch(setGPTAudioUrl(audioUrl));
        }
        disconnectAudio.play();
        router.push('/FeedbackAI');
      } else {
      }
    } catch (error) {
      console.log('대화 종료 요청 오류:', error);
    }
  };

  if (waiting) {
    return (
      <div className={styles.loading}>
        <p>대화를 분석하고 있어요</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.relationshipContainer}>
            <div className={styles.mediaContainer}>
              <video
                ref={videoRef}
                src={video_src}
                className={`${styles.aiVideo} ${!isRecording.current ? styles.imageBorderActive : ''}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                loop={isPlaying}
                muted
                playsInline
                preload="auto"
              />
            </div>
            <Image
              className={styles.callEndIcon}
              onClick={handleNavigation}
              src="/call-end.svg"
              alt="대화 종료"
              width={80}
              height={80}
            />
          </div>
        </div>
        <div className={styles.right}>
          <div ref={chatContainerRef} className={styles.chatContainer}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.isUser ? styles.userMessage : styles.aiMessage
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
