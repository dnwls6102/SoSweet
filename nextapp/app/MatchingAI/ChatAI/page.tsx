'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Videobox from '../../../components/videobox';

export default function Chat() {
  const isRecording = useRef(false);
  const [transcript, setTranscript] = useState('');
  const router = useRouter();
  const recognition = useRef<SpeechRecognition | null>(null);

  const handleStartRecording = () => {
    if (!recognition.current) return;

    recognition.current.onstart = () => {
      isRecording.current = true;
      console.log('Speech recognition started');
    };

    recognition.current.onspeechstart = () => {
      console.log('사용자가 말을 시작함');
    };

    recognition.current.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + event.results[i][0].transcript);
        }
      }
    };

    recognition.current.onspeechend = () => {
      console.log('onspeechend called');
      console.log('Final transcript:', transcript);
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
      console.error('Speech recognition error:', event.error);
    };

    recognition.current.start();
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

    return () => {
      recognition.current?.stop();
      isRecording.current = false;
    };
  }, []);

  const handleNavigation = () => {
    router.push('/Feedback');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <Videobox videoref={null} keys={'호감도'} value={10} />
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
