
import fs from 'fs'
import { Lexer } from './lexer.js'
import { ParserV2 } from './parser.js'

const input = fs.readFileSync('./hive.hive', 'utf8')

export class HiveScriptIntepreter {

    constructor(private input: string,private enableAdditionalDebug:boolean = false) {}
    
    public run() {
        this.enableAdditionalDebug ? console.time('Lexer Time') : null;
        const lex = new Lexer(this.input);
        this.enableAdditionalDebug ? console.timeEnd('Lexer Time') : null;
        
        this.enableAdditionalDebug ? console.time('Parser Time') : null;
        const parse = new ParserV2(lex.tokens, this)
        parse.parse();
        this.enableAdditionalDebug ? console.timeEnd('Parser Time') : null;

        console.log(parse.getRuntimeCache())

    }

}

const intepreter = new HiveScriptIntepreter(input,true)
intepreter.run();