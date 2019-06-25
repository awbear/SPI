import { isNumeric, isSpace } from './helper';
import * as readline from 'readline';

export enum TokenType {
    INTEGER = 'INTEGER',
    PLUS = 'PLUS',
    MINUS = 'MINUS',
    MUL = 'MUL',
    DIV = 'DIV',
    LPAREN = '(',
    RPAREN = ')',
    EOF = 'EOF',
}

export class Token {
    type: TokenType;
    value: string | number | null;
    constructor(type: TokenType, value: string | number | null) {
        this.type = type;
        this.value = value;
    }

    str() {
        return `Token(${this.type}, ${this.value})`
    }

    repr() {
        return this.str()
    }
}

export class Lexer {
    text: string;
    pos: number;
    current_token: Token | null;
    current_char: string;

    constructor(text: string) {
        this.text = text;
        this.pos = 0;
        this.current_char = this.text[this.pos];
    }

    error(msg='') {
        throw new Error('Invalid character: ' + msg)
    }

    advance() {
        this.pos += 1;
        if (this.pos > (this.text.length -1)) {
            // indicates end of input
            this.current_char = null;
        } else {
            this.current_char = this.text[this.pos];
        }
    }

    skip_whitespace() {
        while(this.current_char && (isSpace(this.current_char))) {
            this.advance();
        }
    }

    /**
     * return a (multidigit) integer consumed from the input
     */
    integer() {
        let result = '';
        while(this.current_char && (isNumeric(this.current_char))){
            result += this.current_char;
            this.advance();
        }
        return Number.parseInt(result, 10);
    }

    get_next_token() {
        while(this.current_char) {
            if (isSpace(this.current_char)) {
                this.skip_whitespace();
                continue;
            }

            if (isNumeric(this.current_char)) {
                return new Token(TokenType.INTEGER, this.integer())
            }

            if (this.current_char === '+') {
                this.advance();
                return new Token(TokenType.PLUS, '+');
            }

            if (this.current_char === '-') {
                this.advance();
                return new Token(TokenType.MINUS, '-');
            }

            if (this.current_char === '*') {
                this.advance();
                return new Token(TokenType.MUL, '*');
            }

            if (this.current_char === '/') {
                this.advance();
                return new Token(TokenType.DIV, '/')
            }

            if (this.current_char === '(') {
                this.advance();
                return new Token(TokenType.LPAREN, '(');
            }

            if (this.current_char === ')') {
                this.advance();
                return new Token(TokenType.RPAREN, ')');
            }


            this.error(this.current_char);
        }
        return new Token(TokenType.EOF, null)
    }


}

//###############################################################################
//#                                                                             #
//#  PARSER                                                                     #
//#                                                                             #
// ###############################################################################
//

export class AST {}

export class BinOp extends AST {
    left: AST;
    op: Token;
    right: AST;
    constructor(left: AST, op: Token, right: AST) {
        super();
        this.left = left;
        this.op = op;
        this.right = right;
    }
}


export class Num extends AST {
    token: Token;
    value: Token['value'];
    constructor(token: Token) {
        super();
        this.token = token;
        this.value = token.value;
    }
}


export class Parser {
    lexer: Lexer;
    current_token: Token | null;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        // set current token to the first token taken from the input
        this.current_token = this.lexer.get_next_token();
    }

    error(msg='') {
        throw new Error(`Invalid Syntax: ${msg}`)
    }

    eat(token_type: TokenType) {
        if (this.current_token.type === token_type) {
            this.current_token = this.lexer.get_next_token();
        } else {
            this.error(`${this.current_token.repr()}: ${token_type}`)
        }
    }

    /**
     * return an INTEGER token value
     * fator : INTEGER | LPAREN expr RPAREN
     */
    factor(): AST {
        let token = this.current_token;
        if (token.type === TokenType.INTEGER) {
            this.eat(TokenType.INTEGER)
            return new Num(token);
        } else if (token.type === TokenType.LPAREN) {
            this.eat(TokenType.LPAREN);
            let node = this.expr();
            this.eat(TokenType.RPAREN);
            return node;
        }
    }

    /**
     * term: factor ((MUL | DIV) factor) *
     */
    term() {
        let node = this.factor();
        while([TokenType.MUL, TokenType.DIV].includes(this.current_token.type)) {
            let token = this.current_token;
            if (token.type === TokenType.MUL) {
                this.eat(TokenType.MUL)
            } else if (token.type === TokenType.DIV) {
                this.eat(TokenType.DIV);
            }
            node = new BinOp(node, token, this.factor())
        }
        return node;
    }

    /**
     * expr : term ((MUL / DIV) term)*
     * term : factor ((MUL | DIV) factor) *
     * factor : INTEGER | LPAREN expr RPAREN
     *
     */
    expr() {
        let node = this.term();
        while([TokenType.PLUS, TokenType.MINUS].includes(this.current_token.type)) {
            let token = this.current_token;
            if (token.type === TokenType.PLUS) {
                this.eat(TokenType.PLUS)
            } else if (token.type === TokenType.MINUS) {
                this.eat(TokenType.MINUS);
            }
            node = new BinOp(node, token, this.term())
        }
        return node;
    }
}

//###############################################################################
//#                                                                             #
//#  INTERPRETER                                                                #
//#                                                                             #
//###############################################################################
//
//
type visitor_func = (node: AST) => any;

export class NodeVisitor {
    constructor() {}
    visit(node: AST) {
        const method_name = `visit_${node.constructor.name}`;
        // @ts-ignore
        const visitor = (this[method_name] as visitor_func) || this.generic_visit;
        return visitor(node)
    }
    generic_visit(node: AST) {
        throw new Error(`No visit_${node.constructor.name} method`);
    }
}

export class Interpreter {
    parser: Parser;
    constructor(parser: Parser) {
        this.parser = parser;
    }
}

function main() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('calc> ', (text) => {
    if (!text) {
        return;
    }
    let lexer = new Lexer(text);
    let interpreter = new Interpreter();
        console.log(interpreter.expr())
        rl.close();
    });
}

if (require.main === module) {
    main();
}

