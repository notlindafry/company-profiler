// Input validation and safe request-body reading for the API routes.

export const MAX_COMPANY_LEN = 200;
export const MAX_DETAIL_LEN = 300;
export const MAX_PASSWORD_LEN = 256;

// Max accepted request body. These endpoints take a couple of short strings, so
// anything beyond a few KB is abuse or a mistake.
export const MAX_BODY_BYTES = 8 * 1024;

// Drop a single character if it is an ASCII control char (0x00-0x1F or 0x7F).
function isControlChar(code: number): boolean {
  return code < 0x20 || code === 0x7f;
}

// Remove control characters (including newlines/tabs), collapse runs of
// whitespace, then clamp length. Stripping newlines also closes the simplest
// prompt-injection "break out of the quoted value" trick for free-text fields.
export function sanitizeInput(raw: string, maxLen: number): string {
  let out = "";
  for (const ch of raw) {
    out += isControlChar(ch.charCodeAt(0)) ? " " : ch;
  }
  return out.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

export type BodyResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; error: string };

// Reads and parses a JSON body while enforcing a hard size limit, so a huge
// payload can't be buffered into memory before parsing.
export async function readJsonBody(
  req: Request,
  maxBytes: number = MAX_BODY_BYTES
): Promise<BodyResult> {
  const declared = req.headers.get("content-length");
  if (declared && Number(declared) > maxBytes) {
    return { ok: false, status: 413, error: "Request too large." };
  }

  let text: string;
  try {
    text = await req.text();
  } catch {
    return { ok: false, status: 400, error: "Invalid request." };
  }

  // Byte length, not string length — multibyte chars count for more.
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return { ok: false, status: 413, error: "Request too large." };
  }

  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: "Invalid request." };
  }
}
