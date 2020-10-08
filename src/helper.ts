export function assignIfNull(target: object, source: object) {
  Object.keys(source).forEach(key => target[key] = target[key] ?? source[key]);
}

export function firstUp(input: string) {
  return input.charAt(0).toUpperCase() +  input.substr(1);
}
