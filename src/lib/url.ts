export const extractUrls = (text: string): readonly string[] => {
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s)"']*/g;
  return [...(text.match(urlRegex) ?? [])];
};
