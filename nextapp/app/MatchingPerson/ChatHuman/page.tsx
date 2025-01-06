'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import 'webrtc-adapter';
import styles from './page.module.css';
import Videobox from '@/components/videobox';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  user_id: string;
  iat: number; 
  exp: number;
}

export default function Chat() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null); // WEBRTC용
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // 다시보기 녹화용 (Blob)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]); // 녹화 데이터 쌓는 배열

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

  const trySendScript = async (script: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/human/dialog`, {
      // const response = await fetch('http://localhost:4000/api/human/dialog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id, script, room_id }),
        mode: 'cors',
      });

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

    // PeerConnection 초기화
    const newPeerConnection = new RTCPeerConnection(pcConfig);
    // setPeerConnection(newPeerConnection);

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

        // 연결되면 시그널링 시작 (방에 참가)
        rtcSocket.emit('join', { room_id });

        // 여기서 MediaRecorder로 '전체 영상 Blob' 저장 로직 구현하기 => 대화 끝나고 S3 업로드 할 때 필요

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
    rtcSocket.on('connect', () => {
      console.log('Socket connected:', rtcSocket.id);
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
      const videoEl = localVideoRef.current;
      if (!videoEl) return;

      // 현재 비디오 크기 가져오기
      const vWidth = videoEl.videoWidth / 3; // 기존 해당도의 1/3 로 줄이기
      const vHeight = videoEl.videoHeight / 3;

      if (!vWidth || !vHeight) {
        // 영상 아직 준비 안 되었으면 스킵하기
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
      const dataURL = canvas.toDataURL('image/jpeg', 0.7);  // 70% 품질로 압축

      try {
        // Node 백엔드로 POST 요청
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/human/faceinfo`, {
        // const response = await fetch('http://localhost:4000/api/human/faceinfo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            frame: dataURL,
            user_id: user_id,
            room_id: room_id,
          }),
          mode: 'cors',
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.error('Node 서버 응답 에러:', response.status);
          return;
        }

        // Flask -> Node -> 클라이언트로 넘어온 최종 결과
        const result = await response.json();
        console.log('분석 결과:', result);

      } catch (error) {
        console.error('전송 에러: ', error)
      }
    };

    // 일정 간격(1초)에 한 번씩 캡쳐하기
    const intervalId = setInterval(() => {
      captureAndSendFrame();
    }, 1000); // 1초마다

    // 상대방 연결 종료 처리
    rtcSocket.on('peerDisconnected', () => {
      console.log('Peer disconnected');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      //소켓 연결 종료시키고
      //상대방 평가 화면으로 router.push 시켜주기
    });

    // 정리 함수
    return () => {
      if (newPeerConnection) {
        newPeerConnection.close();
      }
      if (rtcSocket) {
        rtcSocket.disconnect();
      }

      recognition.current?.stop();
      isRecording.current = false;

      clearInterval(intervalId);
    };
  }, [room_id, recordedChunks]);

  const handleNavigation = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      console.log('녹화 중지됨!');

      const completeBlob = new Blob(recordedChunks, { type: 'video/webm' });
      console.log('완성된 영상 Blob: ', completeBlob);
      
      // S3 업로드 로직
    }
    // 페이지 이동하기 (여기에 recordedChunks를 합쳐서 S3 업로드 추가 로직 구현해야함)
    router.push('/Comment');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <Videobox
          videoref={localVideoRef}
          keys={keys}
          value={value}
          autoplay={true}
          playsinline={true}
          muted={true}
        />
      </div>
      <div className={styles.right}>
        <Videobox
          videoref={remoteVideoRef}
          keys={keys}
          value={value}
          autoplay={true}
          playsinline={true}
          muted={false}
        />
        <button className={styles.endButton} onClick={handleNavigation}>
          대화 종료
        </button>
      </div>
    </div>
  );
}
