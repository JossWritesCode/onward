import { useEffect, useRef, useState } from 'react';
import { Input, Textarea } from '../ui';

type Props = {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  /** 'line' is one item per line (bullets, links). 'comma' is items separated by commas (skills). */
  separator: 'line' | 'comma';
  rows?: number;
  placeholder?: string;
};

const parse = (text: string, separator: Props['separator']) =>
  separator === 'line' ? text.split('\n') : text.split(',').map((item) => item.trim());
const format = (items: string[], separator: Props['separator']) => items.join(separator === 'line' ? '\n' : ', ');

/**
 * A text box that edits a list. It keeps what you typed exactly as typed
 * (half-finished commas and blank lines included) and passes the list along.
 */
export default function ListInput({ id, value, onChange, separator, rows = 3, placeholder }: Props) {
  const [text, setText] = useState(() => format(value, separator));
  const lastSent = useRef(value);

  // Only replace the text when the list changed somewhere else, like after saving.
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setText(format(value, separator));
    }
  }, [value, separator]);

  function handleChange(next: string) {
    setText(next);
    const items = parse(next, separator);
    lastSent.current = items;
    onChange(items);
  }

  return separator === 'line' ? (
    <Textarea
      id={id}
      rows={rows}
      value={text}
      placeholder={placeholder}
      onChange={(event) => handleChange(event.target.value)}
      className="min-h-0!"
    />
  ) : (
    <Input id={id} value={text} placeholder={placeholder} onChange={(event) => handleChange(event.target.value)} />
  );
}
