import { TokenType } from "./token";

export class BaseSymbol {
  name: string;
  type: BaseSymbol | null;
  constructor(name: string, type: BaseSymbol | null = null) {
    this.name = name;
    this.type = type;
  }
}

export class BuiltinTypeSymbol extends BaseSymbol {
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
    return `<${this.constructor.name}(name=${this.name}, type=${this.type.toString()})>`;
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
    this.define(new BuiltinTypeSymbol(TokenType.INTEGER))
    this.define(new BuiltinTypeSymbol(TokenType.REAL))
  }

  toString() {
    const symtab_header = 'Symbol table contents';
    const lines = ['\n', symtab_header, '_'.repeat(symtab_header.length)]
    for (const [key, value] of Object.entries(this._symbol)) {
      lines.push(`${key}: ${value}`)
    }
    lines.push('\n');
    return lines.join('\n');
  }

  define(symbol: BaseSymbol) {
    console.log('define: %s', symbol)
    this._symbol[symbol.name] = symbol;
  }

  insert(symbol: BaseSymbol) {
    console.log('Insert: %s', symbol.name);
    this._symbol[symbol.name] = symbol;
  }

  lookup(name: string) {
    console.log('lookup: %s', name)
    return this._symbol[name]
  }
}