import { isdigit, isSpace } from '../helper';
import * as readline from 'readline';

enum TokenType {
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


            this.error(this.current_char);
        }
        return new Token(TokenType.EOF, null)
    }


}

export class Interpreter {
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


    //##########################################################
    //# Parser / Interpreter code                              #
    //##########################################################

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
    factor(): number {
        let token = this.current_token;
        if (token.type === TokenType.INTEGER) {
            this.eat(TokenType.INTEGER)
            return token.value as number;
        } else if (token.type === TokenType.LPAREN) {
            this.eat(TokenType.LPAREN);
            let result = this.expr();
            this.eat(TokenType.RPAREN);
            return result;
        }
    }

    /**
     * term: factor ((MUL | DIV) factor) *
     */
    term() {
        let result = this.factor();
        while([TokenType.MUL, TokenType.DIV].includes(this.current_token.type)) {
            let token = this.current_token;
            if (token.type === TokenType.MUL) {
                this.eat(TokenType.MUL)
                result = result * this.factor();
            } else if (token.type === TokenType.DIV) {
                this.eat(TokenType.DIV);
                result  = result / this.factor()
            }
        }
        return result;
    }

    /**
     * expr : term ((MUL / DIV) term)*
     * term : factor ((MUL | DIV) factor) *
     * factor : INTEGER | LPAREN expr RPAREN
     *
     */
    expr() {
        let result = this.term();
        while([TokenType.PLUS, TokenType.MINUS].includes(this.current_token.type)) {
            let token = this.current_token;
            if (token.type === TokenType.PLUS) {
                this.eat(TokenType.PLUS)
                result = result + this.term();
            } else if (token.type === TokenType.MINUS) {
                this.eat(TokenType.MINUS);
                result  = result - this.term();
            }
        }
        return result;
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
    let interpreter = new Interpreter(lexer);
        console.log(interpreter.expr())
        rl.close();
    });
}

if (require.main === module) {
    main();
}

