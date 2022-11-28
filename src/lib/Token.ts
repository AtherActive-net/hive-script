import { TokenType } from "./Utilities.js";

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
