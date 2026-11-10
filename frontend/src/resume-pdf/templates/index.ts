import type { ResumeTemplate } from '../../gql/graphql';
import Classic from './Classic';
import type { Template } from './types';

/**
 * Every template, by its id. To add one (say, Compact):
 *   1. Write Compact.tsx next to Classic.tsx, taking the same TemplateProps.
 *   2. Add it here.
 *   3. Add its id and label to TEMPLATES in src/lib/resume/types.ts.
 *   4. Add it to Resume::TEMPLATES and Types::ResumeTemplateEnum in the backend,
 *      then run bin/rails graphql:dump_schema.
 */
export const TEMPLATE_DOCUMENTS: Record<ResumeTemplate, Template> = {
  CLASSIC: Classic,
};
