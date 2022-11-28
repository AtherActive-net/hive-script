import { Binary, Expr, Literal, Operation, Variable } from './syntax.js'
import fs from 'fs'
import {error, suggestions} from './lib/error.js'

const input = fs.readFileSync('./hive.hive', 'utf8')


export enum TokenType {
    LEFT_PAREN = "(",
    RIGHT_PAREN = ")",
    LEFT_BRACE = "{",
    RIGHT_BRACE = "}",
    LEFT_BRACKET = "[",
    RIGHT_BRACKET = "]",

    COMMA = ",",
    DOT = ".",
    MINUS = "-",
    PLUS = "+",
    SEMICOLON = ";",
    SLASH = "/",
    STAR = "*",

    BANG = "!",
    BANG_EQUAL = "!=",
    EQUAL = "=",
    EQUAL_EQUAL = "==",
    GREATER = ">",
    GREATER_EQUAL = ">=",
    LESS = "<",
    LESS_EQUAL = "<=",
    AND = "&&",

    STRING = "str",
    INTEGER = "int",
    FLOAT = "flt",
    BOOLEAN = "bool",

    STRING_TYPE = "STR",
    INTEGER_TYPE = "INT",
    FLOAT_TYPE = "FLT",
    BOOLEAN_TYPE = "BOOl",

    IDENTIFIER = "IDENTIFIER",
    RETURN = "RETURN",
    
    CLASS = "CLASS",
    FUNCTION = 'FUNCTION',
    NEW = 'NEW',

    ELSE = "else",
    FALSE = "false",
    FOR = "for",
    FUN = "fun",
    IF = "if",
    NIL = "nil",
    OR = "||",
    PRINT = "print",
    SUPER = "super",
    THIS = "this",
    TRUE = "true",
    VAR = "var",
    WHILE = "while",

    EOF = "EOF",
    COMMENT = "#",
    CLEAR = 'CLEAR'
}

export const validOperationTypes = [
    TokenType.INTEGER,
    TokenType.FLOAT,
]

export const numeric = [
    TokenType.INTEGER,
    TokenType.FLOAT
]

const operators = [
    TokenType.PLUS,
    TokenType.MINUS,
    TokenType.STAR,
    TokenType.SLASH,
]

const binaryOperators = [
    TokenType.EQUAL_EQUAL,
    TokenType.BANG_EQUAL,
    TokenType.GREATER,
    TokenType.GREATER_EQUAL,
    TokenType.LESS,
    TokenType.LESS_EQUAL,
]

// set up the basic keywords
const reservedKeywords = new Map([
    ['else', TokenType.ELSE],
    ['false', TokenType.FALSE],
    ['for', TokenType.FOR],
    ['fun', TokenType.FUN],
    ['if', TokenType.IF],
    ['nil', TokenType.NIL],
    ['or', TokenType.OR],
    ['return', TokenType.RETURN],
    ['super', TokenType.SUPER],
    ['this', TokenType.THIS],
    ['true', TokenType.TRUE],
    ['var', TokenType.VAR],
    ['while', TokenType.WHILE],

    // Variable type keywords
    ['int', TokenType.INTEGER_TYPE],
    ['flt', TokenType.FLOAT_TYPE],
    ['str', TokenType.STRING_TYPE],
    ['bool', TokenType.BOOLEAN_TYPE],

    ['true', TokenType.TRUE],
    ['false', TokenType.FALSE],

    // Other
    ['entity', TokenType.CLASS],
    ['prog', TokenType.FUNCTION],
    ['create', TokenType.NEW],
    
    // STDLib Keywords
    ['output', TokenType.PRINT],
    ['clear', TokenType.CLEAR]
])


class HiveScriptIntepreter {

    constructor(private input: string) {
        console.time('lexer')
        const lex = new Lexer(this.input);
        console.timeEnd('lexer')

        console.time('parser')
        const parse = new ParserV2(lex.tokens, this).parse();
        console.timeEnd('parser')
    }

}

class Lexer {
    private position: number = 0;
    private start: number = 0;
    private line: number = 1;
    public tokens: Token[] = [];
    private input:string[]

    constructor(input: string) {
        this.input = input.split('');

        this.scanFile(this.input)
    }

