class ArgsListParser {
	constructor(argDescriptions, printArgs = false) {
		this.argDescriptions_ = argDescriptions;
		this.printArgs_ = printArgs;
	}

	parse(argStrings = process.argv.slice(2)) {
		if (!argStrings.length || argStrings[0] === 'help') {
			this.printHelp_();
			if (argStrings[0] === 'help')
				return;
		}

		let args = {};
		let argDescription, argName;
		argStrings.forEach(argString => {
			if (argString[0] === '-' && argString.length > 1) {
				argDescription = this.getArgDescription_(argString.slice(1));
				argName = argDescription && argDescription.names[0];
				if (!argDescription)
					console.warn(`Warning: unexpected arg name '${argString}'.`);
				else if (argDescription.values !== 3 && argName in args)
					console.warn(`Warning: arg name '${argString}' appeared multiple times.`);
				else if (!argDescription.values)
					args[argName] = true;
				else if (argDescription.values === 2)
					args[argName] = [];
				else if (argDescription.values === 3) {
					args[argName] ||= [];
					args[argName].push([]);
				}
			} else if (argDescription) {
				let value = ArgsListParser.parseStringValue_(argString, argDescription.type);
				if (!argDescription.values)
					console.warn(`Warning: arg value provided for zero value arg '${argName}'.`);
				else if (argDescription.values === 1 && args[argName] !== undefined)
					console.warn(`Warning: multiple arg values provided for single value arg '${argName}'.`);
				else if (argDescription.values === 1)
					args[argName] = value;
				else if (argDescription.values === 2)
					args[argName].push(value);
				else if (argDescription.values === 3) {
					args[argName][args[argName].length - 1].push(value);
				}
			} else
				console.warn(`Warning: arg value '${argString}' provided without an arg name.`);
		});

		if (this.printArgs_)
			console.log('\nArgs:', JSON.stringify(args, '', 2));

		this.argDescriptions_.forEach(({names: [name], defaultValue}) => args[name] = args[name] ?? defaultValue);

		return args;
	}

	getArgDescription_(argName) {
		return this.argDescriptions_.find(({names}) => names.includes(argName));
	}

	printHelp_() {
		const valueCountHelps = {
			int: ['no values', 'single int', 'multiple ints', 'repeated multiple ints'],
			bool: ['no values', 'single bool', 'multiple bools', 'repeated multiple bools'],
			string: ['no values', 'single string', 'multiple strings', 'repeated multiple strings'],
		};
		let lines = ArgsListParser.alignColumns_(this.argDescriptions_
			.map(({names, type = 'string', values, example, explanation}) =>
				['', example, names.join('|'), valueCountHelps[type][values], explanation]))
			.map(lineArray => lineArray.join('    '));
		console.info(['Arguments:', ...lines].join('\n'));
	}

	static parseStringValue_(value, type = 'string') {
		value = value.replace(/^\\/, '');

		switch (type) {
			case 'int':
				if (!/^-?\d+$/.test(value))
					console.warn(`Warning: unexpected int arg value '${value}'. Expected /^\\d+$/.`);
				return parseInt(value);

			case 'bool':
				let lowerValue = value.toLowerCase();
				if (['true', 't', '1'].includes(lowerValue))
					return true;
				else if (['false', 'f', '0'].includes(lowerValue))
					return false;
				else {
					console.warn(`Warning: unexpected bool arg value '${value}'. Expected 'true', 't', '1', 'false', 'f', or '0']`);
					return false;
				}

			case 'string':
				return value;

			default:
				console.warn(`Warning: unexpected arg type '${type}'. Expected 'int', 'bool', or 'string'.`);
				return value;
		}
	}

	static alignColumns_(rows) {
		let columns = rows[0].map((_, i) => rows.map(row => row[i]));
		let colWidths = columns.map(column => Math.max(...column.map(text => text.length)));
		return rows.map(row => row.map((text, colI) => text.padEnd(colWidths[colI])));
	}

	static bashColorConsole() {
		const COLORS = {
			black: '\x1B[1;30m',
			red: '\x1B[1;31m',
			green: '\x1B[1;32m',
			yellow: '\x1B[1;33m',
			blue: '\x1B[1;34m',
			pink: '\x1B[1;35m',
			cyan: '\x1B[1;36m',
			white: '\x1B[1;37m',
			normal: '\x1B[0m',
		};
		Object.entries({
			error: COLORS.red,
			warn: COLORS.yellow,
			info: COLORS.blue,
			...COLORS,
		}).forEach(([log, color]) => {
			let log_ = console[log] || console.log;
			console[log] = (...args) => {
				if (args.length) {
					args[0] = color + args[0];
					args[args.length - 1] += COLORS.normal;
				}
				log_.apply(console, args);
			};
		});
	}
}

module.exports = ArgsListParser;
