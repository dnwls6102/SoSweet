import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FeedbackState {
  summary: string;
  userID: string;
  emotionData: any[];
}

const initialState: FeedbackState = {
  summary: '',
  userID: '',
  emotionData: [],
};

export const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    setSummary: (state, action: PayloadAction<string>) => {
      state.summary = action.payload;
    },
    setUserID: (state, action: PayloadAction<string>) => {
      state.userID = action.payload;
    },
    setEmotionData: (state, action: PayloadAction<any[]>) => {
      state.emotionData = action.payload;
    },
    clearFeedback: (state) => {
      state.summary = '';
      state.userID = '';
      state.emotionData = [];
    },
  },
});

export const { setSummary, setUserID, setEmotionData, clearFeedback } = feedbackSlice.actions;

export default feedbackSlice.reducer; 