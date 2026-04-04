const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

export function resolveVariables(
  input: string,
  variables: Record<string, string>
): string {
  return input.replace(VARIABLE_PATTERN, (match, key: string) => {
    const trimmedKey = key.trim();
    return trimmedKey in variables ? variables[trimmedKey] : match;
  });
}

export function findVariables(input: string): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(VARIABLE_PATTERN);
  while ((match = pattern.exec(input)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

export function hasVariables(input: string): boolean {
  return VARIABLE_PATTERN.test(input);
}
