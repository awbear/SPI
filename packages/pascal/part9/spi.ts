import * as fs from 'fs';

import { isdigit, isSpace, isalnum, isalpha } from '../../helper';

export enum TokenType {
    INTEGER = 'INTEGER',
    PLUS = 'PLUS',
    MINUS = 'MINUS',
    MUL = 'MUL',
    DIV = 'DIV',
    LPAREN = '(',
    RPAREN = ')',
    EOF = 'EOF',
    BEGIN = 'BEGIN',
    END = 'END',
    ID = 'ID',
    ASSIGN = ':=',
    SEMI = ';',
    DOT = '.',
}

class NameError extends Error {
    constructor(msg='') {
        super('variable error: ' + msg);
        this.name = this.constructor.name;
    }
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

    RESERVED_KEYWORDS: {
        [index: string]: Token
    } = {
        BEGIN: new Token(TokenType.BEGIN, 'BEGIN'),
        END: new Token(TokenType.END, 'END'),
    }

    constructor(text: string) {
        this.text = text;
        this.pos = 0;
        this.current_char = this.text[this.pos];
    }

    error(msg='') {
        throw new Error('Invalid character: ' + msg)
    }
    
    peek() {
        let peek_pos = this.pos + 1;
        if (peek_pos > this.text.length - 1) {
            return null
        }
        return this.text[peek_pos]
    }