    private scanFile(input:string[]) {
        while(this.position < input.length) {
            this.start = this.position;
            this.scanToken();
        }

        this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
        return this.tokens;
    }

    private scanToken() {
        const char = this.advance();

        switch(char) {
            case TokenType.LEFT_PAREN: 
                this.createToken(TokenType.LEFT_PAREN); 
                break;

            case TokenType.RIGHT_PAREN: 
                this.createToken(TokenType.RIGHT_PAREN); 
                break;

            case TokenType.LEFT_BRACE: 
                this.createToken(TokenType.LEFT_BRACE);
                break;

            case TokenType.RIGHT_BRACE: 
                this.createToken(TokenType.RIGHT_BRACE); 
                break;

            case TokenType.LEFT_BRACKET:
                this.createToken(TokenType.LEFT_BRACKET);
                break;
            
            case TokenType.RIGHT_BRACKET:
                this.createToken(TokenType.RIGHT_BRACKET);
                break;

            case TokenType.COMMA: 
                this.createToken(TokenType.COMMA); 
                break;

            case TokenType.DOT: 
                this.createToken(TokenType.DOT); 
                break;

            case TokenType.MINUS: 
                this.createToken(TokenType.MINUS); 
                break;

            case TokenType.PLUS: this.createToken(TokenType.PLUS); break;

            case TokenType.SEMICOLON: this.createToken(TokenType.SEMICOLON); break;

            case TokenType.SLASH: this.createToken(TokenType.SLASH); break;

            case TokenType.STAR: this.createToken(TokenType.STAR); break;

            case TokenType.BANG: 
                const type = this.lookNext(TokenType.EQUAL) ? TokenType.BANG_EQUAL : TokenType.BANG;
                this.createToken(type);
                break;
            
            case TokenType.EQUAL: this.createToken(this.lookNext(TokenType.EQUAL) ? TokenType.EQUAL_EQUAL : TokenType.EQUAL); break;

            case TokenType.GREATER: this.createToken(this.lookNext(TokenType.EQUAL) ? TokenType.GREATER_EQUAL : TokenType.GREATER); break;

            case TokenType.LESS: this.createToken(this.lookNext(TokenType.EQUAL) ? TokenType.LESS_EQUAL : TokenType.LESS); break;

            case TokenType.AND: this.createToken(TokenType.AND); break;

            case TokenType.OR: this.createToken(TokenType.OR); break;

            case TokenType.COMMENT: this.comment(); break;

            // Cases that are not directly a type.
            case '\n':
                this.line++;
                break;
            case ' ':
                break;
            
            case '"':
                this.string(char);
                break;

            default:
                if(this.isDigit(char)) {
                    this.number(char);
                }
                else if(this.isValidCharacter(char)) {
                    this.identifier(char);
                }
                break;
        }
    }

    private lookNext(expectedCharacter:string) {
        // console.log(this.input[this.position], expectedCharacter)
        if(this.input[this.position] === expectedCharacter) {
            this.position++;
            return true;
        }
        return false;
    }

    private lookAhead() {
        if(this.position > input.length) return '\0';
        return this.input[this.position];
    }

    private createToken(type:TokenType, value:any = null) {
        const text = this.input.slice(this.start, this.position).join('');
        this.tokens.push(new Token(type, text, value, this.line));
    }

    private advance() {
        this.position++;
        return this.input[this.position - 1];
    }

    
    private isValidCharacter(character:string) {
        return character.match(/[a-zA-Z0-9]/);
    }
    
    private isDigit(character:string, includeDot:boolean = false) {
        if(includeDot) return character.match(/[0-9.]/);
        return character.match(/[0-9]/);
    }
    
    private identifier(character:string) {
        let text = character;
        while(this.isValidCharacter(this.lookAhead())) {
            text += this.advance();
        }
        // console.log(text)
        const type = reservedKeywords.get(text) || TokenType.IDENTIFIER;
        this.createToken(type)
    }

    private number(character) {
        let text = character;
        while(this.isDigit(this.lookAhead(),true)) {
            text += this.advance();
        }
        if(text.includes('.')) {
            this.createToken(TokenType.FLOAT, parseFloat(text));
        } else {
            this.createToken(TokenType.INTEGER, parseInt(text));
        }

    }

