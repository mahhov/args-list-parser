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
		explanation: 'if provided, re-builds',
	}, {
		names: ['files', 'f'],
		defaultValues: ['n', 'm'],
		values: 2,
		example: '-f in_1.js in_2.js in_3.js',
		explanation: 'the input files to process',
	}, {
		names: ['output', 'o'],
		type: 'string',
		values: 1,
		example: '-o out.js',
		explanation: 'the output file to process',
	}, {
		names: ['threads', 't'],
		defaultValues: [8],
		type: 'int',
		values: 1,
		example: '-t 16',
		explanation: 'number of threads to use',
	}, {
		names: ['other'],
		type: 'bool',
		values: 2,
		example: '-other false true',
		explanation: 'other flags',
	},
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
    -b                            build|b      no values           if provided, re-builds    
    -f in_1.js in_2.js in_3.js    files|f      multiple strings    the input files to process
    -o out.js                     output|o     single string       the output file to process
    -t 16                         threads|t    single int          number of threads to use  
    -other false true             other        multiple bools      other flags               `]
	});
});

testBlock('NAME AND ALIASES', () => {
	assert.deepEqual(argsListParser.parse(['-build', '-f', 'x', 'output', '-output', 'build', '-t', '10']), {
		build: true,
		files: ['x', 'output'],
		output: ['build'],
		threads: [10],
		other: undefined,
	});
	consoleAssert();
});

testBlock('DEFAULT VALUES', () => {
	assert.deepEqual(argsListParser.parse(['-f']), {
		build: undefined,
		files: ['n', 'm'],
		output: undefined,
		threads: [8],
		other: undefined,
	});
	consoleAssert();
});

testBlock('PARSING INT AND BOOL VALUES', () => {
	assert.deepEqual(argsListParser.parse(['-threads', '20', '-other', 't', '0', 'FALSE', '1', 'tRUE', 'F']), {
		build: undefined,
		files: ['n', 'm'],
		output: undefined,
		threads: [20],
		other: [true, false, false, true, true, false],
	});
	consoleAssert();
});

testBlock('UNEXPECTED ARG WARNING', () => {
	assert.deepEqual(argsListParser.parse(['-x']), {
		build: undefined,
		files: ['n', 'm'],
		output: undefined,
		threads: [8],
		other: undefined,
	});
	consoleAssert({warn: ["Warning: unexpected arg name '-x'."]});
});

testBlock('NO ARG NAME WARNING', () => {
	assert.deepEqual(argsListParser.parse(['x',]), {
		build: undefined,
		files: ['n', 'm'],
		output: undefined,
		threads: [8],
		other: undefined,
	});
	consoleAssert({warn: ["Warning: arg value 'x' provided without an arg name."]});
});

testBlock('REPEATED ARG WARNING', () => {
	assert.deepEqual(argsListParser.parse(['-f', 'f', '-f']), {
		build: undefined,
		files: ['f'],
		output: undefined,
		threads: [8],
		other: undefined,
	});
	consoleAssert({warn: ["Warning: arg name '-f' appeared multiple times."]});
});

testBlock('MULTIPLE VALUES FOR 1-VALUE ARG WARNING', () => {
	assert.deepEqual(argsListParser.parse(['-o', 'o1', 'o2']), {
		build: undefined,
		files: ['n', 'm'],
		output: ['o1'],
		threads: [8],
		other: undefined,
	});
	consoleAssert({warn: ["Warning: multiple arg values provided for single value arg 'output'."]});
});

testBlock('VALUE FOR 0-VALUE ARG WARNING', () => {
	assert.deepEqual(argsListParser.parse(['-b', 'b',]), {
		build: true,
		files: ['n', 'm'],
		output: undefined,
		threads: [8],
		other: undefined,
	});
	consoleAssert({warn: ["Warning: arg value provided for zero value arg 'build'."]});
});

testBlock('UNPARSED INT TYPE WARNING', () => {
	assert.deepEqual(argsListParser.parse(['-threads', '4.3']), {
		build: undefined,
		files: ['n', 'm'],
		output: undefined,
		threads: [4],
		other: undefined,
	});
	consoleAssert({warn: ["Warning: unexpected int arg value '4.3'. Expected /^\\d+$/."]});
});

testBlock('UNPARSED BOOL TYPE WARNING', () => {
	assert.deepEqual(argsListParser.parse(['-other', 'tr', 'falsee']), {
		build: undefined,
		files: ['n', 'm'],
		output: undefined,
		threads: [8],
		other: [false, false],
	});
	consoleAssert({
		warn: [
			"Warning: unexpected bool arg value 'tr'. Expected 'true', 't', '1', 'false', 'f', or '0']",
			"Warning: unexpected bool arg value 'falsee'. Expected 'true', 't', '1', 'false', 'f', or '0']"]
	});
});

testBlock('UNEXPECTED TYPE WARNING', () => {
	let argsListParser = new ArgsListParser([{
		names: ['some'],
		defaultValues: ['def'],
		values: 2,
		type: 'some',
	}]);

	assert.deepEqual(argsListParser.parse(['-some', 'x', 'y']), {
		some: ['x', 'y'],
	});
	consoleAssert({
		warn: [
			"Warning: unexpected arg type 'some'. Expected 'int', 'bool', or 'string'.",
			"Warning: unexpected arg type 'some'. Expected 'int', 'bool', or 'string'."]
	});
});

testBlock('SLASH ESCAPE DASH', () => {
	assert.deepEqual(argsListParser.parse(['-f', '\\-x', '\\\\-y', '-t', '\\-3']), {
		build: undefined,
		files: ['-x', '\\-y'],
		output: undefined,
		threads: [-3],
		other: undefined,
	});
	consoleAssert();
});