    _id() {
        let result = '';
        while(this.current_char && isalnum(this.current_char)) {
            result += this.current_char;
            this.advance();
        }
        const token = this.RESERVED_KEYWORDS[result] || new Token(TokenType.ID, result);
        return token;
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
        while(this.current_char && (isdigit(this.current_char))){
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

            if (isdigit(this.current_char)) {
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

            if (isalpha(this.current_char)) {
                return this._id();
            }

            if (this.current_char === ':' && this.peek() === '=') {
                this.advance();
                this.advance();
                return new Token(TokenType.ASSIGN, ':=')
            }

            if (this.current_char === ';') {
                this.advance();
                return new Token(TokenType.SEMI, ';');
            }

            if (this.current_char === '.') {
                this.advance();
                return new Token(TokenType.DOT, '.');
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

export class UnaryOp extends AST {
    op: Token;
    expr: AST;
    constructor(op: Token, expr: AST) {
        super();
        this.op = op;
        this.expr = expr;
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

/**
 * Represents a 'BEGIN ... END' block
 */
export class Compound extends AST {
    child: Array<AST>;
    constructor() {
        super();
        this.child = []
    }
    add(node: AST) {
        this.child.push(node)
    }
}

/**
 * represents assgin op `:=`
 */
export class Assign extends AST {
    left: Var;
    token: Token;
    op: Token;
    right: AST;
    constructor(left: Var, op: Token, right: AST) {
        super();
        this.left = left;
        this.token = this.op = op;
        this.right = right;
    }
}

/**
 * Var node is constructed out of ID token
 */
export class Var extends AST {
    token: Token;
    value: Token['value']
    constructor(token: Token) {
        super();
        this.token = token; 
        this.value = token.value;
    }
}

export class NoOp extends AST {
    constructor() {
        super()
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
     * program: compound_statement DOT
     */
    program() {
        const node = this.compound_statement();
        this.eat(TokenType.DOT);
        return node;
    }

    /**
     * compound_statement: BEGIN statement_list END
     */
    compound_statement() {
        this.eat(TokenType.BEGIN);
        const nodes = this.statement_list()
        this.eat(TokenType.END);
        const root = new Compound();
        nodes.forEach(ele => {
            root.add(ele);
        });
        return root;
    }

    /**
     * statement_list : statement
     *                  | statement SEMI statement_list
     */
    statement_list() {
        const node = this.statement();
        const results = [node];

        while(this.current_token.type === TokenType.SEMI) {
            this.eat(TokenType.SEMI);
            results.push(this.statement())
        }

        if (this.current_token.type === TokenType.ID) {
            this.error(this.current_token.str());
        }

        return results;
    }

    /**
     * statement : compound_statement
     *            |  assignment_statement
     *            | empty
     */
    statement() {
        switch(this.current_token.type) {
            case TokenType.BEGIN:
                return this.compound_statement();
            case TokenType.ID:
                return this.assignment_statement();
            default:
                return this.empty();
        }
    }

    /**
     * assignment_statement : variable ASSIGN expr
     */
    assignment_statement() {
        const left = this.variable();
        const token = this.current_token;
        this.eat(TokenType.ASSIGN);
        const right = this.expr();
        return new Assign(left, token, right)
    }

    /**
     * variable : ID
     */
    variable() {
        const node = new Var(this.current_token)
        this.eat(TokenType.ID)
        return node;
    }

    empty() {
        return new NoOp();
    }

    /**
     * return an INTEGER token value
     * factor : PLUS  factor
     *        | MINUS factor
     *        | INTEGER
     *        | LPAREN expr RPAREN
     *        | variable
     */
    factor(): AST {
        let token = this.current_token;
        switch(token.type) {
            case TokenType.PLUS:
                this.eat(TokenType.PLUS);
                return new UnaryOp(token, this.factor());
            case TokenType.MINUS:
                this.eat(TokenType.MINUS)
                return new UnaryOp(token, this.factor());
            case TokenType.INTEGER:
                this.eat(TokenType.INTEGER);
                return new Num(token);
            case TokenType.LPAREN:
                this.eat(TokenType.LPAREN);
                let node = this.expr();
                this.eat(TokenType.RPAREN);
                return node;
            default:
                return this.variable();
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

    parse() {
        const node = this.program();
        if (this.current_token.type !== TokenType.EOF) {
            this.error();
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
        return visitor.call(this, node)
    }
    generic_visit(node: AST) {
        throw new Error(`No visit_${node.constructor.name} method`);
    }
}

export class Interpreter extends NodeVisitor {
    parser: Parser;

    GLOBAL_SCOPE: {
        [index: string]: Token['value']
    } = {}
    constructor(parser: Parser) {
        super();
        this.parser = parser;
    }

    visit_Compound(node: Compound) {
        node.child.forEach((child) => {
            this.visit(child);
        })
    }

    visit_NoOp(node: NoOp) {}

    visit_Assign(node: Assign) {
        this.GLOBAL_SCOPE[node.left.value] = this.visit(node.right)
    }

    visit_Var(node: Var) {
        const var_name = node.value;
        const value = this.GLOBAL_SCOPE[var_name] || undefined;
        if (value === undefined) {
            throw new NameError(var_name.toString());
        }
        return value;
    }

    visit_BinOp(node: BinOp) {
        const t = node.op.type;
        if (t === TokenType.PLUS) {
            return this.visit(node.left) + this.visit(node.right);
        } else if (t === TokenType.MINUS) {
            return this.visit(node.left) - this.visit(node.right);
        } else if (t === TokenType.MUL) {
            return this.visit(node.left) * this.visit(node.right);
        } else if (t === TokenType.DIV) {
            return this.visit(node.left) / this.visit(node.right);
        }
    }

    visit_UnaryOp(node: UnaryOp) {
        const t = node.op.type;
        if (t === TokenType.PLUS) {
            return +this.visit(node.expr)
        } else if (t === TokenType.MINUS) {
            return -this.visit(node.expr);
        }
    }

    visit_Num(node: Num) {
        return node.value;
    }

    interpret() {
        const tree = this.parser.parse()
        if (!tree) {
            return ''
        }
        return this.visit(tree)
    }
}

function main() {
    fs.readFile(process.argv[2], 'utf8', (err, text) => {
        if (err) {
            console.log(err)
            process.exit(-1)
        }
        let lexer = new Lexer(text);
        let parser = new Parser(lexer);
        let interpreter = new Interpreter(parser);
        interpreter.interpret()
        console.log(interpreter.GLOBAL_SCOPE)
    })
}

if (require.main === module) {
    main();
}

