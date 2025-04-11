const assert = require('assert');
const http = require('http');
const API_URL = "http://localhost:7777";

// Here
const chatId = ""; 
const timestamp = ""; 
const currentUser = "";

const options = {
	hostname: 'localhost',
	port: 7777,
	path: `/messages/${chatId}/${timestamp}?username=${currentUser}`,
	method: 'DELETE'
};

const req = http.request(options, (res) => {
	assert.strictEqual(res.statusCode, 200, "Fail: Message not delted");
	console.log("Test Passed check json");
});

req.on('error', (e) => {
	console.error(`Fail: ${e.message}`);
});

req.end();
