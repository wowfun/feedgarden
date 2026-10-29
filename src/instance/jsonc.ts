import { applyEdits, findNodeAtLocation, modify, parse, parseTree } from 'jsonc-parser';

/** Update values without replacing unchanged objects or their comments. */
export function editJsonc(input: string, path: (string | number)[], desired: unknown): string {
  const current = (parts: (string | number)[]) =>
    parts.reduce<any>((value, key) => value?.[key], parse(input));
  const write = (parts: (string | number)[], value: unknown, insert = false) => {
    input = applyEdits(
      input,
      modify(input, parts, value, {
        isArrayInsertion: insert,
        formattingOptions: { insertSpaces: true, tabSize: 2 },
      }),
    );
  };
  const visit = (parts: (string | number)[], next: any): void => {
    const before = current(parts);
    if (JSON.stringify(before) === JSON.stringify(next)) return;
    if (Array.isArray(before) && Array.isArray(next)) {
      const keyed = [...before, ...next].every(
        (value) => value && typeof value === 'object' && typeof value.id === 'string',
      );
      if (keyed) {
        for (let i = before.length - 1; i >= 0; i--)
          if (!next.some((value) => value.id === before[i].id)) write([...parts, i], undefined);
        next.forEach((value, index) => {
          const list = current(parts);
          if (list[index]?.id !== value.id) write([...parts, index], value, true);
          else visit([...parts, index], value);
        });
        while (current(parts).length > next.length) write([...parts, next.length], undefined);
      } else {
        for (let i = before.length - 1; i >= next.length; i--) write([...parts, i], undefined);
        next.forEach((value, index) => visit([...parts, index], value));
      }
    } else if (
      before &&
      next &&
      typeof before === 'object' &&
      typeof next === 'object' &&
      !Array.isArray(before) &&
      !Array.isArray(next)
    ) {
      for (const key of Object.keys(before)) if (!(key in next)) write([...parts, key], undefined);
      for (const [key, value] of Object.entries(next)) visit([...parts, key], value);
    } else write(parts, next);
  };
  visit(path, desired);
  return input;
}

export function renameJsoncProperty(input: string, path: (string | number)[], name: string): string {
  const tree = parseTree(input),
    node = tree && findNodeAtLocation(tree, path),
    key = node?.parent?.children?.[0];
  return key
    ? input.slice(0, key.offset) + JSON.stringify(name) + input.slice(key.offset + key.length)
    : input;
}
