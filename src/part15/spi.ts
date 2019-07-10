import * as fs from 'fs';

import { Token, TokenType } from './token';
import { Lexer } from './lexer';
import { ScopedSymbolTable, VarSymbol, ProcedureSymbol } from './symbol';

class NameError extends Error {
    constructor(msg='') {
        super('variable error: ' + msg);
        this.name = this.constructor.name;
    }
}




//###############################################################################
//#                                                                             #
//#  INTERPRETER                                                                #
//#                                                                             #
//###############################################################################
//
//
type visitor_func = (node: AST) => any;

export class NodeVisitor {
    constructor() {}
    visit(node: AST) {
        const method_name = `visit_${node.constructor.name}`;
        // @ts-ignore
        const visitor = (this[method_name] as visitor_func) || this.generic_visit;
        return visitor.call(this, node)
    }
    generic_visit(node: AST) {
        throw new Error(`No visit_${node.constructor.name} method`);
    }
}

export class Interpreter extends NodeVisitor {
    tree: any;

    GLOBAL_SCOPE: {
        [index: string]: Token['value']
    } = {}
    constructor(tree: any) {
        super();
        this.tree = tree;
    }

    visit_Program(node: Program) {
        this.visit(node.block);
    }

    visit_Block(node: Block) {
        node.declarations.forEach((item) => {
            this.visit(item);
        })
        this.visit(node.compound_statement);
    }

    visit_VarDecl(node: VarDecl) {}

    visit_ProcedureDecl(node: ProcedureDecl) {}

    visit_Type(node: Type) {}

    visit_Compound(node: Compound) {
        node.child.forEach((child) => {
            this.visit(child);
        })
    }

    visit_NoOp(node: NoOp) {}

    visit_Assign(node: Assign) {
        this.GLOBAL_SCOPE[node.left.value] = this.visit(node.right)
    }

    visit_Var(node: Var) {
        const var_name = node.value;
        const value = this.GLOBAL_SCOPE[var_name] || undefined;
        if (value === undefined) {
            throw new NameError(var_name.toString());
        }
        return value;
    }

    visit_BinOp(node: BinOp) {
        const t = node.op.type;
        if (t === TokenType.PLUS) {
            return this.visit(node.left) + this.visit(node.right);
        } else if (t === TokenType.MINUS) {
            return this.visit(node.left) - this.visit(node.right);
        } else if (t === TokenType.MUL) {
            return this.visit(node.left) * this.visit(node.right);
        } else if (t === TokenType.FLOAT_DIV) {
            return this.visit(node.left) / this.visit(node.right);
        } else if (t === TokenType.INTEGER_DIV) {
            return Number.parseInt((this.visit(node.left) / this.visit(node.right)).toFixed(0), 10);
        }
    }

    visit_UnaryOp(node: UnaryOp) {
        const t = node.op.type;
        if (t === TokenType.PLUS) {
            return +this.visit(node.expr)
        } else if (t === TokenType.MINUS) {
            return -this.visit(node.expr);
        }
    }

    visit_Num(node: Num) {
        return node.value;
    }

    interpret() {
        const tree = this.tree;
        if (!tree) {
            return ''
        }
        return this.visit(tree)
    }
}

export class SymbolTableBuilder extends NodeVisitor {
    symtab: ScopedSymbolTable;
    constructor() {
        super();
        this.symtab = new ScopedSymbolTable('global', 1);
    }

    visit_Block(node: Block) {
        node.declarations.forEach((decl) => {
            this.visit(decl);
        })
        this.visit(node.compound_statement)
    }

    visit_Program(node: Program) {
        this.visit(node.block);
    }

    visit_BinOp(node: BinOp) {
        this.visit(node.left);
        this.visit(node.right);
    }

    visit_Num(node: Num) {}

    visit_UnaryOp(node: UnaryOp) {
        this.visit(node.expr);
    }

    visit_Compound(node: Compound) {
        node.child.forEach((child) => {
            this.visit(child);
        })
    }

    visit_VarDecl(node: VarDecl) {
        const type_name = node.type_node.value;
        const type_symbol = this.symtab.lookup(type_name.toString())
        const var_name = node.var_node.value;
        const var_symbol = new VarSymbol(var_name.toString(), type_symbol)
        this.symtab.define(var_symbol);
    }

