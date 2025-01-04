'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import 'webrtc-adapter';
import styles from './page.module.css';
import Videobox from '@/components/videobox';

export default function Chat() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);  // WEBRTC용
  const [socketApi, setSocketApi] = useState<Socket | null>(null);  // SoSweet_API용
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);  // 다시보기 녹화용 (Blob)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);  // 녹화 데이터 쌓는 배열
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const room = searchParams.get('room');
  const keys = '행복';
  const value = 30;
  

  const pcConfig = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  };

  useEffect(() => {
    if (!room) {
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

    // 소켓 연결 초기화 - SoSweet_API
    const apiSocket = io(
      'http://localhost:5000',
      {
        transports: ['websocket'],
      },
    );
    setSocketApi(apiSocket);


    // PeerConnection 초기화
    const newPeerConnection = new RTCPeerConnection(pcConfig);
    setPeerConnection(newPeerConnection);

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
        rtcSocket.emit('join', { room });

        // 여기서 MediaRecorder로 '전체 영상 Blob' 저장 로직 구현하기 => 대화 끝나고 S3 업로드 할 때 필요

        setupMediaRecorder(stream);
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    const setupMediaRecorder = (stream: MediaStream) => {
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp8'
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
          room: room,
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
        rtcSocket.emit('offer', { offer, room });
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
        rtcSocket.emit('answer', { answer, room });
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
    const captureAndSendFrame = () => {
      if (!localVideoRef.current) return;
      const videoEl = localVideoRef.current;
      
      // 현재 비디오 크기 가져오기
      const vWidth = videoEl.videoWidth;
      const vHeight = videoEl.videoHeight;

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
      ctx.drawImage(videoEl, 0, 0, vWidth, vHeight);

      // toDataURL로 이미지(Base64) 추출
      const dataURL = canvas.toDataURL('image/png');

      //소켓을 통해 서버로 전송 (감정, 동작 두 종류)
      apiSocket.emit('emotion-chunk', { user_id: 'test', frame: dataURL });
      apiSocket.emit('action-chunk', { user_id: 'test', frame: dataURL });
    };

    // 일정 간격(1초)에 한 번씩 캡쳐하기
    const intervalId = setInterval(() => {
      captureAndSendFrame();
    }, 1000);  // 1초마다


    // 상대방 연결 종료 처리
    rtcSocket.on('peerDisconnected', () => {
      console.log('Peer disconnected');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    // 정리 함수
    return () => {
      if (newPeerConnection) {
        newPeerConnection.close();
      }
      if (rtcSocket) {
        rtcSocket.disconnect();
      }

      clearInterval(intervalId);
    };
  }, [room, recordedChunks]);

  const handleNavigation = () => {
    mediaRecorderRef.current.stop();
    console.log('녹화 중지!')

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
