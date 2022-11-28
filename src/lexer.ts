import {TokenType, operators, binaryOperators, reservedKeywords, numeric, validOperationTypes, } from './lib/Utilities.js'
import {Token} from './lib/Token.js'

export class Lexer {
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
        if(this.position > this.input.length) return '\0';
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
        while(this.lookAhead() !== '"' && !(this.position >= this.input.length)) {
            if(this.lookAhead() === '\n') this.line++;
            text += this.advance();
        }

        if(this.position >= this.input.length) {
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