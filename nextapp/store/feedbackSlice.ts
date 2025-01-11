import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FeedbackData {
  rating: number;
  comment: string;
  like: boolean;
}

interface FeedbackState {
  summary: string;
  conclusion: string;
  userID: string;
  emotionData: any[];
  partnerFeedback: FeedbackData | null;
}

const initialState: FeedbackState = {
  summary: '',
  conclusion: '',
  userID: '',
  emotionData: [],
  partnerFeedback: null,
};

export const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    setSummary: (state, action: PayloadAction<string>) => {
      state.summary = action.payload;
    },
    setConclusion: (state, action: PayloadAction<string>) => {
      state.conclusion = action.payload;
    },
    setUserID: (state, action: PayloadAction<string>) => {
      state.userID = action.payload;
    },
    setEmotionData: (state, action: PayloadAction<any[]>) => {
      state.emotionData = action.payload;
    },
    setPartnerFeedback: (state, action: PayloadAction<FeedbackData>) => {
      state.partnerFeedback = action.payload;
    },
    clearFeedback: (state) => {
      state.summary = '';
      state.conclusion = '';
      state.userID = '';
      state.emotionData = [];
      state.partnerFeedback = null;
    },
  },
});

export const { setSummary, setConclusion, setUserID, setEmotionData, setPartnerFeedback, clearFeedback } = feedbackSlice.actions;

export default feedbackSlice.reducer; 