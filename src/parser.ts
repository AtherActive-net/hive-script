import {
	TokenType,
	operators,
	binaryOperators,
	reservedKeywords,
	numeric,
	validOperationTypes,
	types,
} from "./lib/Utilities.js";
import {
	Binary,
	Expr,
	Function,
	Literal,
	Operation,
	Variable,
} from "./syntax.js";
import { error, suggestions } from "./lib/error.js";
import { Token } from "./lib/Token.js";
import { HiveScriptIntepreter } from "./app.js";

export class ParserV2 {
	private position: number = -1;
	private tokens: Token[];
	private runtimeChache: Map<string, Expr> = new Map();
	public allowReturn: boolean = false;

	constructor(tokens: Token[], private intepreter: HiveScriptIntepreter) {
		this.tokens = tokens;
	}

	public getRuntimeCache() {
		return this.runtimeChache;
	}

	// Helper functions
	private isAtEnd() {
		return this.position + 1 >= this.tokens.length;
	}

	private advance(count: number = 1) {
		this.position += count;
		return this.tokens[this.position];
	}

	private lookAhead(count: number = 1) {
		return this.tokens[this.position + count];
	}

	private lookBack(count: number = 1) {
		return this.tokens[this.position - count];
	}

	private doesVarExist(name: string) {
		return this.runtimeChache.has(name);
	}

	private error(tok: Token, message: string, suggestion?: string) {
		const err = new Error("");
		console.log(`
    Error at line ${tok.line}: 
    ${message}

    ${suggestion ? suggestion : ""}
        `);
		process.exit(1);
	}

	//

	public parse() {
		let latest = null;
		while (!this.isAtEnd()) {
			const tok = this.advance();
			latest = this.expression(tok);
		}
		return latest;
	}

