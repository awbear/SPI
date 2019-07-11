import { Token } from './token';

export enum ErrorCode {
  UNEXPECTED_TOKEN = 'Unexpected token',
  ID_NOT_FOUND     = 'Identifier not found',
  DUPLICATE_ID     = 'Duplicate id found',
}

export class GenernalError extends Error {
  error_code: ErrorCode;
  token: Token;
  message: string;
  constructor(message = '', error_code: ErrorCode = null, token: Token = null) {
    super(message);
    this.error_code = error_code;
    this.token = token;
    this.message = `${this.constructor.name}: ${message}`;
  }
}

export class LexerError extends GenernalError {};

export class ParseError extends GenernalError {};

export class SemanticError extends GenernalError {};

export class NameError extends Error {
  constructor(msg='') {
    super('variable error: ' + msg);
    this.name = this.constructor.name;
  }
}