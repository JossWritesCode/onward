import { afterEach, describe, expect, it, vi } from 'vitest';
import { canCopyImage, smsHref } from './share';

describe('smsHref', () => {
  it('fills in the message text', () => {
    expect(smsHref('Hello')).toBe('sms:?&body=Hello');
  });

  it('encodes newlines, ampersands and emoji so the text arrives whole', () => {
    const href = smsHref('My week\n3 apps & 2 chats 🎉');
    expect(href.startsWith('sms:?&body=')).toBe(true);
    expect(href).not.toContain('\n');
    expect(href).not.toContain(' & ');
    expect(decodeURIComponent(href.slice('sms:?&body='.length))).toBe('My week\n3 apps & 2 chats 🎉');
  });
});

describe('canCopyImage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is true when the clipboard can take images', () => {
    vi.stubGlobal('navigator', { clipboard: { write: () => Promise.resolve() } });
    vi.stubGlobal('ClipboardItem', class {});
    expect(canCopyImage()).toBe(true);
  });

  it('is false without ClipboardItem', () => {
    vi.stubGlobal('navigator', { clipboard: { write: () => Promise.resolve() } });
    vi.stubGlobal('ClipboardItem', undefined);
    expect(canCopyImage()).toBe(false);
  });

  it('is false without a clipboard', () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('ClipboardItem', class {});
    expect(canCopyImage()).toBe(false);
  });
});
