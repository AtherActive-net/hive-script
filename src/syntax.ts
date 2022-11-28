import {TokenType} from './lib/Utilities.js';
import {Token} from './lib/Token.js';

export class Expr {
    constructor() {
    }
}

export class Binary extends Expr {
    constructor(public left:Literal, public operator:Token, public right:Literal) {
        super();
    }
}

export class Operation extends Expr {
    constructor(public left:Literal, public operator:Token, public right:Literal) {
        super();
    }
}

export class Literal extends Expr {
    constructor(public value:any, public valueType:TokenType) {
        super();
    }
}

export class Identifier extends Expr {
    constructor(public name:Token) {
        super();
    }
}

export class Variable extends Identifier {
    constructor(public name:Token, public value:Expr, public type:TokenType) {
        super(name);
    }
}

export class Function extends Identifier {
    constructor(public name:Token, public params:Variable[], public body:Expr[]) {
        super(name);
    }
}
