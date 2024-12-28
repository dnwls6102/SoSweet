'use client';

import styles from './page.module.css';
import React, { useEffect, useRef } from 'react';
import '@mediapipe/face_detection'; // Mediapipe 라이브러리 포함
import '@mediapipe/camera_utils'; // Mediapipe 카메라 유틸 포함

export default function FaceFilter() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const setupFaceFilter = async () => {
      if (!videoRef.current || !canvasRef.current) {
        console.error('Video or Canvas element is missing.');
        return;
      }

      // Mediapipe Face Detection 설정
      const faceDetection = new (window as any).FaceDetection({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });

      faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.5,
      });

      // 캔버스 설정
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Canvas 2D context could not be initialized.');
        return;
      }

      // 스티커 이미지 로드
      const sticker = new Image();
      sticker.src = '/sticker.png';
      await new Promise<void>((resolve, reject) => {
        sticker.onload = () => resolve();
        sticker.onerror = () => reject(new Error('Failed to load sticker image.'));
      });

      // 얼굴 감지 결과 처리
      faceDetection.onResults((results: any) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);

        if (results.detections) {
          results.detections.forEach((detection: any) => {
            const boundingBox = detection.boundingBox;
            const x = (boundingBox.xCenter - boundingBox.width / 2) * canvas.width;
            const y = (boundingBox.yCenter - boundingBox.height / 2) * canvas.height;
            const width = boundingBox.width * canvas.width;
            const height = boundingBox.height * canvas.height;

            ctx.drawImage(sticker, x, y, width, height);
          });
        }
      });

      // 카메라 설정
      const setupCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
          });
          videoRef.current!.srcObject = stream;
          await videoRef.current!.play();
        } catch (error) {
          console.error('Error accessing camera:', error);
        }
      };

      await setupCamera();

      const renderFrame = async () => {
        try {
          await faceDetection.send({ image: videoRef.current! });
          requestAnimationFrame(renderFrame);
        } catch (error) {
          console.error('Error in renderFrame:', error);
        }
      };

      renderFrame();
    };

    setupFaceFilter();
  }, []);

  return (
    <div className={styles.app}>
      <h1 className={styles.heading}>Face Filter Test</h1>
      <div className={styles['video-container']}>
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
        <canvas ref={canvasRef} width={640} height={480} />
      </div>
    </div>
  );
}
