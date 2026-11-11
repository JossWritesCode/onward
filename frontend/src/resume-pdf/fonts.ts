import { Font } from '@react-pdf/renderer';
import neuton from '../assets/fonts/Neuton_400Regular.ttf?url';
import robotoRegular from '../assets/fonts/Roboto_400Regular.ttf?url';
import robotoMedium from '../assets/fonts/Roboto_500Medium.ttf?url';
import robotoBold from '../assets/fonts/Roboto_700Bold.ttf?url';
import { FONTS } from './templates/types';

let registered = false;

/** Tells react-pdf where the fonts are. Only the letters a resume uses end up embedded in its PDF. */
export function registerFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: FONTS.sans,
    fonts: [
      { src: robotoRegular, fontWeight: 400 },
      { src: robotoMedium, fontWeight: 500 },
      { src: robotoBold, fontWeight: 700 },
    ],
  });
  Font.register({ family: FONTS.serif, src: neuton });
  // Resumes read better without words split across lines.
  Font.registerHyphenationCallback((word) => [word]);
}
