import { Literal, Variable } from "syntax";

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
	FUNCTION = "FUNCTION",
	NEW = "NEW",
	RUN = "RUN",

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
	CLEAR = "CLEAR",
}

export const validOperationTypes = [TokenType.INTEGER, TokenType.FLOAT];

export const numeric = [TokenType.INTEGER, TokenType.FLOAT];

export const operators = [
	TokenType.PLUS,
	TokenType.MINUS,
	TokenType.STAR,
	TokenType.SLASH,
];

export const binaryOperators = [
	TokenType.EQUAL_EQUAL,
	TokenType.BANG_EQUAL,
	TokenType.GREATER,
	TokenType.GREATER_EQUAL,
	TokenType.LESS,
	TokenType.LESS_EQUAL,
];

// set up the basic keywords
export const reservedKeywords = new Map([
	["else", TokenType.ELSE],
	["false", TokenType.FALSE],
	["for", TokenType.FOR],
	["fun", TokenType.FUN],
	["if", TokenType.IF],
	["nil", TokenType.NIL],
	["or", TokenType.OR],
	["return", TokenType.RETURN],
	["super", TokenType.SUPER],
	["this", TokenType.THIS],
	["true", TokenType.TRUE],
	["while", TokenType.WHILE],

	// Variable type keywords
	["int", TokenType.INTEGER_TYPE],
	["flt", TokenType.FLOAT_TYPE],
	["str", TokenType.STRING_TYPE],
	["bool", TokenType.BOOLEAN_TYPE],

	["true", TokenType.TRUE],
	["false", TokenType.FALSE],

	// Other
	["entity", TokenType.CLASS],
	["prog", TokenType.FUNCTION],
	["create", TokenType.NEW],
	["run", TokenType.RUN],

	// STLib Keywords
	["output", TokenType.PRINT],
	["clear", TokenType.CLEAR],
]);

export const types = [
	TokenType.INTEGER_TYPE,
	TokenType.FLOAT_TYPE,
	TokenType.STRING_TYPE,
	TokenType.BOOLEAN_TYPE,
];

export function varToLiteral(variable: Variable): Literal {
	return new Literal(variable.value, variable.type);
}
