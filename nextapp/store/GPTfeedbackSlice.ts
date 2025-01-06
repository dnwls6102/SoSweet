import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GPTfeedbackState {
  summary: string;
}

const initialState: GPTfeedbackState = {
  summary: '',
};

export const GPTfeedbackSlice = createSlice({
  name: 'GPTfeedback',
  initialState,
  reducers: {
    setGPTFeedback: (state, action: PayloadAction<string>) => {
      state.summary = action.payload;
    },
  },
});

export const { setGPTFeedback } = GPTfeedbackSlice.actions;
export default GPTfeedbackSlice.reducer;