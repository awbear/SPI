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
  PROGRAM = 'PROGRAM',
  VAR = 'VAR',
  COLON = 'COLON',
  COMMA = 'COMMA',
  REAL = 'REAL',
  INTEGER_CONST = 'INTEGER_CONST',
  REAL_CONST = 'REAL_CONST',
  INTEGER_DIV = 'INTEGER_DIV',
  FLOAT_DIV = 'FLOAT_DIV',
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
        return this.toString()
    }
}