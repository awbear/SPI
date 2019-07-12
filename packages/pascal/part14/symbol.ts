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

export class ProcedureSymbol extends BaseSymbol {
  params: Array<BaseSymbol>
  constructor(name: string, params:Array<BaseSymbol> = null) {
    super(name, null);
    this.params = params || [];
  } 
  toString() {
    return `<${this.constructor.name}(name=${this.name}, parameters=${this.params})>`
  }
}

export class ScopedSymbolTable {
  _symbol: {
    [index: string]: BaseSymbol;
  }
  scope_name: string;
  scope_level: number;
  enclosing_scope: ScopedSymbolTable | null;

  constructor(scope_name: string, scope_level: number, enclosing_scope: ScopedSymbolTable | null = null) {
    this._symbol = {}
    this.scope_name = scope_name;
    this.scope_level = scope_level;
    this.enclosing_scope = enclosing_scope;
    this._init_builtins();
  }

  _init_builtins() {
    this.define(new BuiltinTypeSymbol(TokenType.INTEGER))
    this.define(new BuiltinTypeSymbol(TokenType.REAL))
  }

  toString() {
    const h1 = 'SCOPE (SCOPED SYMBOL TABLE)';
    const lines = ['\n', h1, '='.repeat(h1.length)]
    lines.push(`Scope name: ${this.scope_name}`);
    lines.push(`Scope level: ${this.scope_level}`);
    lines.push(`Enclosing scope: ${this.enclosing_scope ? this.enclosing_scope.scope_name : ''}`)
    const h2 = 'Symbol table contents';
    lines.push(h2)
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

  lookup(name: string, current_scope_only = false): BaseSymbol {
    console.log('lookup: %s', name);
    const symbol = this._symbol[name];
    if (symbol) {
      return symbol;
    }
    if (current_scope_only) {
      return null;
    }
    if (this.enclosing_scope) {
      return this.enclosing_scope.lookup(name);
    }
  }
}