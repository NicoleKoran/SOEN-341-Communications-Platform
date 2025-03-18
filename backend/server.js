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

// Initialize users database if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
}

// Load databases
let messages = JSON.parse(fs.readFileSync(DATABASE_FILE, "utf-8"));
let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));

// User endpoints
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

// Existing message endpoints
app.get("/messages/:chatId", (req, res) => {
    const chatId = req.params.chatId;
    res.json(messages[chatId] || []);
});

app.post("/messages", (req, res) => {
    const { chatId, sender, text, replyTo } = req.body;

    if (!messages[chatId]) {
        messages[chatId] = [];
    }

    
    const message = {
        sender,
        text,
        timestamp: new Date().toISOString(),
        replyTo: replyTo ? { sender: replyTo.sender, text: replyTo.text } : null //reply msgs are stored
    };

    messages[chatId].push(message);
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(messages, null, 2));

    res.json(message);
});



app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
