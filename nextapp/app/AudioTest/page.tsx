'use client';

import { useState, useEffect, useRef } from 'react';

export default function RecordingView() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      startAudioStream();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  });

  const startAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); //사용자로부터 마이크 입력을 요청함

      //오디오 관련 작업을 하기 위해서는 audioContext를 만들어야 함
      const audioContext = new AudioContext();
      //AudioContext를 추적하는 useRef에 audioContext를 저장
      audioContextRef.current = audioContext;

      //오디오 소스 설정 : 실시간 음성을 받아오면 createMediaStreamSource로, 파일을 받아오면 createMediaElementSource로
      const audioSource = audioContext.createMediaStreamSource(stream);
      //오디오 소스를 출력하는 노드 생성 : 음성 스트림을 MediaStreamAudioDestinationNode에 저장시킴
      //이 DestinationNode는 WebRTC와 연계되어, 사용자 컴퓨터에 저장되거나 다른 사용자에게 보낼 수 있음
      const audioAnalyser = audioContext.createAnalyser();
      audioAnalyser.fftSize = 2048;

      //오디오 소스와 출력 노드를 연결
      audioSource.connect(audioAnalyser);

      analyserRef.current = audioAnalyser;

      //MediaRecorder를 생성하고, useRef에 저장
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      console.log('시작');
      //오디오 녹음이 시작되면 chunks 배열에 데이터를 저장
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
        console.log('222');

        if (audioChunksRef.current.length >= 1) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/mp3',
          });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          const formData = new FormData();
          formData.append('file', audioBlob);
          formData.append('model', 'whisper-1');

          try {
            console.log('보내기직전');
            const response = await fetch(
              'https://api.openai.com/v1/audio/transcriptions',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer sk-G51yx7dlIhhTvyH1wMGgCJbljLYvCNbnoT31NHCwssT3BlbkFJAkhxe6GU7JewkIfGI8TBXagmKDfdcJaJ7h2qWpE1oA`,
                },
                body: formData,
              },
            );
            if (response.ok) {
              const result = await response.json();
              console.log(result.text);
              setTranscript(result.text);
              /* 서버로 transcript 보내는 함수 호출 지점 */
            } else {
              console.error('Error1:', response.status, response.statusText);
            }
          } catch (error) {
            console.error('Error2:', error);
          }
          console.log('3333');
          audioChunksRef.current = [];
        }
      };

      //녹음 시작
      mediaRecorder.start();
      //Flag를 true로 변경
      setIsRecording(true);
    } catch (error) {
      console.error('Error Accessing audio stream:', error);
    }
  };

  //오디오 녹음을 중지하는 함수
  const stopAudioStream = () => {
    //AudioContext가 존재한다면
    if (audioContextRef.current) {
      //AudioContext를 닫음
      audioContextRef.current.close();
      //AudioContext를 null로 초기화
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    //Flag를 false로 변경
    setIsRecording(false);
  };

  //   useEffect(() => {
  //     startAudioStream();
  //     return () => {
  //         if (mediaRecorderRef.current) {

  //         }
  //     }
  //   })

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Audio Transcript</h1>
      <button onClick={isRecording ? stopAudioStream : startAudioStream}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <div style={{ marginTop: '20px' }}>
        <textarea value={transcript} readOnly></textarea>
      </div>
    </div>
  );
}
