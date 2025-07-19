export const regexEscape = (string: string) =>
  string.replace(/[\\^$.|?*+()[{]/g, "\\$&");
