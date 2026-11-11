/** "This runs onto 2 pages. Page 2 is about a quarter full." */
export function overflowMessage(pages: number, lastPageFill: number): string {
  const plural = pages === 2 ? '2 pages' : `${pages} pages`;
  const last = `page ${pages}`;
  let how: string;
  if (lastPageFill < 0.14) how = `Only a few lines spill onto ${last}: one trimmed bullet, or a tighter density, should do it.`;
  else if (lastPageFill < 0.35) how = `${capitalize(last)} is about a quarter full.`;
  else if (lastPageFill < 0.62) how = `${capitalize(last)} is about half full.`;
  else if (lastPageFill < 0.88) how = `${capitalize(last)} is about three-quarters full.`;
  else how = `${capitalize(last)} is nearly full.`;
  return `This runs onto ${plural}. ${how}`;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
