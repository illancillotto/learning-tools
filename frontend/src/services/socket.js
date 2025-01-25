import { io } from 'socket.io-client';

// Determine the socket URL based on environment
const getSocketURL = () => {
  /*
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL;
  }
  */
  
  // Always use port 5000 for backend in development
  const backendPort = process.env.REACT_APP_BACKEND_PORT || '5000';
  const backendHost = window.location.hostname;
  const socketURL = `http://${backendHost}:${backendPort}`;
  console.log('Backend socket URL:', socketURL); // Added for debugging
  return socketURL;
};

const SOCKET_URL = getSocketURL();
console.log('Connecting to socket URL:', SOCKET_URL);

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'], // Explicitly specify transport methods
  timeout: 10000 // Increase connection timeout
});

// Add connection event handlers for debugging
socket.on('connect', () => {
  console.log('Socket connected successfully');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export const connectSocket = () => {
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export default socket;