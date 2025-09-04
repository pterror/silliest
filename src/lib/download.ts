import { parse as parseContentDisposition } from "content-disposition-header";

/** Initiate a download for the specified url. */
export function download(url: string, filename = url.replace(/^.+[/]/, "")) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Initiate a download for the specified url. */
export async function downloadExternalLinkWithoutContentDisposition(url: string, filename?: string) {
  const response = await fetch(url);
  const body = await response.blob();
  const filenameHeader = response.headers.get("filename");
  const disposition = filenameHeader
    ? parseContentDisposition(filenameHeader)
    : null;
  const file = new File(
    [body],
    filename ?? disposition?.parameters.filename ?? url.replace(/^.+[/]/, ""),
  );
  const objectUrl = URL.createObjectURL(file);
  download(objectUrl, file.name);
  URL.revokeObjectURL(objectUrl);
}