    private string(character:string) {
        let text = character;
        while(this.lookAhead() !== '"' && !(this.position >= input.length)) {
            if(this.lookAhead() === '\n') this.line++;
            text += this.advance();
        }

        if(this.position >= input.length) {
            throw new Error('Unterminated string');
        }
        text += this.advance();
        
        text = text.slice(1, text.length - 1);
        this.createToken(TokenType.STRING, text);
    }

    private comment() {
        // Skip the rest of the tokens on this line
        while(this.lookAhead() !== '\n' && this.position < this.input.length) {
            this.advance();
        }
    }
}


class Parser{
    // TODO: Rebuild cache so it actually supports
    // functions and other things like Arrays.

    // This can be done pretty easily, as long as we intepret
    // any as a Funciton or Literal.
    private runtimeCache: Map<string, any> = new Map();
    private index = 0;
    constructor(public tokens: Token[]) {
        
        while(!this.isAtEnd()) {
            this.parseToken();
        }

        console.log(this.runtimeCache);
    }

    private isAtEnd() {
        return this.index >= this.tokens.length;
    }

    private parseToken() {
        const tok = this.advance();
        switch(tok.type) {
            case TokenType.FLOAT_TYPE:
            case TokenType.INTEGER_TYPE:
            case TokenType.STRING_TYPE:
            case TokenType.BOOLEAN_TYPE:
                this.variableDeclaration(tok);
                break;
            case TokenType.IDENTIFIER:
                if(this.lookahead().type == TokenType.EQUAL) this.variableAssignment(tok);
                else this.functionExecute(tok);
                break;
        }
    }

    private advance(count:number = 1) {
        this.index += count;
        console.log(this.index)
        return this.tokens[this.index - 1];
    }

    private lookahead(count:number = 1) {
        if(this.index >= this.tokens.length) return new Token(TokenType.EOF, "", null, 0);
        return this.tokens[(this.index-1) + count];
    }

    private lookback(count:number = 1) {
        if(this.index <= 0) return new Token(TokenType.EOF, "", null, 0);
        return this.tokens[(this.index-1) - count];
    }

    //
    
    private variableDeclaration(token:Token) {
        const type = token.type;
        console.log(this.lookback())
        const name = this.advance(1);

        if(!(name.type == TokenType.IDENTIFIER)) throw new Error('Expected identifier');
        if(!(this.lookahead().type === TokenType.EQUAL)) throw new Error('Expected =');

        let value = this.expression(this.advance(2));

        if(value.valueType == TokenType.INTEGER_TYPE && type == TokenType.FLOAT_TYPE) value.valueType = TokenType.FLOAT_TYPE

        if(value.valueType != type) throw new Error(`Expected ${type} got ${value.valueType} at line ${token.line}`);
        if(value.value % 1 != 0 && type == TokenType.INTEGER_TYPE) throw new Error(`Expected ${type} got flt at line ${token.line}`);

        if(this.runtimeCache.has(name.lexeme)) throw new Error(`Variable ${name.lexeme} already exists. Error occured at line ${token.line}`);
        this.runtimeCache.set(name.lexeme, value);
    }

    private variableAssignment(token:Token) {
        const name = token;
        if(!(this.lookahead().type === TokenType.EQUAL)) throw new Error('Expected =');

        let value = this.expression(this.advance(2));

        if(this.runtimeCache.has(name.lexeme)) {
            const type = this.runtimeCache.get(name.lexeme).valueType;
            if(value.valueType == TokenType.INTEGER_TYPE && type == TokenType.FLOAT_TYPE) value.valueType = TokenType.FLOAT_TYPE

            if(value.valueType != type) throw new Error(`Expected ${type} got ${value.valueType} at line ${token.line}`);
            if(value.value % 1 != 0 && type == TokenType.INTEGER_TYPE) throw new Error(`Expected ${type} got flt at line ${token.line}`);
        }

        this.runtimeCache.set(name.lexeme, value);
    }

    private functionExecute(tok:Token) {

    }

