export function getFormattedUrlInfo(rawUrl: string) {
  let finalUrl = rawUrl.trim();
  let nameFallback = finalUrl;

  if (finalUrl.startsWith("@")) {
    finalUrl = `https://x.com/${finalUrl.substring(1)}`;
    nameFallback = rawUrl;
  } else {
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://") && finalUrl.length > 0) {
      finalUrl = "https://" + finalUrl;
    }
    nameFallback = finalUrl.replace(/^https?:\/\//, "").split("/")[0];
  }

  finalUrl = finalUrl.replace(/\/$/, "");
  return { finalUrl, nameFallback };
}
