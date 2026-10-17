/**
 * Lightweight MIME and multipart body parser for RFC 2822 / Gmail / Graph message payloads.
 */

export interface ParsedMimeContent {
  bodyPlain: string;
  bodyHtml: string;
  attachments: Array<{
    id: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
    dataBase64?: string;
  }>;
}

export function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

/**
 * Recursively parse Gmail Message Part structures into canonical body and attachments
 */
export function parseGmailParts(payload: any): ParsedMimeContent {
  let bodyPlain = '';
  let bodyHtml = '';
  const attachments: ParsedMimeContent['attachments'] = [];

  function traverse(part: any) {
    if (!part) return;

    const mimeType = part.mimeType || '';
    const body = part.body || {};

    if (part.filename && part.filename.length > 0) {
      attachments.push({
        id: body.attachmentId || part.partId || 'att-unknown',
        filename: part.filename,
        contentType: mimeType,
        sizeBytes: body.size || 0,
        dataBase64: body.data,
      });
      return;
    }

    if (mimeType === 'text/plain' && body.data) {
      bodyPlain += decodeBase64Url(body.data);
    } else if (mimeType === 'text/html' && body.data) {
      bodyHtml += decodeBase64Url(body.data);
    }

    if (part.parts && Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        traverse(subPart);
      }
    }
  }

  traverse(payload);

  return {
    bodyPlain,
    bodyHtml: bodyHtml || bodyPlain,
    attachments,
  };
}

/**
 * Parse recipient headers like "Alex Morgan <alex@example.com>, Taylor <taylor@example.com>"
 */
export function parseAddressList(headerValue?: string): Array<{ name: string; email: string }> {
  if (!headerValue) return [];

  const recipients: Array<{ name: string; email: string }> = [];
  const entries = headerValue.split(/,\s*(?=[^<]*<|[^,]+$)/);

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^(?:"?([^"]*)"?\s)?(?:<([^>]+)>|([^\s@]+@[^\s@]+))$/);
    if (match) {
      const name = (match[1] || '').trim();
      const email = (match[2] || match[3] || '').trim().toLowerCase();
      recipients.push({
        name: name || email.split('@')[0],
        email,
      });
    } else {
      recipients.push({ name: trimmed, email: trimmed.toLowerCase() });
    }
  }

  return recipients;
}
