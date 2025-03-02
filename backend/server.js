const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 8888;

app.use(cors());
app.use(express.json());

// Add this line to serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

const DATABASE_FILE = "database.json";
let messages = JSON.parse(fs.readFileSync(DATABASE_FILE, "utf-8"));

app.get("/messages/:chatId", (req, res) => {
    const chatId = req.params.chatId;
    res.json(messages[chatId] || []);
});

app.post("/messages", (req, res) => {
    const { chatId, sender, text } = req.body;

    if (!messages[chatId]) {
        messages[chatId] = [];
    }

    const message = { sender, text, timestamp: new Date().toISOString() };
    messages[chatId].push(message);
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(messages, null, 2));

    res.json(message);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
