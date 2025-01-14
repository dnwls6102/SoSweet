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

// 프레임 카운터 추가
let frameCounter = 0;

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

  const image_src = user_gender === '남성' ? '/emma.webp' : '/john.webp';

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isRecording = useRef<boolean>(false);
  const [script, setScript] = useState('');
  const scriptRef = useRef('');
  const recognition = useRef<SpeechRecognition | null>(null);

  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]); // 녹화 데이터 쌓는 배열
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const myEmotionRef = useRef('평온함');
  const myValueRef = useRef(0);

  const noword_flag = useRef(false);
  const filler_flag = useRef(false);
  const noend_flag = useRef(false);
  const nopolite_flag = useRef(false);

  const dispatch = useDispatch();

  const [waiting, setWaiting] = useState(false);

  const disconnectAudio = new Audio('/disconnect.mp3');
  const connectAudio = new Audio('/connect.mp3');

  //대화 영상 전체 / n분 간격으로 서버로 보내는 함수

  const tryNlp = async (script: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/nlp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ script }),
        },
      );
      if (response.ok) {
        const result = await response.json();
        noword_flag.current = result.noword_flag;
        filler_flag.current = result.filler_flag;
        noend_flag.current = result.noend_flag;
        nopolite_flag.current = result.nopolite_flag;
      } else {
        const result = await response.json();
        console.log(result.error);
      }
    } catch (error) {
      console.log('서버 오류 발생 : ', error);
    }
  };

  const trySendScript = async (script: string) => {
    const emotion = {
      emotion: myEmotionRef.current,
      value: myValueRef.current,
    };

    // user_id가 없으면 함수 실행하지 않음
    if (!user_id) {
      console.log('user_id가 아직 설정되지 않았습니다.');
      return;
    }

    console.log('전송하는 user_id:', user_id);
    console.log('전송하는 user_gender:', user_gender);
    console.log('전송하는 emotion:', emotion);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/ai/dialog`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ script, user_id, user_gender, emotion }),
        },
      );

      if (response.ok) {
        const encodedScript = await response.headers.get('X-Script');
        console.log('encoded script:', encodedScript);
        if (encodedScript) {
          const decodedBytes = Buffer.from(encodedScript, 'base64');
          const decodedScript = new TextDecoder('utf-8').decode(decodedBytes);
          console.log('decoded script:', decodedScript);
          setScript((prev) =>
            prev ? `${prev}\n${decodedScript}` : decodedScript,
          );
        }
        const audioBlob = await response.blob(); // 서버 응답 데이터를 Blob으로 변환
        const audioUrl = URL.createObjectURL(audioBlob); // Blob에서 재생 가능한 URL 생성
        const audio = new Audio(audioUrl); // Audio 객체 생성
        isRecording.current = false;
        recognition.current?.stop();
        audio.addEventListener('ended', () => {
          console.log('음성 재생 완료');

          isRecording.current = true;
          recognition.current?.start();
        });
        audio.play(); // 음성 파일 재생
        console.log('전송 성공');
      } else {
        console.log('오류 발생');
      }
    } catch (error) {
      console.log('서버 오류 발생 : ', error);
    }
  };

  const handleStartRecording = () => {
    if (!recognition.current) return;

    recognition.current.onstart = () => {
      isRecording.current = true;
      console.log('Speech recognition started');
    };

    recognition.current.onspeechstart = () => {
      console.log('사용자가 말을 시작함');
    };

    //onresult : 음성 인식 결과가 발생할때마다 호출됨
    recognition.current.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (
          event.results[i].isFinal &&
          event.results[i][0].transcript.trim() !== ''
        ) {
          const newScript = event.results[i][0].transcript;
          setScript((prev) => (prev ? `${prev}\n${newScript}` : newScript));
          scriptRef.current += newScript;
        }
      }
      console.log('Transcription result: ', scriptRef.current);

      if (scriptRef.current !== '') {
        tryNlp(scriptRef.current);
        trySendScript(scriptRef.current);
        scriptRef.current = '';
      }
    };

    recognition.current.onspeechend = () => {
      console.log('onspeechend called');
      console.log('Final transcript:', scriptRef.current);
      /* 이곳에 trySendScript로 발화 내용을 전송하면
         문제점 : 사용자가 발화하지 않는다고 판단하는 시간을 너무 보수적으로 잡음
         --> chunk 내용이 엄청 길어지게 됨
      */
      // scriptRef.current = '';
    };

    recognition.current.onend = () => {
      console.log('Speech recognition session ended.');
      console.log('isRecording:', isRecording.current);
      if (isRecording.current) {
        console.log('Restarting speech recognition...');
        recognition.current?.start();
      }
    };

    recognition.current.onerror = (event: { error: string }) => {
      if (event.error !== 'no-speech')
        console.error('Speech recognition error:', event.error);
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

  // 비디오 스트림 초기화를 위한 useEffect
  useEffect(() => {
    if (!user_id) return; // user_id가 설정되기 전에는 실행하지 않음

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        mediaStreamRef.current = stream;

        // 비디오 엘리먼트에 스트림 연결
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log('비디오 스트림 연결 성공');
        }

        // 여기서 MediaRecorder로 '전체 영상 Blob' 저장 로직 구현하기
        setupMediaRecorder(stream);

        // 스트림 초기화 후 바로 감정 분석 시작
        startEmotionAnalysis();
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    const setupMediaRecorder = (stream: MediaStream) => {
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp8',
      });
      mediaRecorderRef.current = recorder;
      console.log('MediaRecorder 설정 완료');

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        console.log('녹화 중지됨. recordedChunks:', recordedChunks);
      };

      recorder.start(1000);
      console.log('녹화 시작됨');
    };

    const startEmotionAnalysis = () => {
      const captureAndSendFrame = async () => {
        const videoEl = localVideoRef.current;
        if (!videoEl || !videoEl.srcObject) return;

        const vWidth = videoEl.videoWidth / 4;
        const vHeight = videoEl.videoHeight / 4;

        if (!vWidth || !vHeight) return;

        const canvas = document.createElement('canvas');
        canvas.width = vWidth;
        canvas.height = vHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/jpeg', 0.7);
        frameCounter += 1;
        const timestamp = frameCounter;

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/ai/frameInfo`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                frame: dataURL,
                timestamp: timestamp,
                user_id: user_id,
              }),
              mode: 'cors',
            },
          );

          if (!response.ok) {
            console.log('감정 분석 응답 에러:', response.status);
            return;
          }

          const analyzeResult = await response.json();
          console.log('감정 분석 결과:', analyzeResult);

          if (analyzeResult.dominant_emotion) {
            myEmotionRef.current = analyzeResult.dominant_emotion;
            myValueRef.current = analyzeResult.value;
          }
        } catch (error) {
          console.error('전송 에러:', error);
        }
      };

      const intervalId = setInterval(captureAndSendFrame, 1500);
      return intervalId;
    };

    let emotionIntervalId: NodeJS.Timeout;
    initializeMedia().then(() => {
      emotionIntervalId = startEmotionAnalysis();
    });

    return () => {
      if (emotionIntervalId) {
        clearInterval(emotionIntervalId);
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        mediaStreamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      setRecordedChunks([]);
    };
  }, [user_id]);

  const handleNavigation = async () => {
    setWaiting(true);
    try {
      // 먼저 모든 리소스를 정리
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        mediaStreamRef.current = null;
      }

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
        console.log('대화 종료 요청 실패');
      }
    } catch (error) {
      console.error('대화 종료 요청 오류:', error);
    }
  };

  if (waiting) {
    return (
      <div className={styles.loading}>
        <p>방금 대화를 분석하고 있어요</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.relationshipContainer}>
            <div className={styles.relationshipSet}>
              <Image
                src="/heart.svg"
                alt="하트"
                width={24}
                height={24}
                className={styles.heartIcon}
              />
              <div className={styles.relationshipExp}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${48}%` }}
                  >
                    <span className={styles.progressValue}>48/100</span>
                  </div>
                </div>
              </div>
            </div>
            <Image
              src={image_src}
              alt="AI 이미지"
              width={800}
              height={500}
              className={`${styles.aiImage} ${!isRecording.current ? styles.imageBorderActive : ''}`}
            />
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
          <div className={styles.chatContainer}>
            {script
              .split('\n')
              .filter((message) => message.trim() !== '')
              .map((message, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${
                    index % 2 === 0 ? styles.userMessage : styles.aiMessage
                  }`}
                >
                  {message}
                </div>
              ))}
          </div>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: 1, height: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
