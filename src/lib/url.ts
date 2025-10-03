export const extractUrls = (text: string): readonly string[] => {
  const urlRegex =
    /https?:\/\/[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._~:/?#[\]@!$&'()*+,;=-]*/g;
  return [...(text.match(urlRegex) ?? [])];
};
