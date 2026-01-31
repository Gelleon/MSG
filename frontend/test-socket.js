const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:4000';
const EMAIL = 'testuser' + Date.now() + '@example.com';
const PASSWORD = 'password123';
const NAME = 'Test User';

async function run() {
  try {
    // 1. Login as ADMIN (seeded)
    console.log('Logging in as ADMIN...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'adminpassword'
    });
    const token = loginRes.data.access_token;
    console.log('Token received');

    // 2. Create Project
    console.log('Creating project...');
    const projectRes = await axios.post(`${API_URL}/projects`, {
        name: 'Test Project'
    }, { headers: { Authorization: `Bearer ${token}` } });
    const projectId = projectRes.data.id;
    console.log('Project created:', projectId);

    // 3. Create Room
    console.log('Creating room...');
    const roomRes = await axios.post(`${API_URL}/rooms`, {
        name: 'General',
        projectId: projectId,
        description: 'Test Room'
    }, { headers: { Authorization: `Bearer ${token}` } });
    const roomId = roomRes.data.id;
    console.log('Room created:', roomId);

    // 4. Connect Socket
    console.log('Connecting socket...');
    const socket = io(API_URL, {
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);

      // 5. Join Room
      socket.emit('joinRoom', roomId);
    });

    socket.on('joinedRoom', (room) => {
        console.log('Joined room:', room);
        
        // 6. Send Message
        console.log('Sending message...');
        socket.emit('sendMessage', {
            roomId: roomId,
            content: 'Hello World'
        });
    });

    socket.on('newMessage', (msg) => {
        console.log('Message received:', msg);
        if (msg.content === 'Hello World') {
            console.log('SUCCESS: Message sent and received!');
            socket.disconnect();
            process.exit(0);
        }
    });
    
    socket.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
        process.exit(1);
    });

    // Timeout
    setTimeout(() => {
        console.error('Timeout');
        process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

run();
