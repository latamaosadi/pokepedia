export const titleCase = (text: string) =>
  text
    .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
    .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase())

export const padNumber = (n: string | number, length = 4) =>
  String(n).padStart(length, '0')
