const io = require("socket.io-client");
const axios = require("axios");

async function main() {
    const API_URL = "http://localhost:4000";
    
    // Random user
    const randomId = Math.floor(Math.random() * 10000);
    const email = `testuser${randomId}@example.com`;
    const password = "password123";

    // 0. Register
    console.log(`Registering user ${email}...`);
    try {
        await axios.post(`${API_URL}/auth/register`, {
            email: email,
            password: password,
            name: `Test User ${randomId}`
        });
        console.log("Registered.");
    } catch (regErr) {
        console.log("Registration error (maybe exists):", regErr.message);
    }

    // 1. Login
    console.log("Logging in...");
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: email,
            password: password
        });
        const token = loginRes.data.access_token;
        console.log("Logged in. Token:", token.substring(0, 20) + "...");

        // 2. Create Room (or find)
        console.log("Fetching rooms...");
        let roomsRes = await axios.get(`${API_URL}/rooms`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        let room = roomsRes.data.find(r => r.name === "test-room");
        if (!room) {
             if (roomsRes.data.length > 0) {
                 room = roomsRes.data[0];
                 console.log("Using existing room:", room.name);
             } else {
                 console.log("Creating test-room...");
                 try {
                     const createRes = await axios.post(`${API_URL}/rooms`, {
                         name: "test-room",
                         description: "Test Room"
                     }, {
                         headers: { Authorization: `Bearer ${token}` }
                     });
                     room = createRes.data;
                 } catch (e) {
                     console.log("Create room failed (likely permissions):", e.response?.status);
                     // If we can't create, we can't test join properly if no rooms exist.
                     // But hopefully there are rooms.
                 }
             }
        }
        
        if (!room) {
            console.error("No room available to join.");
            process.exit(1);
        }

        console.log("Room ID:", room.id);

        // 3. Join Room API (The Fix Target)
        console.log("Joining room API...");
        try {
            await axios.post(`${API_URL}/rooms/${room.id}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Joined room API success.");
        } catch (joinErr) {
            console.log("Join API error:", joinErr.response?.status, joinErr.response?.data);
        }

        // 4. Connect Socket
        console.log("Connecting socket...");
        const socket = io(API_URL, {
            extraHeaders: { Authorization: `Bearer ${token}` }
        });

        socket.on("connect", () => {
            console.log("Socket connected.");
            
            // 5. Join Room Socket
            socket.emit("joinRoom", room.id);
        });

        socket.on("joinedRoom", (roomId) => {
            console.log("Socket joined room:", roomId);
            
            // 6. Send Message
            console.log("Sending message...");
            socket.emit("sendMessage", {
                roomId: room.id,
                content: "Hello World from Test Script"
            });
        });

        socket.on("newMessage", (msg) => {
            console.log("Received newMessage:", msg.content);
            if (msg.content === "Hello World from Test Script") {
                console.log("SUCCESS: Message received correctly.");
                socket.disconnect();
                process.exit(0);
            }
        });

        socket.on("error", (err) => {
            console.error("Socket Error:", err);
            process.exit(1);
        });
    } catch (loginErr) {
        console.log("Login error:", loginErr.message);
        process.exit(1);
    }
}

main();