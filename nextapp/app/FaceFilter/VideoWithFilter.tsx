'use client';

import React, { useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export default function VideoWithFilter() {
  const videoRef = useRef<HTMLVideoElement | null>(null); // 비디오 요소 타입
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 캔버스 요소 타입
  const stickerRef = useRef<HTMLImageElement | null>(null); // 이미지 요소 타입

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // 모델 경로 설정
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
    };

    const loadSticker = () => {
      const sticker = new Image();
      sticker.src = '/sticker.png';
      stickerRef.current = sticker;
    };

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    const detectFaces = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const detectAndDraw = async () => {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 })
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        detections.forEach((detection) => {
          const { x, y, width, height } = detection.box;
          const sticker = stickerRef.current;

          if (sticker) {
            const stickerWidth = width * 1.5;
            const stickerHeight = height * 1.5;
            ctx.drawImage(
              sticker,
              x - width * 0.25,
              y - height * 0.5,
              stickerWidth,
              stickerHeight
            );
          }
        });

        requestAnimationFrame(detectAndDraw);
      };

      detectAndDraw();
    };

    loadModels().then(() => {
      loadSticker();
      startVideo();
      videoRef.current?.addEventListener('play', () => {
        detectFaces();
      });
    });
  }, []);

  return (
    <div style={{ position: 'relative', width: '640px', height: '480px' }}>
      <video
        ref={videoRef}
        autoPlay
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