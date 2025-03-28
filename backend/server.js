const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 7777;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

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
    const latestUsers = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    res.json(latestUsers);
});

app.post("/users", (req, res) => {
    const { username, email, phoneNumber, password } = req.body;
    
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
        createdAt: new Date().toISOString(),
        password
    };
    
    // Save to file
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    
    res.json({ username, ...users[username] });
});

// User login
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = users[username];

    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json({
        message: "Login successful",
        user: {
            username,
            role: user.role
        }
    });
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

app.post("/users/:username/upload-profile-picture", (req, res) => {
    const username = req.params.username;
    const USERS_FILE = path.join(__dirname, "users.json");
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));

    if (!users[username]) {
        return res.status(404).json({ error: "User not found" });
    }

    let data = Buffer.alloc(0);

    req.on("data", chunk => {
        data = Buffer.concat([data, chunk]);
    });

    req.on("end", () => {
        const contentType = req.headers["content-type"];
        const boundary = contentType.split("boundary=")[1];
        if (!boundary) {
            return res.status(400).json({ error: "Invalid form data" });
        }

        const parts = data.toString('latin1').split(`--${boundary}`);
        const filePart = parts.find(part => part.includes("filename="));
        if (!filePart) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const headerEndIndex = filePart.indexOf("\r\n\r\n");
        const fileHeader = filePart.substring(0, headerEndIndex);
        const binaryData = filePart.slice(headerEndIndex + 4, filePart.lastIndexOf("\r\n"));

        const buffer = Buffer.from(binaryData, "binary");

        let extension;
        if (buffer.slice(0, 4).toString("hex") === "89504e47") {
            extension = "png";
        } else if (buffer.slice(0, 3).toString("hex") === "ffd8ff") {
            extension = "jpg";
        } else {
            return res.status(400).json({ error: "Only PNG or JPEG images are supported" });
        }

        const fileName = `${username}-${Date.now()}.${extension}`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, buffer);

        users[username].profilePicture = `/uploads/${fileName}`;
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

        res.json({ imageUrl: `/uploads/${fileName}` });
    });
});

app.post("/users/:username/reset-profile-picture", (req, res) => {
    const username = req.params.username;
    const USERS_FILE = path.join(__dirname, "users.json");
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));

    if (!users[username]) {
        return res.status(404).json({ error: "User not found" });
    }

    const profilePicPath = users[username].profilePicture;

    if (profilePicPath && profilePicPath.startsWith("/uploads/")) {
        const fullPath = path.join(__dirname, profilePicPath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath); // delete file from uploads folder for optimixsation
        }
    }

    // Defaults to avatar png as before
    delete users[username].profilePicture;

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    res.json({ message: "Profile picture reset to default and file deleted." });
});



app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
