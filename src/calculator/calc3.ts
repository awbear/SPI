import { isdigit, isSpace } from '../helper';
import * as readline from 'readline';

enum TokenType {
    INTEGER = 'INTEGER',
    PLUS = 'PLUS',
    EOF = 'EOF',
    MINUS = 'MINUS',
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

export class Interpreter {
    text: string;
    pos: number;
    current_token: Token | null;
    current_char: string;

    constructor(text: string) {
        // input: 3 + 5
        this.text = text;
        // index this.type
        this.pos = 0;
        // token instance
        this.current_token = null;
        this.current_char = this.text[this.pos];
    }
    
    //##########################################################
    //# Lexer code                                             #
    //##########################################################
    error(msg='') {
        throw new Error(`Error parsing input: ${msg}`)
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
            this.error(this.current_char);
        }
        return new Token(TokenType.EOF, null)
    }

    //##########################################################
    //# Parser / Interpreter code                              #
    //##########################################################

    eat(token_type: TokenType) {
        if (this.current_token.type === token_type) {
            this.current_token = this.get_next_token()
        } else {
            this.error(`${this.current_token.repr()}: ${token_type}`)
        }
    }

    term() {
        let token = this.current_token;
        this.eat(TokenType.INTEGER)
        return token.value as number;
    }

    expr() {
        this.current_token = this.get_next_token();
        let result = this.term();
        while([TokenType.PLUS, TokenType.MINUS].includes(this.current_token.type)) {
            let token = this.current_token;
            if (token.type === TokenType.PLUS) {
                this.eat(TokenType.PLUS)
                result = result + this.term();
            } else if (token.type === TokenType.MINUS) {
                this.eat(TokenType.MINUS);
                result  = result - this.term()
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
    let interpreter = new Interpreter(text)
        console.log(interpreter.expr())
        rl.close();
    });
}

if (require.main === module) {
    main();
}

