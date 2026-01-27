export const extractJSON = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

export const fetchPdfBase64 = async (url: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve((r.result as string).split(",")[1] || "");
    r.readAsDataURL(blob);
  });
};
