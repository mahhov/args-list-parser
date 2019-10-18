# Args List Parser

Converts arrays of strings such as 

```
['-build', '-files', 'x', 'y', '-o', 'z']
``` 

to objects such as 

```
{
  build: true,
  files: ['x', 'y'],
  output: ['z'],
  threads: [8]
}
```

### Usage

Construct `ArgsListParser` with a description of the arguments expected. Call `parse`, optionally with an array of strings. If parse is called without a parameter, `process.argv.slice(2)` will be defaulted.

```
const ArgsListParser = require('args-list-parser');

let argDescriptions = [
  {
    names: ['build', 'b'],
    values: 0,
    example: '-b',
    explanation: 'if provided, re-builds',
  }, {
    names: ['files', 'f'],
    values: 2,
    example: '-f in_1.js in_2.js in_3.js',
    explanation: 'the input files to process',
  }, {
    names: ['output', 'o'],
    values: 1,
    example: '-o out.js',
    explanation: 'the output file to process',
  }, {
    names: ['threads', 't'],
    defaultValues: [8],
    type: 'int'
    values: 1,
    example: '-t 16',
    explanation: 'number of threads to use',
  }
];

let argsListParser = new ArgsListParser(argDescriptions);
let args = argsListParser.parse();
```

### Arg descriptions

The argument descriptions used to construct `ArgsListPaerser` should be a list of objects of the format below.

- `names` indicates aliases the user can use to specify a value for an argument.
- `type` (optional) indicates the value type of an argument. Defaults to `'string'`.
- `defaultValues` (optional) sets the default values of an argument if the user does not provide any values.
- `values` indicates whether an argument accepts 0, 1, or multiple values.
- `example` and `explanation` are used to construct the help output described later.  

```
{
  names: Array<string>,
  defaultValues: Array<string|int|bool>,
  type: string ('int'|'bool'|'string'),
  values: int (0|1|2),
  example: string,
  explanation: string,
},
```

### Escaping `-`

Arg names are differentiated from arg values by the fact that arg names have a `-` as their first character. If an arg value needs to begin with a dash, (e.g. a negative number or simply a dash-prefixed string), then escape the value with backslash. Similarly, to begin an arg value with a backslash, prepend an additional backslash. E.g. `\-3` will be parsed as an arg value of `-3` while `\\][` will be parsed as an arg vale of `\][`.  

### Help

Calling `parse` with an empty array, or an array beginning with the string `'help'` will print a help message explaining the arg descriptions. The latter case will also early exit `parse` returning `undefined`.

```
Arguments:
    -b                            build|b      no values          if provided, re-builds    
    -f in_1.js in_2.js in_3.js    files|f      multiple values    the input files to process
    -o out.js                     output|o     single value       the output file to process
    -t 16                         threads|t    single value       number of threads to use  
```
