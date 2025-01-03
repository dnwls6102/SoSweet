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
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
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

    let localStream: MediaStream | null = null;
    let newPeerConnection: RTCPeerConnection | null = null;

    // 미디어 스트림 초기화
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStream = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    // WebRTC 초기화
    const initializeWebRTC = () => {
      // PeerConnection 초기화
      newPeerConnection = new RTCPeerConnection(pcConfig);
      setPeerConnection(newPeerConnection);

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          if (newPeerConnection) {
            newPeerConnection.addTrack(track, localStream!);
          }
        });
      }

      // PeerConnection 이벤트 핸들러 설정
      newPeerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log('Sending ICE candidate');
          socket.emit('candidate', {
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
    };

    // 소켓 연결 및 이벤트 설정
    const initializeSocket = () => {
      const newSocket = io(
        process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000',
        {
          path: '/api/match',
          transports: ['websocket'],
        },
      );
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        // 소켓 연결 후 방 참가
        newSocket.emit('join', { room });
      });

      newSocket.on('ready', async () => {
        if (newPeerConnection) {
          try {
            const offer = await newPeerConnection.createOffer();
            await newPeerConnection.setLocalDescription(offer);
            newSocket.emit('offer', { offer, room });
          } catch (error) {
            console.error('Error creating offer:', error);
          }
        }
      });

      newSocket.on('offer', async (offer: RTCSessionDescription) => {
        if (newPeerConnection) {
          try {
            await newPeerConnection.setRemoteDescription(
              new RTCSessionDescription(offer),
            );
            const answer = await newPeerConnection.createAnswer();
            await newPeerConnection.setLocalDescription(answer);
            newSocket.emit('answer', { answer, room });
          } catch (error) {
            console.error('Error handling offer:', error);
          }
        }
      });

      newSocket.on('answer', async (answer: RTCSessionDescription) => {
        if (newPeerConnection) {
          try {
            await newPeerConnection.setRemoteDescription(
              new RTCSessionDescription(answer),
            );
          } catch (error) {
            console.error('Error handling answer:', error);
          }
        }
      });

      newSocket.on('candidate', async (candidate: RTCIceCandidate) => {
        if (newPeerConnection) {
          try {
            await newPeerConnection.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          } catch (error) {
            console.error('Error handling ICE candidate:', error);
          }
        }
      });

      return newSocket;
    };

    // 초기화 순서 관리
    const initialize = async () => {
      await initializeMedia();
      initializeWebRTC();
      const newSocket = initializeSocket();

      // 정리 함수 반환
      return () => {
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }
        if (newPeerConnection) {
          newPeerConnection.close();
        }
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    };

    // 초기화 실행
    initialize();
  }, [room]);

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
