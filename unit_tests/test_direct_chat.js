
const assert = require('assert');
const http = require('http');

const API_URL = "http://localhost:7777";

const newChat = JSON.stringify({
	creator: "testUser",
	participant: "user2"
});

const options = {
	hostname: 'localhost',
	port: 7777,
	path: '/chats/direct',
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Content-Length': newChat.length
    }
};

const req = http.request(options, (res) => {
	let data = '';
	res.on('data', (chunk) => {
		data += chunk;
    });
	res.on('end', () => {
		const chat = JSON.parse(data);
		assert.strictEqual(chat.participants.includes("testUser"), true, "Fail: Chat should include testUser");
		assert.strictEqual(chat.participants.includes("user2"), true, "Fail: Chat should include user2");
		console.log("Test Passed");
    });
});

req.on('error', (e) => {
	console.error(`Fail: ${e.message}`);
});

req.write(newChat);
req.end();
