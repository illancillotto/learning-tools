import { io } from 'socket.io-client';

// Debug counter for monitoring socket calls
let pollCount = 0;
let lastPollTime = Date.now();

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

// Socket configuration with monitoring
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 5000,
  transports: ['websocket'],
  timeout: 20000,
  // Monitor polling frequency
  polling: {
    interval: 10000, // Increase polling interval
  }
});

let reconnectTimer = null;

// Monitor socket events
socket.on('connect', () => {
  console.log('Socket connected successfully');
  pollCount = 0; // Reset poll count on new connection
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
  console.log(`Polling count since last connection: ${pollCount}`);
  
  if (!reconnectTimer) {
    reconnectTimer = setTimeout(() => {
      socket.connect();
    }, 10000);
  }
});

// Monitor polling events
socket.on('polling', () => {
  pollCount++;
  const now = Date.now();
  const timeSinceLastPoll = now - lastPollTime;
  console.log(`Poll #${pollCount}, Time since last poll: ${timeSinceLastPoll}ms`);
  lastPollTime = now;
});

// Add debug information for development
if (process.env.NODE_ENV === 'development') {
  socket.on('packet', (packet) => {
    if (packet.type === 'ping' || packet.type === 'pong') {
      console.debug(`Socket ${packet.type} at ${new Date().toISOString()}`);
    }
  });
}

export const connectSocket = () => {
  if (!socket.connected) {
    console.log('Initiating socket connection...');
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    console.log(`Disconnecting socket. Total polls: ${pollCount}`);
    socket.disconnect();
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

// Add monitoring methods
export const getSocketStats = () => ({
  pollCount,
  lastPollTime,
  isConnected: socket.connected,
  transport: socket.io?.engine?.transport?.name
});

export default socket;