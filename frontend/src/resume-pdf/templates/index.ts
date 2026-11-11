import type { ResumeTemplate } from '../../gql/graphql';
import Classic from './Classic';
import Compact from './Compact';
import Modern from './Modern';
import type { Template } from './types';

/**
 * Every template, by its id. To add one:
 *   1. Write it next to Classic.tsx, taking the same TemplateProps. Read sizes
 *      from the theme (see ../theme.ts) rather than hard-coding them, so the
 *      Design panel's sliders work on it.
 *   2. Add it here.
 *   3. Add it to TEMPLATE_DETAILS in src/lib/resume/style.ts and TEMPLATES in
 *      src/lib/resume/types.ts.
 *   4. Add it to Resume::TEMPLATES and Types::ResumeTemplateEnum in the backend,
 *      then run bin/rails graphql:dump_schema.
 */
export const TEMPLATE_DOCUMENTS: Record<ResumeTemplate, Template> = {
  CLASSIC: Classic,
  COMPACT: Compact,
  MODERN: Modern,
};
