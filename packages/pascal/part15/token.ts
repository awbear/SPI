import { enumKeys } from "../../helper";

export enum TokenType {
  // single-character token types
  PLUS          = '+',
  MINUS         = '-',
  MUL           = '*',
  FLOAT_DIV     = '/',
  LPAREN        = '(',
  RPAREN        = ')',
  SEMI          = ';',
  DOT           = '.',
  COLON         = ':',
  COMMA         = ',',

  // block of reserved words
  BEGIN = 'BEGIN',
  PROGRAM       = 'PROGRAM',
  INTEGER       = 'INTEGER', 
  REAL          = 'REAL',
  INTEGER_DIV   = 'DIV',
  VAR = 'VAR',
  PROCEDURE = 'PROCEDURE',
  END = 'END',

  // misc
  ID = 'ID',
  INTEGER_CONST = 'INTEGER_CONST',
  REAL_CONST = 'REAL_CONST',
  ASSIGN = ':=',
  EOF = 'EOF',
}


export class Token {
  type: TokenType;
  value: string | number | null;
  lineno: number;
  column: number;
  constructor(type: TokenType, value: string | number | null, lineno: number = null, column: number = null) {
    this.type = type;
    this.value = value;
    this.lineno = lineno;
    this.column = column;
  }

  toString() {
    return `Token(${this.type}, ${this.value}, position=${this.lineno}:${this.column})`
  }

  repr() {
    return this.toString()
  }
}

function build_reserved_keywords() {
  const keys = enumKeys(TokenType);
  const start_index = keys.indexOf(TokenType.BEGIN);
  const end_index = keys.indexOf(TokenType.END);
  const reserved_keywords: {
    [index: string]: Token
  } = {}
  keys.slice(start_index, end_index + 1).forEach((k) => {
    // @ts-ignore
    reserved_keywords[k] = new Token(TokenType[k], TokenType[k])
  })
  return reserved_keywords;
}

export const RESERVED_KEYWORDS = build_reserved_keywords();