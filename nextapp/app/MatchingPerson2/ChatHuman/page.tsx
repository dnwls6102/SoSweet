'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import 'webrtc-adapter';
import styles from './page.module.css';
import Videobox from '@/components/videobox';

export default function Chat() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();
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
    // 소켓 연결 초기화
    const newSocket = io('http://localhost:4000', {
      path: '/api/match',
      transports: ['websocket'],
      query: {
        userId: 'rgb10', // 두 번째 사용자 ID
      },
    });
    setSocket(newSocket);

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

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          newPeerConnection.addTrack(track, stream);
        });

        // 연결이 성공하면 시그널링 시작
        newSocket.emit('startMatching', { id: 'rgb10', gender: '여성' });
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    initializeMedia();

    // PeerConnection 이벤트 핸들러 설정
    newPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate:', event.candidate);
        newSocket.emit('candidate', event.candidate);
      }
    };

    newPeerConnection.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // 소켓 이벤트 핸들러 설정
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('offer', async (offer: RTCSessionDescriptionInit) => {
      console.log('Received offer');
      try {
        await newPeerConnection.setRemoteDescription(
          new RTCSessionDescription(offer),
        );
        const answer = await newPeerConnection.createAnswer();
        await newPeerConnection.setLocalDescription(answer);
        newSocket.emit('answer', answer);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    newSocket.on('answer', async (answer: RTCSessionDescriptionInit) => {
      console.log('Received answer');
      try {
        await newPeerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    newSocket.on('candidate', async (candidate: RTCIceCandidateInit) => {
      console.log('Received ICE candidate');
      try {
        await newPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // 정리 함수
    return () => {
      if (newPeerConnection) {
        newPeerConnection.close();
      }
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const handleNavigation = () => {
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
