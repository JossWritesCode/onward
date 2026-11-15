/** Fit a whole page in the panel, fit the panel's width, or a set size where 100 is the page's real size. */
export type Zoom = 'page' | 'width' | number;

export const MIN_ZOOM = 25;
export const MAX_ZOOM = 300;
export const ZOOM_STEP = 10;
/** PDF points are 1/72 inch and CSS pixels 1/96 inch, so this is a page's real size on screen. */
export const POINTS_TO_PIXELS = 96 / 72;
/** Never draw a page narrower than this, however small the panel. */
const SMALLEST_PAGE = 80;

type Size = { width: number; height: number };

/**
 * How wide to draw each page, in CSS pixels.
 *
 * @param zoom The zoom setting.
 * @param room The space inside the panel, padding already taken off.
 * @param pageSize The page's size in PDF points.
 * @param labelHeight Space a "Page 1 of 2" label takes under the page, or 0 when there isn't one.
 */
export function pageWidth(zoom: Zoom, room: Size, pageSize: Size, labelHeight: number): number {
  if (room.width <= 0) return 0;
  let width: number;
  if (zoom === 'width') {
    width = room.width;
  } else if (zoom === 'page') {
    // A whole page and its label, top to bottom, without being wider than the panel.
    const tallest = Math.max(0, room.height - labelHeight);
    width = Math.min(room.width, Math.floor((tallest * pageSize.width) / pageSize.height));
  } else {
    width = Math.round((pageSize.width * POINTS_TO_PIXELS * zoom) / 100);
  }
  return Math.max(width, SMALLEST_PAGE);
}

/** The percentage a page drawn `width` pixels wide is shown at. */
export function zoomPercent(width: number, pageSize: Size): number {
  const actual = pageSize.width * POINTS_TO_PIXELS;
  return actual > 0 && width > 0 ? Math.round((width / actual) * 100) : 100;
}

/**
 * One step in or out from `current` percent, landing on a round number even
 * when starting from a fit (56% goes in to 60%, not 66%), within the limits.
 */
export function stepZoom(current: number, direction: -1 | 1): number {
  const next =
    direction === 1
      ? Math.floor(current / ZOOM_STEP + 1e-6) * ZOOM_STEP + ZOOM_STEP
      : Math.ceil(current / ZOOM_STEP - 1e-6) * ZOOM_STEP - ZOOM_STEP;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
}
