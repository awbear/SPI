import { isdigit } from '../helper';
import * as readline from 'readline';

enum TokenType {
    INTEGER = 'INTEGER',
    PLUS = 'PLUS',
    EOF = 'EOF',
}

export class Token {
    type: TokenType;
    value: string | null;
    constructor(type: TokenType, value: string | null) {
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

    constructor(text: string) {
        // input: 3 + 5
        this.text = text;
        this.pos = 0;
        this.current_token = null;
    }

    error() {
        throw new Error('Error parsing input')
    }

    get_next_token() {
        let text = this.text;
        // reach the EOF
        if (this.pos > text.length - 1) {
            return new Token(TokenType.EOF, null)
        }
        let current_char = text[this.pos];
        if (isdigit(current_char)) {
            let token = new Token(TokenType.INTEGER, current_char)
            this.pos += 1;
            return token;
        }
        if (current_char === '+') {
            let token = new Token(TokenType.PLUS, current_char);
            this.pos += 1;
            return token
        }
        this.error();
    }

    eat(token_type: TokenType) {
        if (this.current_token.type === token_type) {
            this.current_token = this.get_next_token()
        } else {
            this.error()
        }
    }

    expr() {
        this.current_token = this.get_next_token()
        let left = this.current_token;
        this.eat(TokenType.INTEGER)

        let op = this.current_token;
        this.eat(TokenType.PLUS)

        let right = this.current_token
        this.eat(TokenType.INTEGER)

        return Number(left.value) + Number(right.value);
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
    text = text.replace(/\s/g, '')
    let interpreter = new Interpreter(text)
        console.log(interpreter.expr())
        rl.close();
    });
}

if (require.main === module) {
    main();
}

