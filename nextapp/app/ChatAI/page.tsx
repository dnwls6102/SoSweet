'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useDispatch } from 'react-redux';
import { setSummary, setConclusion } from '@/store/feedbackSlice';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { setIsAIChat } from '@/store/aiFlagSlice';
import Image from 'next/image';

interface UserPayload {
  user_id: string;
  user_gender: string;
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

  useEffect(() => {
    const token = Cookies.get('access');
    if (token) {
      const decoded = jwtDecode<UserPayload>(token);
      setUserId(decoded.user_id);
      setUserGender(decoded.user_gender);
    } else {
      alert('유효하지 않은 접근입니다.');
      router.replace('/');
    }
  }, [router]);

  const image_src = user_gender === '남성' ? '/emma.webp' : '/john.webp';

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isRecording = useRef<boolean>(false);
  const [feedback, setFeedback] = useState('');
  const scriptRef = useRef('');
  const recognition = useRef<SpeechRecognition | null>(null);

  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]); // 녹화 데이터 쌓는 배열
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // 감정 분석을 위한 상태 추가
  const [myEmotion, setMyEmotion] = useState('😶 평온함');
  const [myValue, setMyValue] = useState(0);

  const dispatch = useDispatch();
  // const [relationshipScore, setRelationshipScore] = useState(48);

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
        console.log(result.message);
        setFeedback((prev) =>
          prev ? prev + '\n' + result.message : result.message,
        );
      } else {
        const result = await response.json();
        console.log(result.error);
        setFeedback((prev) => (prev ? prev + result.message : result.message));
      }
    } catch (error) {
      console.log('서버 오류 발생 : ', error);
    }
  };

  const trySendScript = async (script: string) => {
    const emotion = { emotion: myEmotion, value: myValue };
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
        if (event.results[i].isFinal) {
          scriptRef.current += event.results[i][0].transcript;
        }
      }
      console.log('Transcription result: ', scriptRef.current);
      if (scriptRef.current !== '') {
        tryNlp(scriptRef.current);
        trySendScript(scriptRef.current);
        //여기에다가 음성 인식 결과를 보낼 경우 : 변환 결과를 바로바로 보내주기 때문에
        //말을 끊었는지 여부도 조금 더 명확하게 판단 가능할수도 있다
        //이렇게 되면 남,녀 구분은 어떻게 해야할지?
        //서버에서 문자열을 받을 때마다 (남)표시를 하면 script가 정상적으로 생성될련지
        //부하가 많이 걸리는지? 실제로 만족스러울 정도로 통신이 될련지는 생각해봐야 함
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

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('지원하지 않는 브라우저입니다.');
      return;
    }

    recognition.current = new (
      window as unknown as Window
    ).webkitSpeechRecognition();
    recognition.current.lang = 'ko';
    recognition.current.continuous = true;

    handleStartRecording();

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
          // Blob 조각 쌓아두기
          setRecordedChunks((prev) => [...prev, event.data]);
          // console.log('녹화 데이터 청크 저장됨');
        }
      };

      recorder.onstop = () => {
        console.log('녹화 중지됨. recordedChunks:', recordedChunks);
      };

      // 녹화 시작
      recorder.start(1000);
      console.log('녹화 시작됨');
    };

    initializeMedia();

    // Canvas로 동영상 이미지로 캡쳐하고 서버로 전송하기
    const captureAndSendFrame = async () => {
      const videoEl = localVideoRef.current;
      if (!videoEl) {
        console.log('비디오 엘리먼트를 찾을 수 없음');
        return;
      }

      if (!videoEl.srcObject) {
        console.log('비디오 스트림이 없음');
        return;
      }

      // 현재 비디오 크기 가져오기
      const vWidth = videoEl.videoWidth / 4;
      const vHeight = videoEl.videoHeight / 4;

      // 영상 아직 준비 안 되었으면 스킵하기
      if (!vWidth || !vHeight) {
        console.log('비디오 크기가 아직 준비되지 않음');
        return;
      }

      // canvas 생성하기
      const canvas = document.createElement('canvas');
      canvas.width = vWidth;
      canvas.height = vHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // canvas에 비디오 그리기
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      // JPEG 포맷으로 Base64 인코딩
      const dataURL = canvas.toDataURL('image/jpeg', 0.7);

      frameCounter += 1;

      // 현재 시간으로 타임스탬프
      const timestamp = frameCounter;

      try {
        // AI 채팅용 감정 분석 요청
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
          console.error('감정 분석 응답 에러:', response.status);
          return;
        }

        // 서버에서 받은 감정 분석 결과
        const analyzeResult = await response.json();
        console.log('감정 분석 결과:', analyzeResult);

        // 감정 상태 업데이트
        if (analyzeResult.dominant_emotion) {
          setMyEmotion(analyzeResult.dominant_emotion);
          setMyValue(analyzeResult.value);
        }
      } catch (error) {
        console.error('전송 에러:', error);
      }
    };

    // 일정 간격으로 캡처 및 전송
    const intervalId = setInterval(captureAndSendFrame, 1500);

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 인터벌 정리
      clearInterval(intervalId);

      // 음성 인식 정리
      if (recognition.current) {
        recognition.current.stop();
        isRecording.current = false;
      }

      console.log('Unmounting...');

      // MediaRecorder 정리
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        try {
          mediaRecorderRef.current.stop();
          console.log('MediaRecorder 정지됨');
          mediaRecorderRef.current = null;
        } catch (err) {
          console.error('MediaRecorder 정지 중 오류:', err);
        }
      }

      // 비디오 스트림 정리
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log('비디오 트랙 정지됨');
        });
        mediaStreamRef.current = null;
      }

      // 비디오 엘리먼트 정리
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      // 녹화 데이터 초기화
      setRecordedChunks([]);
    };
  }, []);

  const handleNavigation = async () => {
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
          body: JSON.stringify({ script: 'end', user_id }),
          credentials: 'include',
        },
      );

      if (response.ok) {
        const json_data = await response.json();
        console.log(typeof json_data.analysis);
        console.log(json_data.analysis);
        const data = JSON.parse(json_data.analysis);
        console.log(data.analysis.analysis);
        console.log(data.analysis.conclusion);
        dispatch(setSummary(data.analysis));
        dispatch(setConclusion(data.conclusion));
        dispatch(setIsAIChat(true));

        // router.push 대신 window.location.href 사용
        router.push('/Feedback');
        // window.location.href = '/Feedback';
      } else {
        console.log('대화 종료 요청 실패');
      }
    } catch (error) {
      console.error('대화 종료 요청 오류:', error);
    }
  };

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
                    <span className={styles.progressValue}>{48}/100</span>
                  </div>
                </div>
              </div>
            </div>
            <Image
              src={image_src}
              alt="AI 이미지"
              width={800}
              height={500}
              className={!isRecording ? styles.imageBorderActive : ''}
            />
            <Image
              className={styles.callEndIcon}
              onClick={handleNavigation}
              src="/call-end.svg"
              alt="대화 종료"
              width={50}
              height={50}
            />
          </div>
        </div>
        <div className={styles.right}>
          <h2 className={styles.title}>당신의 언어적 습관</h2>
          <textarea
            className={styles.textareaVerbal}
            readOnly
            value={feedback}
          ></textarea>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: 1, height: 1 }}
            // style={{ display: 'none' }}
          />
          <h2 className={styles.title}>당신의 현재 감정</h2>
          <textarea
            className={styles.textareaEmotion}
            readOnly
            value={myEmotion}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
