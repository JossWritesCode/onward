// Small helpers for sharing the weekly recap: saving the image, copying it,
// and starting a text message.

/**
 * A link that opens the messages app with the text filled in. The "?&" form
 * works on both iPhone and Android, and a Mac opens it in Messages. A link
 * like this can only carry text, never an image.
 */
export function smsHref(text: string) {
  return `sms:?&body=${encodeURIComponent(text)}`;
}

/** True when the browser can put an image on the clipboard. */
export function canCopyImage() {
  return typeof navigator !== 'undefined' && typeof navigator.clipboard?.write === 'function' && typeof ClipboardItem !== 'undefined';
}

/** Saves a file to the person's downloads folder. */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  // Give the browser a moment to start the download before letting go of the file.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
