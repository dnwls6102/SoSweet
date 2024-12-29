'use client';

import { useState } from 'react';

export default function WebSpeechSTT() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Web Speech API is not supported in this browser.');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'ko'; // 언어 설정
    recognition.interimResults = true; // 중간 결과 표시 여부
    recognition.continuous = true; // 연속 음성 입력 여부

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Speech recognition started');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + event.results[i][0].transcript);
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      console.log('Interim transcript:', interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('Speech recognition ended');
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    const recognition = (window as any).webkitSpeechRecognition;
    if (recognition) recognition.stop();
  };

  return (
    <div>
      <h1>Web Speech API STT</h1>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      <p>Transcript: {transcript}</p>
    </div>
  );
}