    private expression(tok:Token) {
        if(operators.includes(this.lookahead().type)) {
            switch(tok.type) {
                case TokenType.INTEGER:
                case TokenType.FLOAT:
                case TokenType.STRING:
                case TokenType.LEFT_PAREN:
                case TokenType.RIGHT_PAREN:
                    break;
                default:
                    if(tok.type == TokenType.IDENTIFIER) {
                        if(this.identifier(tok).valueType != TokenType.INTEGER_TYPE && this.identifier(tok).valueType != TokenType.FLOAT_TYPE) {

                            throw new Error(`Expected number, string or identifier at line ${tok.line}. Got ${tok.type}`);
                        }
                    }
                    
            }
            const start = this.advance();
            const operation = this.findOperators(start);

            while(operation.length > 0) {

                let operator = operation.find(op => op.type == TokenType.LEFT_PAREN);
                if(!operator) operator = operation.find(op => op.type === TokenType.STAR || op.type === TokenType.SLASH);
                if(!operator) operator = operation.find(op => op.type === TokenType.PLUS || op.type === TokenType.MINUS);

                
                if(!operator) {
                    if(operation.length > 1) throw new Error(`Invalid expression at line ${tok.line}`);
                    break;
                }

                if(operator.type == TokenType.LEFT_PAREN) {
                    const opr = this.expression(operator);
                    const index = operation.indexOf(operator);

                    while(operation[index].type != TokenType.RIGHT_PAREN) {
                        operation.splice(index, 1);
                    }
                    operation.splice(index, 1, opr);
                    continue;
                }

                const index = operation.indexOf(operator,0);

                const left:Token = operation[index - 1];
                const right:Token = operation[index + 1];


                // console.log(left, operator, right)
                let lval = left.type === TokenType.IDENTIFIER ? this.identifier(left) : left;
                let rval = right.type === TokenType.IDENTIFIER ? this.identifier(right) : right;

                // if(left.type === TokenType.IDENTIFIER) lval = this.identifier(left);
                // else lval = left;
                // if(right.type === TokenType.IDENTIFIER) rval = this.identifier(right);
                // else rval = right;

                const res = this.operator(new Operation(
                    lval instanceof Literal && lval != undefined ? lval : new Literal(left.literal,left.type), 
                    operator, 
                    rval instanceof Literal && rval != undefined? rval : new Literal(right.literal,right.type)
                    ));

                operation.splice(index - 1, 3, res);
            }
            
            return operation[0];
        } else if(binaryOperators.includes(this.lookahead().type)) {
            return this.binary(new Binary(this.literal(tok), this.advance(), this.literal(this.advance())));
        }

        switch(tok.type) {
            case TokenType.IDENTIFIER:
                return this.identifier(tok);

            case TokenType.INTEGER:
            case TokenType.FLOAT:
            case TokenType.STRING:
            case TokenType.BOOLEAN:
                return this.literal(tok);

            case TokenType.TRUE:
            case TokenType.FALSE:
                return new Literal(tok.lexeme, TokenType.BOOLEAN);
            
            // case TokenType.LEFT_PAREN:
            //     console.log(`found left paren at line ${tok.line}, proceeding to expression`)
            //     const expr = this.expression(this.groupedExpression());
            //     return expr;
            
            // case TokenType.RIGHT_PAREN:
            //     throw new Error(`Unexpected ) at line ${tok.line}`);
        }
    }

    private literal(tok:Token,type:TokenType = tok.type) {
        switch(tok.type) {
            case TokenType.IDENTIFIER:
                return this.identifier(tok);
            default:
                return new Literal(tok.literal, type);
        }
    }

    private operator(operation:Operation) {


        switch(operation.operator.type) {
            case TokenType.PLUS:
                return new Literal(operation.left.value + operation.right.value, operation.left.valueType);
            case TokenType.MINUS:
                return new Literal(operation.left.value - operation.right.value, operation.left.valueType);
            case TokenType.STAR:
                return new Literal(operation.left.value * operation.right.value, operation.left.valueType);
            case TokenType.SLASH:
                return new Literal(operation.left.value / operation.right.value, operation.left.valueType);
        }
    }

