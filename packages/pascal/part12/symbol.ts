import { TokenType } from "./token";

export class BaseSymbol {
  name: string;
  type: BaseSymbol | null;
  constructor(name: string, type: BaseSymbol | null = null) {
    this.name = name;
    this.type = type;
  }
}

export class BuiltInTypeSymbol extends BaseSymbol {
  constructor(name: string) {
    super(name);
  }
  toString() {
    return this.name;
  }
}

export class VarSymbol extends BaseSymbol {
  constructor(name: string, type: BaseSymbol) {
    super(name, type);
  }
  toString() {
    return `<${this.name}:${this.type.toString()}>`;
  }
}

export class SymbolTable {
  _symbol: {
    [index: string]: BaseSymbol;
  }
  constructor() {
    this._symbol = {}
    this._init_builtins();
  }

  _init_builtins() {
    this.define(new BuiltInTypeSymbol(TokenType.INTEGER))
    this.define(new BuiltInTypeSymbol(TokenType.REAL))
  }

  toString() {
    return `Symbols: [${Object.values(this._symbol)}]`
  }

  define(symbol: BaseSymbol) {
    console.log('define: %s', symbol)
    this._symbol[symbol.name] = symbol;
  }

  lookup(name: string) {
    console.log('lookup: %s', name)
    return this._symbol[name]
  }
}