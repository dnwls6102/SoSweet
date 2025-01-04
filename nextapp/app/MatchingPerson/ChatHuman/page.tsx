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
  // const [socketForApi, setSocketForApi] = useState<Socket | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const room = searchParams.get('room');
  const keys = '행복';
  const value = 30;
  const userID = 'dnwls6102';

  const scriptRef = useRef('');
  const isRecording = useRef(false);
  const recognition = useRef<SpeechRecognition | null>(null);

  const trySendScript = async (script: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/human/dialog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userID, script }),
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

    if (!room) {
      console.error('No room provided');
      return;
    }

    // 소켓 연결 초기화
    const newSocket = io('http://localhost:4000', {
      path: '/api/match',
      transports: ['websocket'],
    });
    setSocket(newSocket);

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

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          newPeerConnection.addTrack(track, stream);
        });

        // 연결되면 시그널링 시작
        newSocket.emit('join', { room });
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    initializeMedia();

    // PeerConnection 이벤트 핸들러 설정
    newPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        newSocket.emit('candidate', {
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
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    // 방에 참가한 후 offer 생성
    newSocket.on('ready', async () => {
      try {
        const offer = await newPeerConnection.createOffer();
        await newPeerConnection.setLocalDescription(offer);
        newSocket.emit('offer', { offer, room });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    });

    newSocket.on('offer', async (offer: RTCSessionDescription) => {
      console.log('Received offer');
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
    });

    newSocket.on('answer', async (answer: RTCSessionDescription) => {
      console.log('Received answer');
      try {
        await newPeerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    newSocket.on('candidate', async (candidate: RTCIceCandidate) => {
      console.log('Received ICE candidate');
      try {
        await newPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // 상대방 연결 종료 처리
    newSocket.on('peerDisconnected', () => {
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
      if (newSocket) {
        newSocket.disconnect();
      }

      recognition.current?.stop();
      isRecording.current = false;
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