    private binary(bin:Binary) {

        switch(bin.operator.type) {
            case TokenType.GREATER:
                return new Literal(bin.left.value > bin.right.value, TokenType.BOOLEAN);
            case TokenType.GREATER_EQUAL:
                return new Literal(bin.left.value >= bin.right.value, TokenType.BOOLEAN);
            case TokenType.LESS:
                return new Literal(bin.left.value < bin.right.value, TokenType.BOOLEAN);
            case TokenType.LESS_EQUAL:
                return new Literal(bin.left.value <= bin.right.value, TokenType.BOOLEAN);
            case TokenType.EQUAL_EQUAL:
                return new Literal(bin.left.value == bin.right.value, TokenType.BOOLEAN);
            case TokenType.BANG_EQUAL:
                return new Literal(bin.left.value != bin.right.value, TokenType.BOOLEAN);
        }
    }

    private groupedExpression() {
        const expr = this.expression(this.advance(1));
        return expr;
    }

    private findOperators(tok:Token) {
        const tokens = [];
        tokens.push(this.lookback())
        let activeToken = tok;
        while(activeToken.type != TokenType.SEMICOLON) {
            tokens.push(activeToken);
            activeToken = this.advance();
        }
        return tokens;
    }

    private identifier(tok:Token):Literal {
        const val:Literal = this.runtimeCache.get(tok.lexeme)
        if(!val) throw new Error(`Variable ${tok.lexeme} is not defined`);
        return val;
    }
}

class ParserV2 {
    private position: number = -1;
    private tokens: Token[];
    private runtimeChache: Map<string, Expr> = new Map();

    constructor(tokens: Token[], private intepreter:HiveScriptIntepreter) {
        this.tokens = tokens;
    }

    // Helper functions
    private isAtEnd() {
        return (this.position + 1) == this.tokens.length;
    }

    private advance(count: number = 1) {
        this.position += count;
        return this.tokens[this.position];
    }

    private lookAhead(count:number=1) {
        return this.tokens[this.position + count];
    }

    private lookBack(count:number=1) {
        return this.tokens[this.position - count];
    }

    private doesVarExist(name:string) {
        return this.runtimeChache.has(name);
    }

    private error(tok:Token, message:string,suggestion?:string) {
        const err = new Error('')
        console.log(`
    Error at line ${tok.line}: 
    ${message}

    ${suggestion ? suggestion : ''}
        `);
        process.exit(1);
    }

    //

    public parse() {
        while(!this.isAtEnd()) {
            const tok = this.advance();
            this.expression(tok);
        }
        console.log('\n End of execution. Runtime cache below.');
        console.log(this.runtimeChache);
    }

    public expression(tok:Token, resolveOperators:boolean = true) {
        // if(!tok) return;
        if(tok.type === TokenType.IDENTIFIER) {
            const id = (this.identifier(tok) as Literal);
            tok = new Token(id.valueType, id.value, id.value, tok.line);
        }


        switch(tok.type) {
            case TokenType.INTEGER:
            case TokenType.FLOAT:
                if(operators.includes(this.lookAhead(1).type) && resolveOperators) {
                    return this.operation(tok);
                } else if(binaryOperators.includes(this.lookAhead(1).type) && resolveOperators) {
                    return this.binaryOperation(tok);
                }
                else {
                    return this.literal(tok);
                }
                break;

            case TokenType.STRING:
                if(this.lookAhead(1).type == TokenType.DOT && resolveOperators) {
                    return this.stringOperation(tok);
                } else if (operators.includes(this.lookAhead(1).type)) {
                    this.error(tok, error.operationNotSupportedType(tok.type),suggestions.operationNotSupportedType)
                }
                else {
                    return this.literal(tok)
                }
            
            case TokenType.BOOLEAN:
                if(binaryOperators.includes(this.lookAhead(1).type) && resolveOperators) {
                    return this.binaryOperation(tok);
                } else {
                    return this.literal(tok);
                }

            case TokenType.INTEGER_TYPE:
            case TokenType.FLOAT_TYPE:
            case TokenType.STRING_TYPE:
            case TokenType.BOOLEAN_TYPE:
                this.declaration(tok);
                break;
            
            case TokenType.IDENTIFIER:
                return this.identifier(tok);
            
            case TokenType.LEFT_PAREN:
                return this.operation(tok)
            
            case TokenType.TRUE:
            case TokenType.FALSE:
                return this.literal(tok);
            
            default:
                if(reservedKeywords.has(tok.lexeme)) this.reserved(tok);
                break;

        }
    }

