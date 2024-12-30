import { Server } from 'socket.io';
import http from 'http';

export const initializeSocketServer = (server: http.Server) => {
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log(`Client ID: ${socket.id} connected.`);

    socket.on('message', (message: string) => {
      console.log(`Message received: ${message}`);
      const elements = io.sockets.adapter.rooms.get('foo');
      if (message === 'bye' && elements) {
        elements.forEach((socketId: string) => {
          const clientSocket = io.sockets.sockets.get(socketId);
          if (clientSocket) {
            clientSocket.leave('foo');
          }
        });
      }
      socket.broadcast.emit('message', message);
    });

    socket.on('create or join', () => {
      const clientsInRoom = io.sockets.adapter.rooms.get('foo') || new Set();
      const numClients = clientsInRoom.size;

      if (numClients === 0) {
        socket.join('foo');
        socket.emit('created', 'foo', socket.id);
      } else if (numClients === 1) {
        io.sockets.in('foo').emit('join', 'foo');
        socket.join('foo');
        socket.emit('joined', 'foo');
        io.sockets.in('foo').emit('ready');
      } else {
        socket.emit('full', 'foo');
      }
    });

    socket.on('bye', () => {
      console.log('Client disconnected.');
    });
  });
};
