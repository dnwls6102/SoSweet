import { configureStore } from '@reduxjs/toolkit';
import feedbackReducer from './feedbackSlice';
import socketReducer from './socketSlice';
import aiFlagReducer from './aiFlagSlice';
import GPTfeedbackReducer from './GPTfeedbackSlice';

export const store = configureStore({
  reducer: {
    feedback: feedbackReducer,
    socket: socketReducer,
    aiFlag: aiFlagReducer,
    GPTfeedback: GPTfeedbackReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // socket 객체는 직렬화 검사에서 제외
        ignoredActions: ['socket/setReduxSocket'],
        ignoredPaths: ['socket.socket'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 