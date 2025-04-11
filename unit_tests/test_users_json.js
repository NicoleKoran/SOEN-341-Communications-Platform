const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testUsersJsonLoadsCorrectly() {
	const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'users.json'), 'utf8'));
	assert.strictEqual(typeof data, 'object');
	assert.ok(data.hasOwnProperty('Alice'));
	assert.ok(data.hasOwnProperty('Bob'));
	console.log('Users Json file loads correctly!');
}

testUsersJsonLoadsCorrectly();