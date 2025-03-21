const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 7777;

app.use(cors());
app.use(express.json());

// Add this line to serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Database files
const DATABASE_FILE = "database.json";
const USERS_FILE = path.join(__dirname, "users.json");
const CHATS_FILE = path.join(__dirname, "chats.json");

// Initialize chats database if it doesn't exist
if (!fs.existsSync(CHATS_FILE)) {
    fs.writeFileSync(CHATS_FILE, JSON.stringify({}, null, 2));
}

// Load databases
let messages = JSON.parse(fs.readFileSync(DATABASE_FILE, "utf-8"));
let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
let chats = JSON.parse(fs.readFileSync(CHATS_FILE, "utf-8"));

// Helper function to check if user is admin
function isAdmin(username) {
    return users[username]?.role === "admin";
}

// Chat management endpoints
app.get("/chats", (req, res) => {
    res.json(chats);
});

app.post("/chats/direct", (req, res) => {
    const { creator, participant } = req.body;
    
    if (!creator || !participant) {
        return res.status(400).json({ error: "Creator and participant are required" });
    }
    
    // Check if users exist
    if (!users[creator] || !users[participant]) {
        return res.status(400).json({ error: "One or both users do not exist" });
    }
    
    // Create chat ID (sorted usernames to ensure consistency)
    const chatId = [creator, participant].sort().join("-");
    
    // Check if chat already exists
    if (chats[chatId]) {
        return res.json(chats[chatId]);
    }
    
    // Create new chat
    chats[chatId] = {
        id: chatId,
        type: "direct",
        participants: [creator, participant],
        createdBy: creator,
        createdAt: new Date().toISOString()
    };
    
    // Initialize messages array if it doesn't exist
    if (!messages[chatId]) {
        messages[chatId] = [];
    }
    
    // Save to file
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
    
    res.json(chats[chatId]);
});

app.post("/chats/group", (req, res) => {
    const { creator, name, participants } = req.body;
    
    if (!creator || !name || !participants || !Array.isArray(participants)) {
        return res.status(400).json({ error: "Creator, name, and participants array are required" });
    }
    
    // Check if creator is admin
    if (!isAdmin(creator)) {
        return res.status(403).json({ error: "Only admins can create group chats" });
    }
    
    // Check if all participants exist
    for (const participant of participants) {
        if (!users[participant]) {
            return res.status(400).json({ error: `User ${participant} does not exist` });
        }
    }
    
    // Create unique chat ID
    const chatId = `group-${Date.now()}`;
    
    // Create new chat
    chats[chatId] = {
        id: chatId,
        type: "group",
        name: name,
        participants: [creator, ...participants],
        createdBy: creator,
        createdAt: new Date().toISOString()
    };
    
    // Initialize messages array if it doesn't exist
    if (!messages[chatId]) {
        messages[chatId] = [];
    }
    
    // Save to file
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
    
    res.json(chats[chatId]);
});

// Get chats for a user (including all chats for admins)
app.get("/chats/:username", (req, res) => {
    const username = req.params.username;
    
    if (!users[username]) {
        return res.status(404).json({ error: "User not found" });
    }
    
    // If user is admin, return all chats
    if (isAdmin(username)) {
        return res.json(chats);
    }
    
    // For regular users, return only their chats
    const userChats = Object.values(chats).filter(chat => 
        chat.participants.includes(username)
    );
    
    res.json(userChats);
});

// Existing user endpoints
app.get("/users", (req, res) => {
    res.json(users);
});

app.post("/users", (req, res) => {
    const { username, email, phoneNumber } = req.body;
    
    // Validate input
    if (!username || !email || !phoneNumber) {
        return res.status(400).json({ error: "All fields are required" });
    }
    
    // Check if username already exists
    if (users[username]) {
        return res.status(400).json({ error: "Username already exists" });
    }
    
    // Add new user with default role of "user"
    users[username] = {
        email,
        phoneNumber,
        role: "user", // Default role
        createdAt: new Date().toISOString()
    };
    
    // Save to file
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    
    res.json({ username, ...users[username] });
});

// Modified message endpoints
app.get("/messages/:chatId", (req, res) => {
    const chatId = req.params.chatId;
    const username = req.query.username;
    
    if (!chats[chatId]) {
        return res.status(404).json({ error: "Chat not found" });
    }
    
    // Check if user has access to this chat
    if (!isAdmin(username) && !chats[chatId].participants.includes(username)) {
        return res.status(403).json({ error: "Access denied" });
    }
    
    res.json(messages[chatId] || []);
});

app.post("/messages", (req, res) => {
    const { chatId, sender, text, replyTo } = req.body;

    if (!chats[chatId]) {
        return res.status(404).json({ error: "Chat not found" });
    }
    
    // Check if sender is a participant in the chat
    if (!chats[chatId].participants.includes(sender)) {
        return res.status(403).json({ error: "Sender is not a participant in this chat" });
    }

    if (!messages[chatId]) {
        messages[chatId] = [];
    }
    
    const message = {
        sender,
        text,
        timestamp: new Date().toISOString(),
        replyTo: replyTo ? { sender: replyTo.sender, text: replyTo.text } : null
    };

    messages[chatId].push(message);
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(messages, null, 2));

    res.json(message);
});

// Add delete chat endpoint
app.delete("/chats/:chatId", (req, res) => {
    const chatId = req.params.chatId;
    const username = req.query.username;
    
    if (!chats[chatId]) {
        return res.status(404).json({ error: "Chat not found" });
    }
    
    // Only admins can delete chats
    if (!isAdmin(username)) {
        return res.status(403).json({ error: "Only admins can delete chats" });
    }
    
    // Delete chat and its messages
    delete chats[chatId];
    delete messages[chatId];
    
    // Save changes
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(messages, null, 2));
    
    res.json({ message: "Chat deleted successfully" });
});
// Delete specific message
app.delete("/messages/:chatId/:timestamp", (req, res) => {
    const { chatId, timestamp } = req.params;
    const username = req.query.username;

    if (!isAdmin(username)) {
        return res.status(403).json({ error: "Only admins can delete messages" });
    }

    if (!messages[chatId]) {
        return res.status(404).json({ error: "Chat not found" });
    }

    // Remove the message with matching timestamp
    messages[chatId] = messages[chatId].filter(msg => msg.timestamp !== timestamp);
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(messages, null, 2));

    res.json({ message: "Message deleted successfully" });
});

// Add rename chat endpoint
app.patch("/chats/:chatId", (req, res) => {
    const chatId = req.params.chatId;
    const { name, username } = req.body;
    
    if (!chats[chatId]) {
        return res.status(404).json({ error: "Chat not found" });
    }
    
    // Only admins can rename chats
    if (!isAdmin(username)) {
        return res.status(403).json({ error: "Only admins can rename chats" });
    }
    
    // Update chat name
    chats[chatId].name = name;
    
    // Save changes
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
    
    res.json(chats[chatId]);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
