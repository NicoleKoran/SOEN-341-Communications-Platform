const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testDatabaseJsonLoadsCorrectly() {
	const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'database.json'), 'utf8'));
	assert.strictEqual(typeof data, 'object');
	assert.ok(data.hasOwnProperty('chat1'));
	assert.ok(data.hasOwnProperty('chat2'));
	console.log('Database Json file loads correctly!');
}

testDatabaseJsonLoadsCorrectly();