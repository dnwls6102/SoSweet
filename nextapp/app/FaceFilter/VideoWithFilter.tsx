'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as faceDetection from '@mediapipe/face_detection';
import * as tf from '@tensorflow/tfjs';

export default function VideoWithFilter() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stickerRef = useRef<HTMLImageElement | null>(null);
  const [isStickerLoaded, setStickerLoaded] = useState(false);

  // 스티커 로드
  const loadSticker = () => {
    const sticker = new Image();
    sticker.src = '/sticker.png'; // 올바른 경로
    sticker.onload = () => {
      stickerRef.current = sticker;
      setStickerLoaded(true);  // 스티커가 로드되었음을 state로 관리
      console.log('Sticker loaded');
    };
    sticker.onerror = () => {
      console.error('Failed to load sticker');
    };
  };

  // 비디오 스트리밍 시작
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      console.log('Video started');
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  // 얼굴 인식 및 스티커 렌더링
  const detectFaces = async () => {
    if (!isStickerLoaded) {
      console.log('Sticker is not loaded');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mediapipe face detection 초기화
    const detector = new faceDetection.FaceDetection(
      {
        model: 'short',
        minDetectionConfidence: 0.2,
      }
    );

    detector.setOptions({
      selfieMode: true,
      maxNumFaces: 1,  // 감지할 얼굴 수 설정
    });

    const processFrame = async () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 얼굴 감지
      const faces = await detector.send({ image: video });

      if (faces && faces.length > 0) {
        const face = faces[0];

        console.log('Face detected:', face);

        // stickerRef.current가 null이 아닐 경우에만 스티커를 렌더링
        if (stickerRef.current) {
          const sticker = stickerRef.current;
          const stickerWidth = 100;
          const stickerHeight = 100;

          // 얼굴 위치 계산
          const x = face.boundingBox.topLeft[0] + face.boundingBox.width / 2 - stickerWidth / 2;
          const y = face.boundingBox.topLeft[1] + face.boundingBox.height / 2 - stickerHeight / 2;

          // 스티커 렌더링
          ctx.drawImage(sticker, x, y, stickerWidth, stickerHeight);
        } else {
          console.warn('Sticker image is not available');
        }
      }

      // 얼굴을 감지하는 새로운 프레임을 처리
      requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  useEffect(() => {
    loadSticker();  // 스티커 로드
    startVideo();   // 비디오 스트리밍 시작
  }, []);

  useEffect(() => {
    detectFaces();  // 얼굴 추적 시작
  }, [isStickerLoaded]);

  return (
    <div style={{ position: 'relative', width: '640px', height: '480px' }}>
      <video
        ref={videoRef}
        muted
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}