	public expression(tok: Token, resolveOperators: boolean = true) {
		// if (!tok) return;
		if (tok.type === TokenType.IDENTIFIER) {
			const id = this.identifier(tok) as Literal;
			tok = new Token(id.valueType, id.value, id.value, tok.line);
		}

		switch (tok.type) {
			case TokenType.INTEGER:
			case TokenType.FLOAT:
				if (
					operators.includes(this.lookAhead(1).type) &&
					resolveOperators
				) {
					return this.operation(tok);
				} else if (
					binaryOperators.includes(this.lookAhead(1).type) &&
					resolveOperators
				) {
					return this.binaryOperation(tok);
				} else {
					return this.literal(tok);
				}

			case TokenType.STRING:
				if (
					this.lookAhead(1)?.type == TokenType.DOT &&
					resolveOperators
				) {
					return this.stringOperation(tok);
				} else if (operators.includes(this.lookAhead(1)?.type)) {
					this.error(
						tok,
						error.operationNotSupportedType(tok.type),
						suggestions.operationNotSupportedType
					);
				} else {
					return this.literal(tok);
				}

			case TokenType.BOOLEAN:
				if (
					binaryOperators.includes(this.lookAhead(1).type) &&
					resolveOperators
				) {
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
				return this.operation(tok);

			case TokenType.TRUE:
			case TokenType.FALSE:
				return this.literal(tok);
			case TokenType.FUNCTION:
				this.functionDeclaration(this.advance(), this.advance());
				break;
			case TokenType.RUN:
				return this.functionExecution(this.advance());

			case TokenType.RETURN:
				if (!this.allowReturn)
					this.error(
						tok,
						error.returnOutsideFunction(),
						suggestions.returnOutsideFunction
					);

				const returnValue = this.expression(this.advance());

				if (returnValue instanceof Literal || !returnValue) {
					this.position = this.tokens.length + 1000;
					return returnValue;
				}
				break;
			default:
				if (reservedKeywords.has(tok.lexeme)) this.reserved(tok);
				break;
		}
	}

	public literal(tok: Token) {
		if (tok.type == TokenType.TRUE || tok.type == TokenType.FALSE) {
			tok.literal = `${tok.type == TokenType.TRUE ? true : false}`;
			tok.type = TokenType.BOOLEAN;
		}
		return new Literal(tok.literal, tok.type);
	}

	public declaration(tok: Token) {
		const name = this.advance();
		const next = this.advance();

		switch (next.type) {
			case TokenType.EQUAL:
				return this.variableDeclaration(tok, name);
			case TokenType.LEFT_PAREN:
				// TODO: Implement function execution
				// return this.functionDeclaration(tok, name);
				break;
		}
	}

	public identifier(tok: Token) {
		switch (this.lookAhead(1).type) {
			case TokenType.EQUAL:
				return this.variableAssignment(tok);
			default:
				let variable = this.runtimeChache.get(tok.lexeme);
				if (variable instanceof Variable) {
					return variable.value;
				} else {
					this.error(tok, `Variable ${tok.lexeme} is not defined`);
				}
		}
	}

	public variableDeclaration(type: Token, name: Token) {
		const val = this.expression(this.advance());
		const typeLow = type.type.toLowerCase();

		// @ts-ignore
		if (val.valueType != typeLow) {
			const valAsLit = val as Literal;

			// if(!(numeric.includes(valAsLit.valueType) && numeric.includes((typeLow as TokenType)))){
			//     // @ts-ignore
			//     this.error(type, error.variableTypeError(name.lexeme, typeLow, val.valueType),suggestions.variableTypeError);
			// }
			// (val as Literal).valueType = TokenType.FLOAT;

			if (
				typeLow == TokenType.FLOAT &&
				valAsLit.valueType == TokenType.INTEGER
			) {
				(val as Literal).valueType = TokenType.FLOAT;
			} else {
				this.error(
					type,
					error.variableTypeError(
						name.lexeme,
						typeLow,
						val.valueType
					),
					suggestions.variableTypeError
				);
			}
		}
		// @ts-ignore
		const variable = new Variable(name, val, type.type);

		if (this.doesVarExist(name.lexeme))
			this.error(name, error.variableDefinedError(name.lexeme));

		this.runtimeChache.set(name.lexeme, variable);
		return variable;
	}

	public variableAssignment(tok: Token) {
		const name = tok.lexeme;
		const val = this.expression(this.advance(2));
		const variable = this.runtimeChache.get(name);

		if (!variable) this.error(tok, error.variableDefinedError(name));

		// @ts-ignore
		if (val.valueType != variable.value.valueType) {
			const valAsLit = val as Literal;
			const varAsVar = variable as Variable;
			// if(!(numeric.includes(valAsLit.valueType) && numeric.includes((varAsVar.type.toLowerCase() as TokenType)))){
			// }
			// @ts-ignore
			this.error(
				tok,
				error.variableTypeError(
					name,
					variable.value.valueType,
					val.valueType
				),
				suggestions.variableTypeError
			);
		}

		// @ts-ignore
		variable.value = val;
		this.runtimeChache.set(name, variable);
		return val;
	}

	public functionArgumentDeclaration(tok: Token) {
		const type = this.advance();
		const name = this.advance();

		if (!types.includes(type.type) || name.type != TokenType.IDENTIFIER) {
			// todo: error
			return console.error("u goofed");
		}

		return new Variable(name, new Literal(null, type.type), type.type);
	}

	public functionDeclaration(type: Token, name: Token) {
		const args: Token[] = [];
		const params: Token[] = [];
		const body: Token[] = [];
		while (this.lookAhead().type != TokenType.RIGHT_PAREN) {
			args.push(this.functionArgumentDeclaration(this.advance()));
		}

		this.advance();

		// while (this.lookAhead().type != TokenType.LEFT_BRACE) {
		// 	// resolve to Variable
		// 	const vars = this.variableDeclaration(
		// 		this.advance(),
		// 		this.advance()
		// 	);
		// 	params.push(vars);
		// }

		// this.advance();

		while (this.lookAhead().type != TokenType.RIGHT_BRACE) {
			body.push(this.advance());
		}

		this.advance();

		const func = new Function(name, type, args, body);
		this.runtimeChache.set(name.lexeme, func);
	}

	public functionExecution(tok: Token) {
		const func = this.runtimeChache.get(tok.lexeme) as Function;
		const params = [];

		if (this.lookAhead().type != TokenType.LEFT_PAREN) {
			console.log(tok);
			console.log(this.lookAhead());
			process.exit(1);
		}

		this.advance();

		while (this.lookAhead().type != TokenType.RIGHT_PAREN) {
			params.push(this.expression(this.advance()));
			if (this.lookAhead().type != TokenType.COMMA) break;
			this.advance();
		}

		const parser = new ParserV2(func.body as Token[], this.intepreter);
		parser.allowReturn = true; // required for return statements to work

		params.forEach((p, i) => {
			const functionArgument = func.params[i];
			const variable = new Variable(
				functionArgument.name,
				p,
				functionArgument.type
			);
			parser.runtimeChache.set(functionArgument.name.lexeme, variable);
		});

		console.log(params);
		return parser.parse();
	}

	public operation(tok: Token, importedTokens?: Token[]) {
		let tokens: Token[];
		if (!importedTokens) {
			tokens = [tok];
			while (this.lookAhead().type != TokenType.SEMICOLON) {
				tokens.push(this.advance());
			}
		} else tokens = importedTokens;

		while (tokens.length > 1) {
			// console.log(tokens)
			let operator = tokens.find((t) => t.type == TokenType.LEFT_PAREN);
			if (!operator)
				operator = tokens.find(
					(t) => t.type == TokenType.STAR || t.type == TokenType.SLASH
				);
			if (!operator)
				operator = tokens.find(
					(t) => t.type == TokenType.PLUS || t.type == TokenType.MINUS
				);
			if (!operator) break;
			const index = tokens.indexOf(operator);

			if (operator.type == TokenType.LEFT_PAREN) {
				const rightparen = tokens.find(
					(t) => t.type == TokenType.RIGHT_PAREN
				);
				const rightparenIndex = tokens.indexOf(rightparen);
				const groupedTokens = tokens.slice(
					index + 1,
					rightparenIndex + 1
				);
				const expr = this.operation(tokens[index + 1], groupedTokens);

				tokens.splice(index, rightparenIndex - index + 1, expr);
				continue;
			}

			const left = tokens[index - 1];
			const right = tokens[index + 1];

			const leftVal =
				left instanceof Literal ? left : this.expression(left, false);
			const rightVal =
				right instanceof Literal
					? right
					: this.expression(right, false);

			if (!(leftVal instanceof Literal && rightVal instanceof Literal)) {
				return;
			}

			!validOperationTypes.includes(leftVal.valueType)
				? this.error(
						tok,
						error.operationNotSupportedType(leftVal.valueType)
				  )
				: null;
			!validOperationTypes.includes(rightVal.valueType)
				? this.error(
						tok,
						error.operationNotSupportedType(rightVal.valueType)
				  )
				: null;

			let val;

			switch (operator.type) {
				case TokenType.PLUS:
					val = new Literal(
						leftVal.value + rightVal.value,
						leftVal.valueType
					);
					break;
				case TokenType.MINUS:
					val = new Literal(
						leftVal.value - rightVal.value,
						leftVal.valueType
					);
					break;
				case TokenType.STAR:
					val = new Literal(
						leftVal.value * rightVal.value,
						leftVal.valueType
					);
					break;
				case TokenType.SLASH:
					val = new Literal(
						leftVal.value / rightVal.value,
						TokenType.FLOAT
					);
					break;
			}

			tokens.splice(index - 1, 3, val);
		}

		return tokens[0];
	}

	public binaryOperation(tok: Token) {
		const left = tok;
		const operator = this.advance();
		const right = this.expression(this.advance());

		const leftVal =
			left instanceof Literal ? left : this.expression(left, false);
		const rightVal =
			right instanceof Literal ? right : this.expression(right, false);

		if (!(leftVal instanceof Literal && rightVal instanceof Literal)) {
			return;
		}

		switch (operator.type) {
			case TokenType.EQUAL_EQUAL:
				return new Literal(
					leftVal.value == rightVal.value,
					TokenType.BOOLEAN
				);
			case TokenType.BANG_EQUAL:
				return new Literal(
					leftVal.value != rightVal.value,
					TokenType.BOOLEAN
				);
			case TokenType.GREATER:
				return new Literal(
					leftVal.value > rightVal.value,
					TokenType.BOOLEAN
				);
			case TokenType.GREATER_EQUAL:
				return new Literal(
					leftVal.value >= rightVal.value,
					TokenType.BOOLEAN
				);
			case TokenType.LESS:
				return new Literal(
					leftVal.value < rightVal.value,
					TokenType.BOOLEAN
				);
			case TokenType.LESS_EQUAL:
				return new Literal(
					leftVal.value <= rightVal.value,
					TokenType.BOOLEAN
				);
			default:
				this.error(
					operator,
					`Attempted to use unsupported operator ${operator.lexeme} in a binary operation`
				);
		}
	}

	public groupedExpression(tok: Token) {
		const expr = this.operation(tok);
		return expr;
	}

	public stringOperation(tok: Token) {
		const tokens: Token[] = [tok];
		while (this.lookAhead().type != TokenType.SEMICOLON) {
			tokens.push(this.advance());
		}

		while (tokens.length > 1) {
			let operator = tokens.find((t) => t.type == TokenType.DOT);
			if (!operator) this.error(tok, "Invalid operation.");
			const index = tokens.indexOf(operator);

			const left = tokens[index - 1];
			const right = tokens[index + 1];

			const leftVal =
				left instanceof Literal
					? left
					: (this.expression(left, false) as Literal);
			const rightVal =
				right instanceof Literal
					? right
					: (this.expression(right, false) as Literal);

			let value;
			value = new Literal(
				leftVal.value + rightVal.value,
				leftVal.valueType
			);

			tokens.splice(index - 1, 3, value);
		}
		return tokens[0];
	}

	// Yes, this should be moved. Not done yet.
	public reserved(tok: Token) {
		if (!tok) return;
		switch (tok.type) {
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