    visit_ProcedureDecl(node: ProcedureDecl) {}

    visit_Assign(node: Assign) {
        const var_name = node.left.value;
        const var_symbol = this.symtab.lookup(var_name.toString());
        if (!var_symbol) {
            throw new NameError(var_name.toString())
        }
        this.visit(node.right)
    }

    visit_Var(node: Var) {
        const var_name = node.value;
        const var_symbol = this.symtab.lookup(var_name.toString());
        if (!var_symbol) {
            throw new NameError(var_name.toString());
        }
    }

    visit_NoOp(node: NoOp) {}
}

export class SemanticAnalyzer extends NodeVisitor {
    current_scope: ScopedSymbolTable | null;
    constructor() {
        super();
        this.current_scope = null;
    }

    visit_Block(node: Block) {
        node.declarations.forEach((decl) => {
            this.visit(decl);
        })
        this.visit(node.compound_statement)
    }

    visit_UnaryOp(node: UnaryOp) {
        this.visit(node.expr);
    }

    visit_Program(node: Program) {
        console.log('Enter scope: global')
        const enclosing_scope = this.current_scope ? this.current_scope.enclosing_scope : null;
        const global_scope = new ScopedSymbolTable('global', 1, enclosing_scope)
        this.current_scope = global_scope;
        this.visit(node.block);

        console.log(global_scope)
        this.current_scope = this.current_scope.enclosing_scope;
        console.log('Leave scope: global');
    }

    visit_Compound(node: Compound) {
        node.child.forEach((child) => {
            this.visit(child);
        })
    }

    visit_Num() {}

    visit_NoOp(node: NoOp) {}

    visit_VarDecl(node: VarDecl) {
        const type_name = node.type_node.value
        const type_symbol = this.current_scope.lookup(type_name.toString())

        const var_name = node.var_node.value.toString();
        const var_symbol = new VarSymbol(var_name, type_symbol)

        if (this.current_scope.lookup(var_name, true)) {
            throw new Error(`Duplicate identifier ${var_name} found`)
        }

        this.current_scope.insert(var_symbol);
    }

    visit_Var(node: Var) {
        const var_name = node.value.toString();
        const var_symbol = this.current_scope.lookup(var_name);
        if (!var_symbol) {
            throw new NameError(var_name);
        }
    }

    visit_ProcedureDecl(node: ProcedureDecl) {
        const proc_name = node.proc_name;
        const proc_symbol = new ProcedureSymbol(proc_name)
        this.current_scope.insert(proc_symbol)
        console.log(`Enter scope: ${proc_name}`);
        // Scope for parameters and local variables
        const procedure_scope = new ScopedSymbolTable(proc_name, this.current_scope.scope_level + 1, this.current_scope);
        this.current_scope = procedure_scope;
        // Insert parameters into the procedure scope
        node.params.forEach((param) => {
            const param_type = this.current_scope.lookup(param.type_node.value.toString())
            const param_name = param.var_node.value.toString();
            const var_symbol = new VarSymbol(param_name, param_type);
            this.current_scope.insert(var_symbol);
            proc_symbol.params.push(var_symbol);
        })
        this.visit(node.block_node);
        console.log(procedure_scope)
        this.current_scope = this.current_scope.enclosing_scope;
        console.log('Leave scope: ', proc_name);
    }

    visit_Assign(node: Assign) {
        const var_name = node.left.value;
        const var_symbol = this.current_scope.lookup(var_name.toString());
        if (!var_symbol) {
            throw new NameError(var_name.toString())
        }
        this.visit(node.right)
    }

    visit_BinOp(node: BinOp) {
        this.visit(node.left);
        this.visit(node.right);
    }
}

function main() {
    fs.readFile(process.argv[2], 'utf8', (err, text) => {
        if (err) {
            console.log(err)
            process.exit(-1)
        }
        let lexer = new Lexer(text);
        let parser = new Parser(lexer);
        const tree = parser.parse();
        const semantic_analyzer = new SemanticAnalyzer()
        semantic_analyzer.visit(tree)
        console.log('symbol table contents: \n%s', semantic_analyzer.current_scope)
        let interpreter = new Interpreter(tree);
        interpreter.interpret()
        console.log('Runtime result: \n', interpreter.GLOBAL_SCOPE)
    })
}

if (require.main === module) {
    main();
}

