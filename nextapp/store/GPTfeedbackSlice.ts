import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GPTfeedbackState {
  summary: string;
  audioUrl: string;
}

const initialState: GPTfeedbackState = {
  summary: '',
  audioUrl: '',
};

export const GPTfeedbackSlice = createSlice({
  name: 'GPTfeedback',
  initialState,
  reducers: {
    setGPTFeedback: (state, action: PayloadAction<string>) => {
      state.summary = action.payload;
    },
    setGPTAudioUrl: (state, action: PayloadAction<string>) => {
      state.audioUrl = action.payload;
    },
  },
});

export const { setGPTFeedback, setGPTAudioUrl } = GPTfeedbackSlice.actions;
export default GPTfeedbackSlice.reducer;
