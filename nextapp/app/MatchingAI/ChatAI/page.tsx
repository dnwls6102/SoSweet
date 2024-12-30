'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Videobox from '../../../components/videobox';

export default function Chat() {
  const isRecording = useRef(false);
  const [transcript, setTranscript] = useState('');
  const scriptRef = useRef('');
  const router = useRouter();
  const recognition = useRef<SpeechRecognition | null>(null);

  const trySendScript = async (script: string) => {
    try {
      const response = await fetch('/api/ai/dialog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script }),
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
          setTranscript((prev) => prev + event.results[i][0].transcript);
          scriptRef.current += event.results[i][0].transcript;
        }
      }
      console.log('Transcription result: ', scriptRef.current);
      //trySendScript(scriptRef.current)
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
