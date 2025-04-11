const assert = require('assert');
const http = require('http');

const API_URL = "http://localhost:7777";

http.get(API_URL, (res) => {
	assert.strictEqual(res.statusCode, 200, "Test Failed");
	console.log("Test Passed");
}).on('error', (e) => {
	console.error(`Test Failed: ${e.message}`);
});
