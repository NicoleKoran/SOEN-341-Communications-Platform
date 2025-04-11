const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testChatsJsonLoadsCorrectly() {
	const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'chats.json'), 'utf8'));
	assert.strictEqual(typeof data, 'object');
	assert.ok(data.hasOwnProperty('group-1742581004630'));
	assert.ok(data.hasOwnProperty('Alice-David'));
	console.log('Chats Json file loads correctly!');
}

testChatsJsonLoadsCorrectly();