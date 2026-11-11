import { Children, type ReactNode } from 'react';
import { Link, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { linkTarget } from './types';

// Pieces the templates share: a section that keeps its heading with its first
// entry, a two-row entry with bullets, and a contact line with links.

/** A heading and what's under it. The heading stays on the same page as the first thing in the section. */
export function Section({ heading, style, children }: { heading: ReactNode; style?: Style; children: ReactNode }) {
  const [first, ...rest] = Children.toArray(children);
  return (
    <View style={style}>
      <View wrap={false}>
        {heading}
        {first}
      </View>
      {rest}
    </View>
  );
}

export type EntryStyles = {
  entry: Style;
  lastEntry: Style;
  row: Style;
  left: Style;
  right: Style;
  leftBold: Style;
  rightBold: Style;
  secondRow: Style;
  note: Style;
  bullets: Style;
  bullet: Style;
  dot: Style;
  bulletText: Style;
};

/** The layout jobs, schools, and extra sections share: two rows of left and right text, then bullets. */
export function Entry({
  styles,
  title,
  aside,
  asideBold = true,
  subtitle,
  subAside,
  note,
  bullets = [],
  last,
  marker = '·',
}: {
  styles: EntryStyles;
  title: string;
  aside?: string;
  asideBold?: boolean;
  subtitle?: string;
  subAside?: string;
  note?: string;
  bullets?: string[];
  last: boolean;
  /** What goes before each bullet. */
  marker?: string;
}) {
  const firstRow = title || aside;
  const secondRow = subtitle || subAside;
  return (
    <View style={last ? styles.lastEntry : styles.entry}>
      <View wrap={false}>
        {firstRow ? (
          <View style={styles.row}>
            <Text style={styles.leftBold}>{title}</Text>
            <Text style={asideBold ? styles.rightBold : styles.right}>{aside}</Text>
          </View>
        ) : null}
        {secondRow ? (
          <View style={firstRow ? [styles.row, styles.secondRow] : styles.row}>
            <Text style={styles.left}>{subtitle}</Text>
            <Text style={styles.right}>{subAside}</Text>
          </View>
        ) : null}
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
      {bullets.length > 0 && (
        <View style={styles.bullets}>
          {bullets.map((bullet, index) => (
            <View key={index} style={styles.bullet} wrap={false}>
              <Text style={styles.dot}>{marker}</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/** Contact details on one line, with the ones that are addresses made clickable. */
export function ContactLine({ parts, separator, style, linkStyle }: { parts: string[]; separator: string; style: Style; linkStyle: Style }) {
  if (parts.length === 0) return null;
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        const target = linkTarget(part);
        return (
          <Text key={index}>
            {index > 0 ? separator : ''}
            {target ? (
              <Link src={target} style={linkStyle}>
                {part}
              </Link>
            ) : (
              part
            )}
          </Text>
        );
      })}
    </Text>
  );
}
