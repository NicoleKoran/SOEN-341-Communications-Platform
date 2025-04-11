const assert = require('assert');
const http = require('http');
const API_URL = "http://localhost:7777";

const newGroupChat = JSON.stringify({
	creator: "testAdmin",
	name: "Test Group",
	participants: ["user1", "user2"]
});

const options = {
	hostname: 'localhost',
	port: 7777,
	path: '/chats/group',
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Content-Length': newGroupChat.length
    }
};

const req = http.request(options, (res) => {
	let data = '';
	res.on('data', (chunk) => {
		data += chunk;
    });
	res.on('end', () => {
		const chat = JSON.parse(data);
		assert.strictEqual(chat.name, "Test Group", "Fail: Group name should match");
		assert.strictEqual(chat.participants.includes("testAdmin"), true, "Fail: Chat should include testAdmin");
		assert.strictEqual(chat.participants.includes("user1"), true, "Fail: Chat should include user1");
		assert.strictEqual(chat.participants.includes("user2"), true, "Fail: Chat should include user2");
		console.log("Success");
	});
});

req.on('error', (e) => {
	console.error(`Test Failed: ${e.message}`);
});

req.write(newGroupChat);
req.end();
