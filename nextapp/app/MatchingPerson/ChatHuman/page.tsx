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
  const [socketApi, setSocketApi] = useState<Socket | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const room = searchParams.get('room');
  const keys = '행복';
  const value = 30;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);


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

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          newPeerConnection.addTrack(track, stream);
        });

        // 연결되면 시그널링 시작
        rtcSocket.emit('join', { room });
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
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

    // 소켓 이벤트 핸들러 설정
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

    // 영상 보내기
    const sendImage = () => {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
        })
        .then((stream) => {
          // 감정 분석용 비디오 요소
          mediaRecorderRef.current = new MediaRecorder(stream);

          mediaRecorderRef.current.ondataavailable = (event) => {
              if (event.data.size > 0 ) {
                  console.log(event.data);
                // && ++send_time_cnt >= send_time_limit) {
                  // $.ajax({
                  //   url: "http://localhost:5000/api/analyze",
                  //   type: "POST",
                  //   contentType: "application/json",
                  //   data: JSON.stringify({
                  //     user_id: "test",
                  //     frame: event.data
                  //   })
                  // })
                  apiSocket.emit('video-chunk', event.data);
                  // image_buffer = [];
              }
          }

    mediaRecorderRef.current.start(1000);
  });
    }

    sendImage();

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
    };
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
