const assert = require('assert');
const http = require('http');
const API_URL = "http://localhost:7777";

// Here
const username = ""; 
const currentUser = "";

const options = {
	hostname: 'localhost',
	port: 7777,
	path: `/users/${username}?requestingUser=${currentUser}`,
	method: 'DELETE'
};

const req = http.request(options, (res) => {
	assert.strictEqual(res.statusCode, 200, "Fail: User not deleted");
	console.log("Test deleteUser Passed");
});

req.on('error', (e) => {
	console.error(`Fail: ${e.message}`);
});

req.end();
