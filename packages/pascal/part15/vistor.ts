import { AST } from './parser'

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