    public literal(tok:Token) {
        if(tok.type == TokenType.TRUE || tok.type == TokenType.FALSE) {
            tok.literal = `${tok.type == TokenType.TRUE ? true : false}`;
            tok.type = TokenType.BOOLEAN;
        }
        return new Literal(tok.literal, tok.type);
    }

    public declaration(tok:Token) {
        const name = this.advance();
        const next = this.advance();


        switch(next.type) {
            case TokenType.EQUAL:
                return this.variableDeclaration(tok, name);
            case TokenType.LEFT_PAREN:
                return this.functionDeclaration(tok, name);
        }
    }

    public identifier(tok:Token) {
        switch(this.lookAhead(1).type) {
            case TokenType.EQUAL:
                return this.variableAssignment(tok);
            default:
                let variable = this.runtimeChache.get(tok.lexeme);
                if(variable instanceof Variable) {
                    return variable.value;
                } else {
                    this.error(tok, `Variable ${tok.lexeme} is not defined`);
                }
        }
    }

    public variableDeclaration(type:Token, name:Token) {
        const val = this.expression(this.advance());
        const typeLow = type.type.toLowerCase();

        // @ts-ignore
        if(val.valueType != typeLow) {
            const valAsLit = (val as Literal);

            // if(!(numeric.includes(valAsLit.valueType) && numeric.includes((typeLow as TokenType)))){
            //     // @ts-ignore
            //     this.error(type, error.variableTypeError(name.lexeme, typeLow, val.valueType),suggestions.variableTypeError);
            // }
            // (val as Literal).valueType = TokenType.FLOAT;

            if(typeLow == TokenType.FLOAT && valAsLit.valueType == TokenType.INTEGER) {
                (val as Literal).valueType = TokenType.FLOAT;
            } else {
                this.error(type, error.variableTypeError(name.lexeme, typeLow, val.valueType),suggestions.variableTypeError);
            }
        }
        // @ts-ignore
        const variable = new Variable(name, val, type.type);

        if(this.doesVarExist(name.lexeme)) this.error(name, error.variableDefinedError(name.lexeme));

        this.runtimeChache.set(name.lexeme, variable);
        return;
    }

    public variableAssignment(tok:Token) {
        const name = tok.lexeme;
        const val = this.expression(this.advance(2));
        const variable = this.runtimeChache.get(name);


        if(!variable) this.error(tok, error.variableDefinedError(name));

        // @ts-ignore
        if(val.valueType != variable.value.valueType) {
            const valAsLit = (val as Literal);
            const varAsVar = (variable as Variable)
            // if(!(numeric.includes(valAsLit.valueType) && numeric.includes((varAsVar.type.toLowerCase() as TokenType)))){
            // }
            // @ts-ignore
            this.error(tok, error.variableTypeError(name, variable.value.valueType, val.valueType),suggestions.variableTypeError);
        }

        // @ts-ignore
        variable.value = val;
        this.runtimeChache.set(name, variable);
        return val
    }

    public functionDeclaration(type:Token, name:Token) {}
    
