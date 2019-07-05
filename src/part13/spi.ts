import * as fs from 'fs';

import { isdigit, isSpace, isalnum, isalpha } from '../helper';
import { Token, TokenType } from './token'
import { SymbolTable, VarSymbol } from './symbol';

class NameError extends Error {
    constructor(msg='') {
        super('variable error: ' + msg);
        this.name = this.constructor.name;
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
        PROGRAM: new Token(TokenType.PROGRAM, 'PROGRAM'),
        VAR: new Token(TokenType.VAR, 'VAR'),
        DIV: new Token(TokenType.INTEGER_DIV, 'DIV'),
        INTEGER: new Token(TokenType.INTEGER, 'INTEGER'),
        REAL: new Token(TokenType.REAL, 'REAL'),
        BEGIN: new Token(TokenType.BEGIN, 'BEGIN'),
        END: new Token(TokenType.END, 'END'),
        PROCEDURE: new Token(TokenType.PROCEDURE, 'PROCEDURE'),
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

    skip_comment() {
        while(this.current_char !== '}') {
            this.advance();
        }
        // skip the closing curly brace
        this.advance();
    }

    /**
     * return a (multidigit) integer consumed from the input
     */
    number() {
        let result = '';
        while(this.current_char && (isdigit(this.current_char))){
            result += this.current_char;
            this.advance();
        }
        if (this.current_char === '.') {
            result += this.current_char;
            this.advance();
            while (this.current_char && (isdigit(this.current_char))) {
                result += this.current_char;
                this.advance();
            }
            return new Token(TokenType.REAL_CONST, Number.parseFloat(result))
        }
        return new Token(TokenType.INTEGER_CONST, Number.parseInt(result, 10));
    }

    get_next_token() {
        while(this.current_char) {
            if (isSpace(this.current_char)) {
                this.skip_whitespace();
                continue;
            }

            if (this.current_char === '{') {
                this.advance();
                this.skip_comment();
                continue;
            }

            if (isdigit(this.current_char)) {
                return this.number();
            }

            if (this.current_char === ',') {
                this.advance();
                return new Token(TokenType.COMMA, ',');
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
                return new Token(TokenType.FLOAT_DIV, '/')
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

            if (this.current_char === ':') {
                this.advance()
                return new Token(TokenType.COLON, ':');
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

export class Program extends AST {
    name: string;
    block: Block;
    constructor(name: string, block: Block) {
        super();
        this.name = name;
        this.block = block;
    }
}

export class Block extends AST {
    declarations: Array<VarDecl | ProcedureDecl>;
    compound_statement: Compound;
    constructor(declarations: Array<VarDecl | ProcedureDecl>, compound_statement: Compound) {
        super();
        this.declarations = declarations;
        this.compound_statement = compound_statement;
    }
}

export class VarDecl extends AST {
    var_node: Var;
    type_node: Type;
    constructor(var_node: Var, type_node: Type) {
        super();
        this.var_node = var_node;
        this.type_node = type_node;
    }
}

export class Type extends AST {
    token: Token;
    value: Token['value'];
    constructor(token: Token) {
        super();
        this.token = token;
        this.value = token.value;
    }
}

export class ProcedureDecl extends AST {
    proc_name: string
    block_node: Block;
    constructor(proc_name: string, block_node: Block) {
        super();
        this.proc_name = proc_name;
        this.block_node = block_node;
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
     * program : PROGRAM variable SEMI block DOT
     */
    program() {
        this.eat(TokenType.PROGRAM)
        const var_node = this.variable();
        const prog_name = var_node.value;
        this.eat(TokenType.SEMI)
        const block_node = this.block();
        const prog_node = new Program(prog_name.toString(), block_node);
        this.eat(TokenType.DOT);
        return prog_node;
    }

    /**
     * block : declarations compound_statement
     */
    block() {
        const declaration_nodes = this.declarations();
        const compound_statement_node = this.compound_statement();
        return new Block(declaration_nodes, compound_statement_node);
    }

    /**
     * declarations : VAR (variable_declaration SEMI)+
     *              | (PROCEDURE ID SEMI block SEMI)*
     *              | empty
     */
    declarations() {
        const declarations = [];
        if (this.current_token.type === TokenType.VAR) {
            this.eat(TokenType.VAR);
            // @ts-ignore
            while(this.current_token.type === TokenType.ID) {
                const var_decl = this.variable_declaration();
                declarations.push(...var_decl);
                this.eat(TokenType.SEMI);
            }
        }
        while (this.current_token.type === TokenType.PROCEDURE) {
            this.eat(TokenType.PROCEDURE);
            const proc_name = this.current_token.value;
            this.eat(TokenType.ID);
            this.eat(TokenType.SEMI);
            const block_node = this.block() as Block;
            const proc_decl = new ProcedureDecl(proc_name.toString(), block_node);
            declarations.push(proc_decl);
            this.eat(TokenType.SEMI);
        }
        return declarations;
    }

    /**
     * variable_declaration : ID (COMMA ID)* COLON type_spec
     */
    variable_declaration() {
        // first ID
        const var_nodes = [new Var(this.current_token)];
        this.eat(TokenType.ID)
        while(this.current_token.type === TokenType.COMMA) {
            this.eat(TokenType.COMMA);
            var_nodes.push(new Var(this.current_token))
            this.eat(TokenType.ID);
        }
        this.eat(TokenType.COLON);
        const type_node = this.type_spec();
        return var_nodes.map((node) => {
            return new VarDecl(node, type_node);
        });
    }

    /**
     * type_spec : INTEGER
     *           | REAL
     */
    type_spec() {
        const token = this.current_token;
        if (token.type === TokenType.INTEGER) {
            this.eat(TokenType.INTEGER)
        } else {
            this.eat(TokenType.REAL);
        }
        return new Type(token);
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
            this.error(this.current_token.toString());
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
     *        | INTEGER_CONST
     *        | REAL_CONST
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
            case TokenType.INTEGER_CONST:
                this.eat(TokenType.INTEGER_CONST);
                return new Num(token);
            case TokenType.REAL_CONST:
                this.eat(TokenType.REAL_CONST);
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
     * term : factor ((MUL | INTEGER_DIV | FLOAT_DIV) factor)*
     */
    term() {
        let node = this.factor();
        while([TokenType.MUL, TokenType.FLOAT_DIV, TokenType.INTEGER_DIV].includes(this.current_token.type)) {
            let token = this.current_token;
            if (token.type === TokenType.MUL) {
                this.eat(TokenType.MUL)
            } else if (token.type === TokenType.INTEGER_DIV) {
                this.eat(TokenType.INTEGER_DIV);
            } else if (token.type === TokenType.FLOAT_DIV) {
                this.eat(TokenType.FLOAT_DIV);
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
    tree: any;

    GLOBAL_SCOPE: {
        [index: string]: Token['value']
    } = {}
    constructor(tree: any) {
        super();
        this.tree = tree;
    }

    visit_Program(node: Program) {
        this.visit(node.block);
    }

    visit_Block(node: Block) {
        node.declarations.forEach((item) => {
            this.visit(item);
        })
        this.visit(node.compound_statement);
    }

    visit_VarDecl(node: VarDecl) {}

    visit_ProcedureDecl(node: ProcedureDecl) {}

    visit_Type(node: Type) {}

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
        } else if (t === TokenType.FLOAT_DIV) {
            return this.visit(node.left) / this.visit(node.right);
        } else if (t === TokenType.INTEGER_DIV) {
            return Number.parseInt((this.visit(node.left) / this.visit(node.right)).toFixed(0), 10);
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
        const tree = this.tree;
        if (!tree) {
            return ''
        }
        return this.visit(tree)
    }
}

export class SymbolTableBuilder extends NodeVisitor {
    symtab: SymbolTable;
    constructor() {
        super();
        this.symtab = new SymbolTable();
    }

    visit_Block(node: Block) {
        node.declarations.forEach((decl) => {
            this.visit(decl);
        })
        this.visit(node.compound_statement)
    }

    visit_Program(node: Program) {
        this.visit(node.block);
    }

    visit_BinOp(node: BinOp) {
        this.visit(node.left);
        this.visit(node.right);
    }

    visit_Num(node: Num) {}

    visit_UnaryOp(node: UnaryOp) {
        this.visit(node.expr);
    }

    visit_Compound(node: Compound) {
        node.child.forEach((child) => {
            this.visit(child);
        })
    }

    visit_VarDecl(node: VarDecl) {
        const type_name = node.type_node.value;
        const type_symbol = this.symtab.lookup(type_name.toString())
        const var_name = node.var_node.value;
        const var_symbol = new VarSymbol(var_name.toString(), type_symbol)
        this.symtab.define(var_symbol);
    }

    visit_ProcedureDecl(node: ProcedureDecl) {}

    visit_Assign(node: Assign) {
        const var_name = node.left.value;
        const var_symbol = this.symtab.lookup(var_name.toString());
        if (!var_symbol) {
            throw new NameError(var_name.toString())
        }
        this.visit(node.right)
    }

    visit_Var(node: Var) {
        const var_name = node.value;
        const var_symbol = this.symtab.lookup(var_name.toString());
        if (!var_symbol) {
            throw new NameError(var_name.toString());
        }
    }

    visit_NoOp(node: NoOp) {}
}

export class SemanticAnalyzer extends NodeVisitor {
    symtab: SymbolTable;
    constructor() {
        super();
        this.symtab = new SymbolTable();
    }

    visit_Block(node: Block) {
        node.declarations.forEach((decl) => {
            this.visit(decl);
        })
        this.visit(node.compound_statement)
    }

    visit_Program(node: Program) {
        this.visit(node.block);
    }

    visit_Compound(node: Compound) {
        node.child.forEach((child) => {
            this.visit(child);
        })
    }

    visit_NoOp(node: NoOp) {}

    visit_VarDecl(node: VarDecl) {
        const type_name = node.type_node.value
        const type_symbol = this.symtab.lookup(type_name.toString())

        const var_name = node.var_node.value.toString();
        const var_symbol = new VarSymbol(var_name, type_symbol)

        if (this.symtab.lookup(var_name)) {
            throw new Error(`Duplicate identifier ${var_name} found`)
        }

        this.symtab.insert(var_symbol);
    }

    visit_Var(node: Var) {
        const var_name = node.value;
        const var_symbol = this.symtab.lookup(var_name.toString());
        if (!var_symbol) {
            throw new NameError(var_name.toString());
        }
    }

    visit_ProcedureDecl(node: ProcedureDecl) {}

    visit_Assign(node: Assign) {
        const var_name = node.left.value;
        const var_symbol = this.symtab.lookup(var_name.toString());
        if (!var_symbol) {
            throw new NameError(var_name.toString())
        }
        this.visit(node.right)
    }

    visit_BinOp(node: BinOp) {
        this.visit(node.left);
        this.visit(node.right);
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
        const tree = parser.parse();
        const semantic_analyzer = new SemanticAnalyzer()
        semantic_analyzer.visit(tree)
        console.log('symbol table contents: \n%s', semantic_analyzer.symtab)
        let interpreter = new Interpreter(tree);
        interpreter.interpret()
        console.log('Runtime result: \n', interpreter.GLOBAL_SCOPE)
    })
}

if (require.main === module) {
    main();
}

