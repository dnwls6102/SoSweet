import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AIFlagState {
  isAIChat: boolean;
}

const initialState: AIFlagState = {
  isAIChat: true,
};

const aiFlagSlice = createSlice({
  name: 'aiFlag',
  initialState,
  reducers: {
    setIsAIChat: (state, action: PayloadAction<boolean>) => {
      state.isAIChat = action.payload;
    },
  },
});

export const { setIsAIChat } = aiFlagSlice.actions;
export default aiFlagSlice.reducer;
