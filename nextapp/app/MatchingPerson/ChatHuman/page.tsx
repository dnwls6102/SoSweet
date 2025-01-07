'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import 'webrtc-adapter';
import styles from './page.module.css';
import Image from 'next/image';
import Videobox from '@/components/videobox';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { setReduxSocket, setRoom } from '../../../store/socketSlice';

interface UserPayload {
  user_id: string;
  iat: number;
  exp: number;
}

export default function Chat() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [myEmotion, setMyEmotion] = useState('행복');
  const [myValue, setMyValue] = useState(30);
  const [remoteEmotion, setRemoteEmotion] = useState('행복');
  const [remoteValue, setRemoteValue] = useState(30);

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null); // WEBRTC용
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // 다시보기 녹화용 (Blob)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]); // 녹화 데이터 쌓는 배열
  const [feedback, setFeedback] = useState('');

  const router = useRouter();
  const token = Cookies.get('access');
  let ID = '';
  if (token) {
    const decoded = jwtDecode<UserPayload>(token);
    ID = decoded.user_id;
  } else {
    alert('유효하지 않은 접근입니다.');
    router.replace('/');
  }

  const searchParams = useSearchParams();
  const room_id = searchParams.get('room');
  const keys = '행복';
  const value = 30;
  const user_id = ID;

  const scriptRef = useRef('');
  const isRecording = useRef(false);
  const recognition = useRef<SpeechRecognition | null>(null);

  const dispatch = useDispatch();

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
      console.log('서버 오류 발생');
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
          body: JSON.stringify({ user_id, script, room_id }),
          mode: 'cors',
        },
      );

      if (response.ok) {
        console.log('전송 성공');
      } else {
        console.log('오류 발생');
      }
    } catch (error) {
      console.log('서버 오류 발생');
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
      tryNlp(scriptRef.current);

      trySendScript(scriptRef.current);
      //여기에다가 음성 인식 결과를 보낼 경우 : 변환 결과를 바로바로 보내주기 때문에
      //말을 끊었는지 여부도 조금 더 명확하게 판단 가능할수도 있다
      //이렇게 되면 남,녀 구분은 어떻게 해야할지?
      //서버에서 문자열을 받을 때마다 (남)표시를 하면 script가 정상적으로 생성될련지
      //부하가 많이 걸리는지? 실제로 만족스러울 정도로 통신이 될련지는 생각해봐야 함
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
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('지원하지 않는 브라우저입니다.');
      return;
    }

    recognition.current = new (window as any).webkitSpeechRecognition();
    recognition.current.lang = 'ko';
    recognition.current.continuous = true;

    handleStartRecording();

    if (!room_id) {
      console.error('No room provided');
      return;
    }

    // 소켓 연결 초기화 - WebRTC 연결용 Socket
    const rtcSocket = io(
      process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000',
      {
        path: '/api/match',
        transports: ['websocket'],
      },
    );
    setSocket(rtcSocket);
    dispatch(setReduxSocket(rtcSocket));
    dispatch(setRoom(room_id));

    // 소켓 연결 확인 및 방 참가
    rtcSocket.on('connect', () => {
      console.log('Socket connected and stored in Redux:', rtcSocket.id);
      // 연결 후 방에 참가
      rtcSocket.emit('join', { room: room_id });
    });

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
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/human/dialog/end`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              room_id: room_id,
              user_id: user_id,
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

      // 현재 시간으로 타임스탬프
      const timestamp = Date.now();

      try {
        // Node 백엔드로 POST 요청
        // 1. 감정, 동작 분석 요청
        const response = await fetch(
          'http://localhost:4000/api/human/frameInfo',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              frame: dataURL,
              timestamp: timestamp,
              user_id: user_id,
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
        if (user1.user_id === user_id) {
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

        console.log('룸 아이디를 확인하시오:', room_id);
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
      if (newPeerConnection) {
        newPeerConnection.close();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      rtcSocket.off('peerDisconnected');
      recognition.current?.stop();
      isRecording.current = false;
      clearInterval(intervalId);
    };
  }, [room_id, recordedChunks, dispatch, router]);

  const handleNavigation = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      console.log('녹화 중지됨!');

      const completeBlob = new Blob(recordedChunks, { type: 'video/webm' });
      console.log('완성된 영상 Blob: ', completeBlob);
    }

    // socket 상태 대신 rtcSocket 직접 사용
    const currentSocket = socket;
    if (currentSocket) {
      console.log('Sending endCall event with room:', room_id);
      currentSocket.emit('endCall', { room: room_id });
    } else {
      console.log('Socket is not available');
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/human/dialog/end`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_id: room_id,
            user_id: user_id,
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
