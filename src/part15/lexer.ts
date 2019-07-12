import { Token, TokenType, RESERVED_KEYWORDS } from './token'
import { LexerError } from './error'
import { isSpace, isalnum, isalpha, isdigit } from '../helper';


export class Lexer {
  text: string;
  pos: number;
  lineno: number;
  column: number;
  current_token: Token | null;
  current_char: string;

  RESERVED_KEYWORDS = RESERVED_KEYWORDS;

  constructor(text: string) {
    this.text = text;
    this.pos = 0;
    this.current_char = this.text[this.pos];

    // token line number and column number
    this.lineno = 1;
    this.column = 1;
  }

  error(msg='') {
    const s = `Lexer error on ${this.current_char} line: ${this.lineno} column: ${this.column}`;
    throw new LexerError(s);
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
    const token = this.RESERVED_KEYWORDS[result] || this.gen_token(TokenType.ID, result);
    return token;
  }

  advance() {
    if (this.current_char === '\n') {
      this.lineno += 1;
      this.column = 0;
    }
    
    this.pos += 1;
    if (this.pos > (this.text.length -1)) {
      // indicates end of input
      this.current_char = null;
    } else {
      this.current_char = this.text[this.pos];
      this.column += 1;
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
      return this.gen_token(TokenType.REAL_CONST, Number.parseFloat(result));
    }
    return this.gen_token(TokenType.INTEGER_CONST, Number.parseInt(result, 10));
  }

  gen_token(type: TokenType, value: Token['value']) {
    return new Token(type, value, this.lineno, this.column)
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
        return this.gen_token(TokenType.COMMA, TokenType.COMMA)
      }

      if (this.current_char === '+') {
        this.advance();
        return this.gen_token(TokenType.PLUS, TokenType.PLUS);
      }

      if (this.current_char === '-') {
        this.advance();
        return this.gen_token(TokenType.MINUS, TokenType.PLUS) 
      }

      if (this.current_char === '*') {
        this.advance();
        return this.gen_token(TokenType.MUL, TokenType.MUL);
      }

      if (this.current_char === '/') {
        this.advance();
        return this.gen_token(TokenType.FLOAT_DIV, TokenType.FLOAT_DIV)
      }

      if (this.current_char === '(') {
        this.advance();
        return this.gen_token(TokenType.LPAREN, TokenType.LPAREN);
      }

      if (this.current_char === ')') {
        this.advance();
        return this.gen_token(TokenType.RPAREN, TokenType.RPAREN);
      }

      if (isalpha(this.current_char)) {
        return this._id();
      }

      if (this.current_char === ':' && this.peek() === '=') {
        this.advance();
        this.advance();
        return this.gen_token(TokenType.ASSIGN, TokenType.ASSIGN)
      }

      if (this.current_char === ':') {
        this.advance()
        return this.gen_token(TokenType.COLON, TokenType.COLON);
      }

      if (this.current_char === ';') {
        this.advance();
        return this.gen_token(TokenType.SEMI, TokenType.SEMI);
      }

      if (this.current_char === '.') {
        this.advance();
        return this.gen_token(TokenType.DOT, TokenType.DOT);
      }

      this.error(this.current_char);
    }
    return this.gen_token(TokenType.EOF, null);
  }
}