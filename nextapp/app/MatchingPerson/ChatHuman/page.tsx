'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';
import Videobox from '@/components/videobox';
import io, { Socket } from 'socket.io-client';

export default function Chat() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io('http://localhost:4000', { path: '/api/match' });
    setSocket(socketInstance);

    // Configure ICE servers
    const pcConfig: RTCConfiguration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };

    // Initialize PeerConnection
    const pc = new RTCPeerConnection(pcConfig);
    setPeerConnection(pc);

    // Handle local stream
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: { width: 640, height: 480 } })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        pc.addStream(stream);
      })
      .catch((error) => console.error('Error accessing media devices:', error));

    // Handle ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && socketInstance) {
        socketInstance.emit('message', {
          type: 'candidate',
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    pc.onaddstream = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.stream;
      }
    };

    // Handle socket messages
    socketInstance.on('message', (message) => {
      if (!peerConnection) return;

      if (message.type === 'offer') {
        pc.setRemoteDescription(new RTCSessionDescription(message));
        pc.createAnswer()
          .then((desc) => {
            pc.setLocalDescription(desc);
            socketInstance.emit('message', desc);
          })
          .catch((error) => console.error('Error creating answer:', error));
      } else if (message.type === 'answer') {
        pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate') {
        pc.addIceCandidate(new RTCIceCandidate(message.candidate));
      } else if (message === 'bye') {
        handleHangup();
      }
    });

    // Cleanup on component unmount
    return () => {
      pc.close();
      socketInstance.disconnect();
      setPeerConnection(null);
    };
  }, []);

  // Handle call hangup
  const handleHangup = () => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (socket) {
      socket.emit('message', 'bye');
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <Videobox videoref={localVideoRef} keys="호감도" value={50} autoplay muted playsinline />
      </div>
      <div className={styles.right}>
        <Videobox videoref={remoteVideoRef} keys="호감도" value={50} autoplay playsinline />
        <button className={styles.endButton} onClick={handleHangup}>
          통화 종료
        </button>
      </div>
    </div>
  );
}
