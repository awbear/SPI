import {
  BinOp, Block, Program, UnaryOp, Compound, NoOp, VarDecl, Var,
  ProcedureDecl, Assign, 
} from './parser';
import { ScopedSymbolTable, ProcedureSymbol, VarSymbol } from './symbol';
import { NodeVisitor  } from './vistor';
import { NameError, ErrorCode, SemanticError } from './error';
import { Token } from './token';

export class SemanticAnalyzer extends NodeVisitor {
    current_scope: ScopedSymbolTable | null;
    constructor() {
      super();
      this.current_scope = null;
    }

    error(error_code: ErrorCode, token: Token) {
      throw new SemanticError(`${error_code} -> ${token}`, error_code, token)
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
        this.error(ErrorCode.DUPLICATE_ID, node.var_node.token)
      }

      this.current_scope.insert(var_symbol);
    }

    visit_Var(node: Var) {
        const var_name = node.value.toString();
        const var_symbol = this.current_scope.lookup(var_name);
        if (!var_symbol) {
          this.error(ErrorCode.ID_NOT_FOUND, node.token);
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