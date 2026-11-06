export type Quote = {
  text: string;
  author: string;
  source: string;
};

// Every quote here was checked against its original source. Ancient texts use
// public-domain translations: George Long (Marcus Aurelius, 1862; Epictetus,
// 1877), Richard M. Gummere (Seneca's letters, 1917–1925), Aubrey Stewart
// (Seneca's dialogues, 1889), and James Legge (Tao Te Ching, 1891).
//
// Before adding one, check the wording against the original. Many popular
// quotes are paraphrased or misattributed.
export const QUOTES: readonly Quote[] = [
  {
    text: 'In the morning when thou risest unwillingly, let this thought be present—I am rising to the work of a human being.',
    author: 'Marcus Aurelius',
    source: 'Meditations, Book V',
  },
  {
    text: 'There are more things, Lucilius, likely to frighten us than there are to crush us; we suffer more often in imagination than in reality.',
    author: 'Seneca',
    source: 'Moral Letters to Lucilius, Letter 13',
  },
  {
    text: 'If there is no struggle there is no progress.',
    author: 'Frederick Douglass',
    source: 'Speech at Canandaigua, New York, 1857',
  },
  {
    text: 'Men are disturbed not by the things which happen, but by the opinions about the things.',
    author: 'Epictetus',
    source: 'Enchiridion, Chapter 5',
  },
  {
    text: '…that which is a hindrance is made a furtherance to an act; and that which is an obstacle on the road helps us on this road.',
    author: 'Marcus Aurelius',
    source: 'Meditations, Book V',
  },
  {
    text: "I'm not afraid of storms, for I'm learning how to sail my ship.",
    author: 'Louisa May Alcott',
    source: 'Little Women',
  },
  {
    text: "Hold every hour in your grasp. Lay hold of to-day's task, and you will not need to depend so much upon to-morrow's.",
    author: 'Seneca',
    source: 'Moral Letters to Lucilius, Letter 1',
  },
  {
    text: 'Success is to be measured not so much by the position that one has reached in life as by the obstacles which he has overcome while trying to succeed.',
    author: 'Booker T. Washington',
    source: 'Up from Slavery, 1901',
  },
  {
    text: 'Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.',
    author: 'Marcus Aurelius',
    source: 'Meditations, Book VII',
  },
  {
    text: 'Nothing great… is produced suddenly, since not even the grape or the fig is.',
    author: 'Epictetus',
    source: 'Discourses',
  },
  {
    text: 'Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.',
    author: 'Samuel Beckett',
    source: 'Worstward Ho, 1983',
  },
  {
    text: 'When a man does not know what harbour he is making for, no wind is the right wind.',
    author: 'Seneca',
    source: 'Moral Letters to Lucilius, Letter 71',
  },
  {
    text: 'Let not future things disturb thee, for thou wilt come to them, if it shall be necessary, having with thee the same reason which now thou usest for present things.',
    author: 'Marcus Aurelius',
    source: 'Meditations, Book VII',
  },
  {
    text: 'Optimism is the faith that leads to achievement; nothing can be done without hope.',
    author: 'Helen Keller',
    source: 'Optimism, 1903',
  },
  {
    text: 'Fire tries gold, misfortune tries brave men.',
    author: 'Seneca',
    source: 'On Providence',
  },
  {
    text: 'The journey of a thousand lî commenced with a single step.',
    author: 'Laozi',
    source: 'Tao Te Ching, Chapter 64',
  },
  {
    text: 'If thou art pained by any external thing, it is not this thing that disturbs thee, but thy own judgement about it. And it is in thy power to wipe out this judgement now.',
    author: 'Marcus Aurelius',
    source: 'Meditations, Book VIII',
  },
  {
    text: 'If one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.',
    author: 'Henry David Thoreau',
    source: 'Walden, 1854',
  },
  {
    text: 'Of things some are in our power, and others are not.',
    author: 'Epictetus',
    source: 'Enchiridion, Chapter 1',
  },
  {
    text: 'It is not the critic who counts… The credit belongs to the man who is actually in the arena…',
    author: 'Theodore Roosevelt',
    source: 'Citizenship in a Republic, 1910',
  },
  {
    text: 'No longer talk at all about the kind of man that a good man ought to be, but be such.',
    author: 'Marcus Aurelius',
    source: 'Meditations, Book X',
  },
];

/** The same quote all day, a new one each day. */
export function quoteForToday(date = new Date()): Quote {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  return QUOTES[(dayOfYear + date.getFullYear()) % QUOTES.length];
}
