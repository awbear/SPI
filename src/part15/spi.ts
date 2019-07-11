import * as fs from 'fs';

import { Token, TokenType } from './token';
import { Lexer } from './lexer';
import {
  BinOp, Block, Program, UnaryOp, Compound, NoOp, VarDecl, Var,
  ProcedureDecl, Assign, Type, Num,
  Parser,
} from './parser';
import { ScopedSymbolTable, VarSymbol } from './symbol';
import { NodeVisitor } from './vistor';
import { NameError } from './error'
import { SemanticAnalyzer } from './checker';


//###############################################################################
//#                                                                             #
//#  INTERPRETER                                                                #
//#                                                                             #
//###############################################################################
//
//

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

