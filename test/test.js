const assert = require('assert');
const ArgsListParser = require('../src/ArgsListParser');

let mock = (func, callThrough = true) => {
	let mock = (...args) => {
		let ret = callThrough ? func(...args) : undefined;
		mock._calls.push({args, ret});
		return ret;
	};
	mock._reset = () => mock._calls = [];
	mock._reset();
	return mock;
};

let argDescriptions = [
	{
		names: ['build', 'b'],
		values: 0,
		example: '-b',
		explanation: 'if provided, re-builds'
	}, {
		names: ['files', 'f'],
		values: 2,
		example: '-f in_1.js in_2.js in_3.js',
		explanation: 'the input files to process'
	}, {
		names: ['output', 'o'],
		values: 1,
		example: '-o out.js',
		explanation: 'the output file to process'
	}, {
		names: ['threads', 't'],
		defaultValue: '8',
		values: 1,
		example: '-t 16',
		explanation: 'number of threads to use'
	}
];

let argsListParser = new ArgsListParser(argDescriptions);

const CONSOLE_LOGS = ['error', 'warn', 'info'];
CONSOLE_LOGS.forEach(log => console[log] = mock(console[log].bind(console), false));
consoleAssert = (expectations = {}) => {
	CONSOLE_LOGS.forEach(log => {
		assert.deepEqual(console[log]._calls.map(({args}) => args.join(' ')), expectations[log] || []);
		console[log]._reset();
	});
};

let testBlock = (name, test) => {
	console.log(`Testing ${name}`);
	test();
};

testBlock('HELP', () => {
	assert.equal(argsListParser.parse(['help']), undefined);
	consoleAssert({
		info: [`Arguments:
    -b                            build|b      no values          if provided, re-builds    
    -f in_1.js in_2.js in_3.js    files|f      multiple values    the input files to process
    -o out.js                     output|o     single value       the output file to process
    -t 16                         threads|t    single value       number of threads to use  `]
	});
});

testBlock('NAME AND ALIASES', () => {
	assert.deepEqual(argsListParser.parse(['-build', '-f', 'x', 'output', '-output', 'build', '-t', '10']), {
		build: true,
		files: ['x', 'output'],
		output: ['build'],
		threads: [
			'10'
		]
	});
	consoleAssert();
});

testBlock('DEFAULT VALUES', () => {
	assert.deepEqual(argsListParser.parse(['-f']), {
		build: undefined,
		files: undefined,
		output: undefined,
		threads: [
			'8'
		]
	});
	consoleAssert();
});

testBlock('UNEXPECTED ARG WARNING', () => {
	assert.deepEqual(argsListParser.parse(['-x']), {
		build: undefined,
		files: undefined,
		output: undefined,
		threads: [
			'8'
		]
	});
	consoleAssert({warn: ["Warning: unexpected arg name '-x'."]});
});

testBlock('NO ARG NAME WARNING', () => {
	assert.deepEqual(argsListParser.parse(['x',]), {
		build: undefined,
		files: undefined,
		output: undefined,
		threads: [
			'8'
		]
	});
	consoleAssert({
		warn: ["Warning: arg value 'x' provided without an arg name."]
	});
});

testBlock('REPEATED ARG WARNING', () => {
	assert.deepEqual(argsListParser.parse(['-f', 'f', '-f']), {
		build: undefined,
		files: ['f'],
		output: undefined,
		threads: [
			'8'
		]
	});
	consoleAssert({warn: ["Warning: arg name '-f' appeared multiple times."]});
});

testBlock('MULTIPLE VALUES FOR 1-VALUE ARG WARNING', () => {
	assert.deepEqual(argsListParser.parse(['-o', 'o1', 'o2']), {
		build: undefined,
		files: undefined,
		output: ['o1'],
		threads: [
			'8'
		]
	});
	consoleAssert({
		warn: ["Warning: multiple arg values provided for single value arg 'output'."]
	});
});

testBlock('VALUE FOR 0-VALUE ARG WARNING', () => {
	assert.deepEqual(argsListParser.parse(['-b', 'b',]), {
		build: true,
		files: undefined,
		output: undefined,
		threads: [
			'8'
		]
	});
	consoleAssert({
		warn: ["Warning: arg value provided for zero value arg 'build'."]
	});
});
