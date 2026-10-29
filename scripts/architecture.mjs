import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(readFileSync(join(root, 'src/modules.json'), 'utf8'));
const slash = value => value.replaceAll('\\', '/');
const moduleOf = file => slash(file).split('/')[1];

export function checkDependency(from, to, rules = policy) {
  const owner = moduleOf(from), dependency = moduleOf(to);
  if (owner === dependency) return;
  if (rules.bootstraps[from]?.includes(to)) return;
  const module = rules.modules[owner];
  if (!module?.dependencies.includes(dependency))
    return `${from}: forbidden dependency on ${to}`;
  if (!rules.modules[dependency].public.includes(to.slice(`src/${dependency}/`.length)))
    return `${from}: import the public ${dependency} API instead of ${to}`;
}

export function cycles(graph) {
  const completed = new Set(), active = new Set(), stack = [], found = [];
  function visit(node) {
    if (active.has(node)) {
      found.push([...stack.slice(stack.indexOf(node)), node]);
      return;
    }
    if (completed.has(node)) return;
    active.add(node); stack.push(node);
    for (const child of graph.get(node) ?? []) visit(child);
    stack.pop(); active.delete(node); completed.add(node);
  }
  for (const node of graph.keys()) visit(node);
  return found;
}

function selfTest() {
  assert.match(checkDependency('src/sources/query.ts', 'src/content/index.ts'), /forbidden/);
  assert.match(checkDependency('src/app/cli.ts', 'src/storage/database.ts'), /public storage/);
  assert.equal(checkDependency('src/content/collect.ts', 'src/sources/index.ts'), undefined);
  assert.equal(checkDependency('src/worker.ts', 'src/storage/worker.ts'), undefined);
  assert.equal(cycles(new Map([['a', ['b']], ['b', ['a']]])).length, 1);
  assert.equal(cycles(new Map([['a', ['b']], ['b', []]])).length, 0);
}

function main() {
  selfTest();
  const files = readdirSync(join(root, 'src'), { recursive: true })
    .map(file => `src/${slash(file)}`).filter(file => /\.(?:ts|mjs)$/.test(file));
  const graph = new Map(files.map(file => [file, new Set()])), problems = [];
  let edges = 0;
  for (const file of files) {
    const source = readFileSync(join(root, file), 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    function dependency(spec, runtime) {
      if (spec === 'node:sqlite' && moduleOf(file) !== 'storage')
        problems.push(`${file}: SQLite is owned by storage`);
      if (!spec.startsWith('.')) return;
      const target = slash(relative(root, resolve(root, dirname(file), spec))).replace(/\.js$/, '.ts');
      if (!existsSync(join(root, target))) {
        problems.push(`${file}: unresolved module ${spec}`); return;
      }
      if (!target.startsWith('src/')) return;
      const error = checkDependency(file, target);
      if (error) problems.push(error);
      if (runtime) graph.get(file).add(target);
      edges++;
    }
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const clause = node.importClause;
        const typeOnly = node.isTypeOnly || clause?.isTypeOnly ||
          clause?.namedBindings && ts.isNamedImports(clause.namedBindings) &&
          !clause.name && clause.namedBindings.elements.every(spec => spec.isTypeOnly);
        dependency(node.moduleSpecifier.text, !typeOnly);
        if (ts.isExportDeclaration(node) && !node.exportClause)
          problems.push(`${file}: public exports must be named`);
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0]))
        dependency(node.arguments[0].text, true);
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal))
        dependency(node.argument.literal.text, false);
      if (moduleOf(file) !== 'storage' && ts.isPropertyAccessExpression(node) && ['db', 'statement'].includes(node.name.text))
        problems.push(`${file}: raw database access is private to storage`);
      if (ts.isNewExpression(node) && node.expression.getText(ast) === 'URL' && node.arguments?.length === 2 &&
          ts.isStringLiteral(node.arguments[0]) && node.arguments[1].getText(ast) === 'import.meta.url') {
        const spec = node.arguments[0].text;
        if (spec.startsWith('.') && !existsSync(resolve(root, dirname(file), spec)))
          problems.push(`${file}: missing runtime resource ${spec}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  for (const cycle of cycles(graph)) problems.push(`Runtime cycle: ${cycle.join(' -> ')}`);
  // The detached worker must acknowledge its owner before importing the application graph.
  const cold = new Set(), pending = ['src/storage/worker.ts'];
  while (pending.length) {
    const file = pending.pop(); if (cold.has(file)) continue; cold.add(file);
    for (const target of graph.get(file) ?? []) pending.push(target);
  }
  for (const file of cold) if (!policy.workerClosure.includes(file)) problems.push(`Heavy worker handshake dependency: ${file}`);
  const top = files.filter(file => file.split('/').length === 2);
  if (top.some(file => !policy.bootstraps[file])) problems.push('src root may contain only executable bootstraps');
  if (problems.length) throw new Error([...new Set(problems)].join('\n'));
  console.log(`Architecture passed: ${files.length} source files, ${edges} dependencies, no runtime cycles; worker handshake ${cold.size} files.`);
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
