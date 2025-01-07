import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';

interface SocketState {
  socket: typeof Socket | null;
  room: string | null;
}

const initialState: SocketState = {
  socket: null,
  room: null,
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setReduxSocket: (state, action: PayloadAction<typeof Socket | null>) => {
      state.socket = action.payload;
    },
    setRoom: (state, action: PayloadAction<string | null>) => {
      state.room = action.payload;
    },
  },
});

export const { setReduxSocket, setRoom } = socketSlice.actions;
export default socketSlice.reducer; 