    public operation(tok:Token, importedTokens?:Token[]) {
        let tokens:Token[];
        if(!importedTokens){
            tokens = [tok];
            while((this.lookAhead().type != TokenType.SEMICOLON)) {
                tokens.push(this.advance());
            }
        } else tokens = importedTokens;

        while(tokens.length > 1) {
            // console.log(tokens)
            let operator = tokens.find(t => t.type == TokenType.LEFT_PAREN)
            if(!operator) operator = tokens.find(t => t.type == TokenType.STAR || t.type == TokenType.SLASH)
            if(!operator) operator = tokens.find(t => t.type == TokenType.PLUS || t.type == TokenType.MINUS);
            if(!operator) break;
            const index = tokens.indexOf(operator);

            if(operator.type == TokenType.LEFT_PAREN) {
                const rightparen = tokens.find(t => t.type == TokenType.RIGHT_PAREN);
                const rightparenIndex = tokens.indexOf(rightparen);
                const groupedTokens = tokens.slice(index+1, rightparenIndex+1)
                const expr = this.operation(tokens[index+1],groupedTokens);

                tokens.splice(index, rightparenIndex - index + 1, expr);
                continue;
            }
    
            const left = tokens[index - 1];
            const right = tokens[index + 1];
    
            const leftVal = (left instanceof Literal) ? left : this.expression(left,false);
            const rightVal = (right instanceof Literal) ? right : this.expression(right,false);

            if(!(leftVal instanceof Literal && rightVal instanceof Literal)) {
                return;
            }
            
            !validOperationTypes.includes(leftVal.valueType) ? this.error(tok, error.operationNotSupportedType(leftVal.valueType)) : null;
            !validOperationTypes.includes(rightVal.valueType) ? this.error(tok, error.operationNotSupportedType(rightVal.valueType)) : null;

            let val;
    
            switch(operator.type) {
                case TokenType.PLUS:
                    val = new Literal(leftVal.value + rightVal.value, leftVal.valueType);
                    break;
                case TokenType.MINUS:
                    val = new Literal(leftVal.value - rightVal.value, leftVal.valueType);
                    break;
                case TokenType.STAR:
                    val = new Literal(leftVal.value * rightVal.value, leftVal.valueType);
                    break;
                case TokenType.SLASH:
                    val = new Literal(leftVal.value / rightVal.value, TokenType.FLOAT);
                    break;
            }

            tokens.splice(index - 1, 3, val);
        }

        return tokens[0];

    }

    public binaryOperation(tok:Token) {
        const left = tok;
        const operator = this.advance();
        const right = this.expression(this.advance());

        const leftVal = (left instanceof Literal) ? left : this.expression(left,false);
        const rightVal = (right instanceof Literal) ? right : this.expression(right,false);

        if(!(leftVal instanceof Literal && rightVal instanceof Literal)) {
            return;
        }

        switch(operator.type) {
            case TokenType.EQUAL_EQUAL:
                return new Literal(leftVal.value == rightVal.value, TokenType.BOOLEAN);
            case TokenType.BANG_EQUAL:
                return new Literal(leftVal.value != rightVal.value, TokenType.BOOLEAN);
            case TokenType.GREATER:
                return new Literal(leftVal.value > rightVal.value, TokenType.BOOLEAN);
            case TokenType.GREATER_EQUAL:
                return new Literal(leftVal.value >= rightVal.value, TokenType.BOOLEAN);
            case TokenType.LESS:
                return new Literal(leftVal.value < rightVal.value, TokenType.BOOLEAN);
            case TokenType.LESS_EQUAL:
                return new Literal(leftVal.value <= rightVal.value, TokenType.BOOLEAN);
            default:
                this.error(operator, `Attempted to use unsupported operator ${operator.lexeme} in a binary operation`);
        }
    }

    public groupedExpression(tok:Token) {
        const expr = this.operation(tok);
        return expr;
    }

    public stringOperation(tok:Token) {
        const tokens:Token[]= [tok];
        while(this.lookAhead().type != TokenType.SEMICOLON) {
            tokens.push(this.advance())
        }

        while (tokens.length > 1) {
            let operator = tokens.find(t => t.type == TokenType.DOT);
            if(!operator) this.error(tok,'Invalid operation.')
            const index = tokens.indexOf(operator);

            const left = tokens[index-1];
            const right = tokens[index+1];

            const leftVal = (left instanceof Literal) ? left : (this.expression(left,false) as Literal);
            const rightVal = (right instanceof Literal) ? right : (this.expression(right,false) as Literal);

            let value;
            value = new Literal(leftVal.value + rightVal.value, leftVal.valueType)

            tokens.splice(index-1,3,value)
        }
        return tokens[0]
    }

    public reserved(tok:Token) {
        switch(tok.type) {
            case TokenType.PRINT:
                const printValue = this.expression(this.advance());
                console.log((printValue as Literal).value);
                break;
            case TokenType.CLEAR:
                const next = this.advance();
                this.runtimeChache.delete(next.lexeme);
        }
    }

}

export class Token {
    public type:TokenType;
    public lexeme:string;
    public literal:string;
    public line:number;

    constructor(type:TokenType, lexeme:string, literal:string, line:number) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }
}

console.time('time')
const intepreter = new HiveScriptIntepreter(input)
console.timeEnd('time')
