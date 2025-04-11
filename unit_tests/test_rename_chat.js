const assert = require('assert');
const http = require('http');
const API_URL = "http://localhost:7777";

// Here
const chatId = "";
const currentUser = "";
const newName = "TESTNEWNAME";

const options = {
	hostname: 'localhost',
	port: 7777,
	path: `/chats/${chatId}`,
	method: 'PATCH',
	headers: {
		'Content-Type': 'application/json'
	}
};

const req = http.request(options, (res) => {
	let data = '';
	res.on('data', (chunk) => {
		data += chunk;
	});
	res.on('end', () => {
		const chat = JSON.parse(data);
		assert.strictEqual(chat.name, newName, "Fail");
		console.log("Success!");
	});
});

req.on('error', (e) => {
	console.error(`Fail: ${e.message}`);
});

req.write(JSON.stringify({
	name: newName,
	username: currentUser
}));
req.end();
