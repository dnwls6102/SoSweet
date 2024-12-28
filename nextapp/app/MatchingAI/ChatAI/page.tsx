'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Videobox from '../../../components/videobox'; // 상대 경로로 수정

export default function Chat() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]); // 오디오 청크 저장
  const [vadTimeout, setVadTimeout] = useState<NodeJS.Timeout | null>(null); // VAD 타임아웃(녹음 종료)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // 미디어 레코더 참조
  const videoref = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const keys = '호감도';
  const value = 10;

  const handleNavigation = () => {
    router.push('/Feedback');
  };

  // 녹음 시작하는 함수
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');

        try {
          const response = await fetch(
            'https://api.openai.com/v1/audio/transcriptions',
            {
              method: 'POST',
              headers: {
                Authorization: `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`,
              },
              body: formData,
            },
          );

          if (response.ok) {
            const result = await response.json();
            setTranscript(result.transcript);
          } else {
            console.error('Error1:', response.statusText);
          }
        } catch (error) {
          console.error('Error2:', error);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      detectSilence(mediaRecorderRef.current);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // 녹음 종료하는 함수
  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 침묵 감지하는 함수
  const detectSilence = (mediaRecorder: MediaRecorder) => {
    if (vadTimeout) clearTimeout(vadTimeout);
    setVadTimeout(
      setTimeout(() => {
        console.log('Silence detected, stop recording');
        mediaRecorder.stop();
        handleStopRecording();
      }, 3000),
    );
  };

  useEffect(() => {
    handleStartRecording();
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <Videobox videoref={videoref} keys={keys} value={value} />
      </div>
      <div className={styles.right}>
        <textarea
          className={styles.textarea}
          readOnly
          value={transcript}
        ></textarea>
        <button className={styles.endButton} onClick={handleNavigation}>
          대화 종료
        </button>
      </div>
    </div>
  );
}
