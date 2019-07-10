import { Token, TokenType } from './token';
import { Lexer } from './lexer';
import { ErrorCode, ParseError } from './error';


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

export class Param extends AST {
    var_node: Var;
    type_node: Token;
    constructor(var_node: Var, type_node: Token) {
        super();
        this.var_node = var_node;
        this.type_node = type_node;
    }
}

export class ProcedureDecl extends AST {
    proc_name: string
    block_node: Block;
    params: Array<Param>;
    constructor(proc_name: string, block_node: Block, params: Array<Param>) {
        super();
        this.proc_name = proc_name;
        this.block_node = block_node;
        this.params = params;
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

    error(error_code: ErrorCode, token: Token) {
      throw new ParseError(`${error_code} -> ${token}`, error_code, token);
    }

    eat(token_type: TokenType) {
      if (this.current_token.type === token_type) {
        this.current_token = this.lexer.get_next_token();
      } else {
        this.error(ErrorCode.UNEXPECTED_TOKEN, this.current_token);
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
     * formal_parameter_list : formal_parameters
     *                        | formal_parameters SEMI formal_parameter_list
     */
    formal_parameter_list() {
      return []
    }

    /**
     * formal_parameters : ID (COMMA ID)* COLON type_spec
     */
    formal_parameters() {
        let param_nodes = []
    }

    /**
     * declarations : (VAR (variable_declaration SEMI)+)*
     *               | (PROCEDURE ID (LPAREN formal_parameter_list RPAREN)? SEMI block SEMI)*
     *               | empty
     */
    declarations() {
      const declarations = [];
      if (this.current_token.type === TokenType.VAR) {
        while (this.current_token.type === TokenType.VAR) {
          this.eat(TokenType.VAR);
          // @ts-ignore
          while(this.current_token.type === TokenType.ID) {
            const var_decl = this.variable_declaration();
            declarations.push(...var_decl);
            this.eat(TokenType.SEMI);
          }
        }
      }
      while (this.current_token.type === TokenType.PROCEDURE) {
        const proc_decl = this.procedure_declaration();
        declarations.push(proc_decl);
        this.eat(TokenType.SEMI);
      }
      return declarations;
    }

    /**
     * procedure_declaration :
     *   PROCEDURE ID (LPAREN formal_parameter_list RPAREN)? SEMI block SEMI
     */
    procedure_declaration() {
      this.eat(TokenType.PROCEDURE);
      const proc_name = this.current_token.value;
      this.eat(TokenType.ID);
      let params = []

      if (this.current_token.type === TokenType.LPAREN) {
        this.eat(TokenType.LPAREN);
        params = this.formal_parameter_list();
        this.eat(TokenType.RPAREN)
      }
      this.eat(TokenType.SEMI);
      const block_node = this.block() as Block;
      const proc_decl = new ProcedureDecl(proc_name.toString(), block_node, params);
      this.eat(TokenType.SEMI);
      return proc_decl;
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
