'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import 'webrtc-adapter';
import styles from './page.module.css';
import Image from 'next/image';
import Videobox from '@/components/videobox';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

interface UserPayload {
  user_id: string;
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

// 프레임 카운터 추가
let frameCounter = 0;

function ChatContent() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [myEmotion, setMyEmotion] = useState('행복');
  const [myValue, setMyValue] = useState(30);
  const [remoteEmotion, setRemoteEmotion] = useState('행복');
  const [remoteValue, setRemoteValue] = useState(30);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // 다시보기 녹화용 (Blob)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]); // 녹화 데이터 쌓는 배열
  const feedbackRef = useRef('');

  const router = useRouter();
  const room_id = useSelector((state: RootState) => state.socket.room);
  const [ID, setID] = useState('');

  const scriptRef = useRef('');
  const isRecording = useRef(false);
  const recognition = useRef<SpeechRecognition | null>(null);

  const dispatch = useDispatch();
  const rtcSocket = useSelector((state: RootState) => state.socket.socket);
  useEffect(() => {
    const token = Cookies.get('access');
    if (token) {
      const decoded = jwtDecode<UserPayload>(token);
      setID(decoded.user_id);
    } else {
      alert('유효하지 않은 접근입니다.');
      router.replace('/');
    }
  }, [router]);

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
        feedbackRef.current = result.meesage;
      } else {
        const result = await response.json();
        console.log(result.error);
      }
    } catch (error) {
      console.log('서버 오류 발생: ', error);
    }
  };

  const trySendScript = async (script: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/human/dialog`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: ID, script, room_id }),
          mode: 'cors',
        },
      );

      if (response.ok) {
        console.log('전송 성공');
      } else {
        console.log('오류 발생');
      }
    } catch (error) {
      console.log('서버 오류 발생: ', error);
    }
  };

  const handleStartRecording = () => {
    if (!recognition.current || recognition.current.state === 'running') return;

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
      }
      scriptRef.current = '';
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

    recognition.current.onerror = (event) => {
      if (event.error !== 'no-speech')
        console.error('Speech recognition error:', event.error);
    };

    recognition.current.start();
  };

  const pcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // TURN 서버도 추가하는 것을 권장
      {
        urls: 'turn:your-turn-server.com:3478',
        username: 'username',
        credential: 'password',
      },
    ],
    iceCandidatePoolSize: 10,
  };

  useEffect(() => {
    if (!rtcSocket) return;

    if (!('webkitSpeechRecognition' in window)) {
      alert('지원하지 않는 브라우저입니다.');
      return;
    }
    console.log('Chat Component UseEffect Triggerd');

    recognition.current = new (
      window as unknown as Window
    ).webkitSpeechRecognition();
    recognition.current.lang = 'ko';
    recognition.current.continuous = true;

    handleStartRecording();

    if (!room_id) {
      console.error('No room provided');
      return;
    }

    // PeerConnection 초기화
    const newPeerConnection = new RTCPeerConnection(pcConfig);

    // 미디어 스트림 초기화
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // 내 로컬 비디오에 스트림 할당하기
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // PeerConnection에 트랙 추가
        stream.getTracks().forEach((track) => {
          newPeerConnection.addTrack(track, stream);
        });

        // 연기서 MediaRecorder로 '전체 영상 Blob' 저장 로직 구현하기
        setupMediaRecorder(stream);
        rtcSocket.emit('join', { room_id: room_id });
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    const setupMediaRecorder = (stream: MediaStream) => {
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp8',
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          // Blob 조각 쌓아두기
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        // 최종적으로 recordedChunks 가 전체 동영상임
        console.log('녹화 중지됨. recordedChunks:', recordedChunks);
      };
    };

    initializeMedia();

    // PeerConnection 이벤트 핸들러 설정
    newPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        rtcSocket.emit('candidate', {
          candidate: event.candidate,
          room_id: room_id,
        });
      }
    };

    newPeerConnection.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // WebRTC 소켓 이벤트 핸들러 설정
    rtcSocket.on('peerDisconnected', async () => {
      console.log('Peer disconnected - from rtcSocket');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      alert('상대방이 연결을 종료했습니다.');
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      try {
        const response = await fetch(
          // `${process.env.NEXT_PUBLIC_SERVER_URL}/api/human/dialog/end`,
          `http://localhost:4000/api/human/dialog/end`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              room_id: room_id,
              user_id: ID,
              script: '',
            }),
            credentials: 'include',
          },
        );
        if (response.ok) {
          console.log('대화 종료 요청 성공');
        } else {
          console.error('요청을 받았지만 200을 반환하지 않음');
        }
      } catch (error) {
        console.error('대화 종료 요청 실패:', error);
      }
      router.push('/Comment');
    });

    // 방에 참가한 후 offer 생성
    rtcSocket.on('ready', async () => {
      try {
        const offer = await newPeerConnection.createOffer();
        await newPeerConnection.setLocalDescription(offer);
        rtcSocket.emit('offer', { offer, room_id });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    });

    rtcSocket.on('offer', async (offer: RTCSessionDescription) => {
      console.log('Received offer');
      try {
        await newPeerConnection.setRemoteDescription(
          new RTCSessionDescription(offer),
        );
        const answer = await newPeerConnection.createAnswer();
        await newPeerConnection.setLocalDescription(answer);
        rtcSocket.emit('answer', { answer, room_id });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    rtcSocket.on('answer', async (answer: RTCSessionDescription) => {
      console.log('Received answer');
      try {
        await newPeerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    rtcSocket.on('candidate', async (candidate: RTCIceCandidate) => {
      console.log('Received ICE candidate');
      try {
        await newPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // Canvas로 동영상 이미지로 캡쳐하고 서버로 전송하기
    const captureAndSendFrame = async () => {
      if (!room_id) return;

      const videoEl = localVideoRef.current;
      if (!videoEl) return;

      // 현재 비디오 크기 가져오기
      const vWidth = videoEl.videoWidth / 4; // 기존 해당도의 1/4 로 줄이기
      const vHeight = videoEl.videoHeight / 4;

      // 영상 아직 준비 안 되었으면 스킵하기
      if (!vWidth || !vHeight) return;

      // canvas 생성하기
      const canvas = document.createElement('canvas');
      canvas.width = vWidth;
      canvas.height = vHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // canvas에 비디오 그리기
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      // JPEG 포맷으로 Base64 인코딩
      const dataURL = canvas.toDataURL('image/jpeg', 0.7); // 70% 품질로 압축

      frameCounter += 1;

      // 현재 시간으로 타임스탬프
      const timestamp = frameCounter;

      try {
        // Node 백엔드로 POST 요청
        // 1. 감정, 동작 분석 요청
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/human/frameInfo`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              frame: dataURL,
              timestamp: timestamp,
              user_id: ID,
              room_id: room_id,
            }),
            mode: 'cors',
            credentials: 'include',
          },
        );

        if (!response.ok) {
          console.error('감정 및 동작 분석 응답 에러:', response.status);
          return;
        }

        // Flask -> Node -> 클라이언트로 넘어온 최종 결과
        const analyzeResult = await response.json();
        console.log('감정 및 동작 분석 결과:', analyzeResult);
        //user1, user2 구분
        const { user1, user2 } = analyzeResult.data;
        //감정 및 비율 받아오기
        // 타입 가드 추가
        if (
          typeof user1.emo_analysis_result?.dominant_emotion === 'string' &&
          typeof user1.emo_analysis_result?.percentage === 'number'
        ) {
          if (user1.user_id === ID) {
            setMyEmotion(user1.emo_analysis_result.dominant_emotion);
            setMyValue(user1.emo_analysis_result.percentage);
            setRemoteEmotion(user2.emo_analysis_result.dominant_emotion);
            setRemoteValue(user2.emo_analysis_result.percentage);
          } else {
            setMyEmotion(user2.emo_analysis_result.dominant_emotion);
            setMyValue(user2.emo_analysis_result.percentage);
            setRemoteEmotion(user1.emo_analysis_result.dominant_emotion);
            setRemoteValue(user1.emo_analysis_result.percentage);
          }
        }
      } catch (error) {
        console.error('전송 에러: ', error);
      }
    };

    // 일정 간격(1초)에 한 번씩 캡쳐하기
    const intervalId = setInterval(() => {
      captureAndSendFrame();
    }, 1500); // 1.5초마다

    // 정리 함수
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      // 스트림 정리
      if (localVideoRef.current?.srcObject) {
        const tracks = (
          localVideoRef.current.srcObject as MediaStream
        ).getTracks();
        tracks.forEach((track) => track.stop());
      }

      // PeerConnection 정리
      if (newPeerConnection.signalingState !== 'closed') {
        newPeerConnection.close();
      }

      rtcSocket.off('peerDisconnected');

      // Recognition 정리
      if (recognition.current) {
        recognition.current.stop();
        isRecording.current = false;
      }
      clearInterval(intervalId);
    };
  }, [room_id, recordedChunks, dispatch, router, ID, rtcSocket]);

  const handleNavigation = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      console.log('녹화 중지됨!');

      const completeBlob = new Blob(recordedChunks, { type: 'video/webm' });
      console.log('완성된 영상 Blob: ', completeBlob);
    }

    // socket 상태 대신 rtcSocket 직접 사용
    const currentSocket = rtcSocket;
    if (currentSocket) {
      console.log('Sending endCall event with room:', room_id);
      currentSocket.emit('endCall', { room_id: room_id });
    } else {
      console.log('Socket is not available');
    }

    try {
      const response = await fetch(
        // `${process.env.NEXT_PUBLIC_SERVER_URL}/api/human/dialog/end`,
        `http://localhost:4000/api/human/dialog/end`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: room_id,
            user_id: ID,
            script: '',
          }),
          credentials: 'include',
        },
      );
      if (response.ok) {
        console.log('대화 종료 요청 성공');
      } else {
        console.error('요청을 받았지만 200을 반환하지 않음');
      }
    } catch (error) {
      console.error('대화 종료 요청 실패:', error);
    }

    router.push('/Comment');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <div className={styles.videoContainer}>
          <Videobox
            videoref={localVideoRef}
            keys={myEmotion}
            value={myValue}
            autoplay={true}
            playsinline={true}
            muted={true}
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
        <Videobox
          videoref={remoteVideoRef}
          keys={remoteEmotion}
          value={remoteValue}
          autoplay={true}
          playsinline={true}
          muted={false}
        />
      </div>
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
