// The end-to-end tests' own Rails and Vite servers, apart from your
// development ones on 3000 and 5173. Used by playwright.config.ts and helpers.ts.
export const RAILS_PORT = 3001;
export const APP_PORT = 5174;
export const RAILS_URL = `http://127.0.0.1:${RAILS_PORT}`;
