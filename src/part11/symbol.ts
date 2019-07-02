export class BaseSymbol {
  name: string;
  type: string | null;
  constructor(name: string, type: string | null = null) {
    this.name = name;
    this.type = type;
  }
}

export class BuiltInTypeSymbol extends BaseSymbol {
  constructor(name: string) {
    super(name);
  }
  str() {
    return this.name;
  }
  repr = this.str;
}

export class VarSymbol extends BaseSymbol {
  constructor(name: string, type: string) {
    super(name, type);
  }
  str() {
    return `<${this.name}:${this.type}>`;
  }
  repr = this.str;
}

export class SymbolTable {
  _symbol: {
    [index: string]: BaseSymbol;
  }
  constructor() {
    this._symbol = {}
  }
  str() {
    return `Symbols: ${Object.values(this._symbol)}`
  }
  repr = this.str;

  define(symbol: BaseSymbol) {
    console.log('define: ', symbol)
    this._symbol[symbol.name] = symbol;
  }

  lookup(name: string) {
    return this._symbol[name]
  }
}