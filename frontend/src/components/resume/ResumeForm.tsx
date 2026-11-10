import type { ReactNode } from 'react';
import {
  EMPTY_JOB,
  EMPTY_SCHOOL,
  EMPTY_SECTION,
  EMPTY_SECTION_ITEM,
  EMPTY_SKILL_GROUP,
  type ResumeContent,
} from '../../lib/resume/types';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '../icons';
import { Button, Card, Field, Input, Textarea } from '../ui';
import ListInput from './ListInput';

const DATE_HINT = 'Like 2022-08, or Present.';

const iconButton =
  'rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-200/60 hover:text-stone-700 disabled:opacity-30 ' +
  'disabled:hover:bg-transparent dark:hover:bg-stone-800 dark:hover:text-stone-200 ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30';

/**
 * A list of things you can add to, remove from, and reorder: jobs, schools,
 * skill groups. `children` draws the fields for one of them.
 */
function Repeater<T>({
  items,
  onChange,
  blank,
  noun,
  children,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
  /** What one of them is called, like "job". */
  noun: string;
  children: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  const replace = (index: number, patch: Partial<T>) =>
    onChange(items.map((item, at) => (at === index ? { ...item, ...patch } : item)));
  const move = (index: number, by: number) => {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + by, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border-2 border-stone-200 p-3 dark:border-stone-800">
          <div className="mb-2 flex items-center gap-0.5">
            <span className="mr-auto text-xs font-black tracking-wide text-stone-400 uppercase">
              {noun} {index + 1}
            </span>
            <button
              type="button"
              className={iconButton}
              aria-label={`Move ${noun} ${index + 1} up`}
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ChevronUpIcon />
            </button>
            <button
              type="button"
              className={iconButton}
              aria-label={`Move ${noun} ${index + 1} down`}
              disabled={index === items.length - 1}
              onClick={() => move(index, 1)}
            >
              <ChevronDownIcon />
            </button>
            <button
              type="button"
              className={`${iconButton} hover:text-rose-600 dark:hover:text-rose-400`}
              aria-label={`Remove ${noun} ${index + 1}`}
              onClick={() => onChange(items.filter((_, at) => at !== index))}
            >
              <TrashIcon />
            </button>
          </div>
          <div className="space-y-3">{children(item, (patch) => replace(index, patch), index)}</div>
        </div>
      ))}
      <Button variant="ghost" onClick={() => onChange([...items, structuredClone(blank)])}>
        <PlusIcon /> Add {noun}
      </Button>
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-lg font-black">{title}</h2>
        {hint && <p className="text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
      </div>
      {children}
    </Card>
  );
}

const two = 'grid gap-3 sm:grid-cols-2';

/** The left side of the resume editor: every part of the resume as form fields. */
export default function ResumeForm({
  content,
  onChange,
}: {
  content: ResumeContent;
  onChange: (content: ResumeContent) => void;
}) {
  const set = (patch: Partial<ResumeContent>) => onChange({ ...content, ...patch });

  return (
    <div className="space-y-5">
      <Group title="Contact">
        <div className={two}>
          <Field label="Name" htmlFor="resume-name">
            <Input id="resume-name" value={content.name} onChange={(e) => set({ name: e.target.value })} autoComplete="off" />
          </Field>
          <Field label="Headline" htmlFor="resume-headline">
            <Input
              id="resume-headline"
              value={content.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Frontend Developer"
            />
          </Field>
          <Field label="Location" htmlFor="resume-location">
            <Input id="resume-location" value={content.location} onChange={(e) => set({ location: e.target.value })} />
          </Field>
          <Field label="Phone" htmlFor="resume-phone">
            <Input id="resume-phone" value={content.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="resume-email">
            <Input id="resume-email" type="email" value={content.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Links" htmlFor="resume-links" hint="One per line.">
            <ListInput
              id="resume-links"
              separator="line"
              rows={2}
              value={content.links}
              onChange={(links) => set({ links })}
              placeholder="linkedin.com/in/you"
            />
          </Field>
        </div>
      </Group>

      <Group title="Summary">
        <Field label="Professional summary" htmlFor="resume-summary">
          <Textarea id="resume-summary" rows={5} value={content.summary} onChange={(e) => set({ summary: e.target.value })} />
        </Field>
      </Group>

      <Group title="Skills" hint="Each group is one line on the resume.">
        <Repeater items={content.skills} onChange={(skills) => set({ skills })} blank={EMPTY_SKILL_GROUP} noun="group">
          {(group, update, index) => (
            <>
              <Field label="Label" htmlFor={`skill-label-${index}`}>
                <Input
                  id={`skill-label-${index}`}
                  value={group.label}
                  onChange={(e) => update({ label: e.target.value })}
                  placeholder="Frontend Development"
                />
              </Field>
              <Field label="Skills" htmlFor={`skill-items-${index}`} hint="Separated by commas.">
                <ListInput
                  id={`skill-items-${index}`}
                  separator="comma"
                  value={group.items}
                  onChange={(items) => update({ items })}
                  placeholder="React, TypeScript"
                />
              </Field>
            </>
          )}
        </Repeater>
      </Group>

      <Group title="Work experience" hint="Most recent first.">
        <Repeater items={content.experience} onChange={(experience) => set({ experience })} blank={EMPTY_JOB} noun="job">
          {(job, update, index) => (
            <>
              <div className={two}>
                <Field label="Title" htmlFor={`job-title-${index}`}>
                  <Input id={`job-title-${index}`} value={job.title} onChange={(e) => update({ title: e.target.value })} />
                </Field>
                <Field label="Location" htmlFor={`job-location-${index}`}>
                  <Input id={`job-location-${index}`} value={job.location} onChange={(e) => update({ location: e.target.value })} />
                </Field>
                <Field label="Company" htmlFor={`job-company-${index}`} className="sm:col-span-2">
                  <Input id={`job-company-${index}`} value={job.company} onChange={(e) => update({ company: e.target.value })} />
                </Field>
                <Field label="Start" htmlFor={`job-start-${index}`} hint="Like 2022-08.">
                  <Input id={`job-start-${index}`} value={job.start} onChange={(e) => update({ start: e.target.value })} placeholder="2022-08" />
                </Field>
                <Field label="End" htmlFor={`job-end-${index}`} hint={DATE_HINT}>
                  <Input id={`job-end-${index}`} value={job.end} onChange={(e) => update({ end: e.target.value })} placeholder="Present" />
                </Field>
              </div>
              <Field label="Bullets" htmlFor={`job-bullets-${index}`} hint="One per line.">
                <ListInput
                  id={`job-bullets-${index}`}
                  separator="line"
                  rows={5}
                  value={job.bullets}
                  onChange={(bullets) => update({ bullets })}
                />
              </Field>
            </>
          )}
        </Repeater>
      </Group>

      <Group title="Education">
        <Repeater items={content.education} onChange={(education) => set({ education })} blank={EMPTY_SCHOOL} noun="school">
          {(school, update, index) => (
            <div className={two}>
              <Field label="School" htmlFor={`school-name-${index}`} className="sm:col-span-2">
                <Input id={`school-name-${index}`} value={school.school} onChange={(e) => update({ school: e.target.value })} />
              </Field>
              <Field label="Degree" htmlFor={`school-degree-${index}`} className="sm:col-span-2">
                <Input id={`school-degree-${index}`} value={school.degree} onChange={(e) => update({ degree: e.target.value })} />
              </Field>
              <Field label="Date" htmlFor={`school-date-${index}`} hint="Like 2019-05.">
                <Input id={`school-date-${index}`} value={school.date} onChange={(e) => update({ date: e.target.value })} placeholder="2019-05" />
              </Field>
              <Field label="Honours" htmlFor={`school-honors-${index}`} hint="Optional.">
                <Input id={`school-honors-${index}`} value={school.honors} onChange={(e) => update({ honors: e.target.value })} />
              </Field>
            </div>
          )}
        </Repeater>
      </Group>

      <Group title="Extra sections" hint="Projects, volunteering, certifications, and the like.">
        <Repeater items={content.sections} onChange={(sections) => set({ sections })} blank={EMPTY_SECTION} noun="section">
          {(section, update, sectionIndex) => (
            <>
              <Field label="Heading" htmlFor={`section-heading-${sectionIndex}`}>
                <Input
                  id={`section-heading-${sectionIndex}`}
                  value={section.heading}
                  onChange={(e) => update({ heading: e.target.value })}
                  placeholder="Projects"
                />
              </Field>
              <Repeater items={section.items} onChange={(items) => update({ items })} blank={EMPTY_SECTION_ITEM} noun="entry">
                {(item, updateItem, index) => {
                  const id = `section-${sectionIndex}-item-${index}`;
                  return (
                    <>
                      <div className={two}>
                        <Field label="Title" htmlFor={`${id}-title`}>
                          <Input id={`${id}-title`} value={item.title} onChange={(e) => updateItem({ title: e.target.value })} />
                        </Field>
                        <Field label="Date" htmlFor={`${id}-date`} hint="Like 2023-04, or just 2023.">
                          <Input id={`${id}-date`} value={item.date} onChange={(e) => updateItem({ date: e.target.value })} />
                        </Field>
                        <Field label="Subtitle" htmlFor={`${id}-subtitle`} className="sm:col-span-2" hint="Optional.">
                          <Input id={`${id}-subtitle`} value={item.subtitle} onChange={(e) => updateItem({ subtitle: e.target.value })} />
                        </Field>
                      </div>
                      <Field label="Bullets" htmlFor={`${id}-bullets`} hint="One per line.">
                        <ListInput
                          id={`${id}-bullets`}
                          separator="line"
                          rows={3}
                          value={item.bullets}
                          onChange={(bullets) => updateItem({ bullets })}
                        />
                      </Field>
                    </>
                  );
                }}
              </Repeater>
            </>
          )}
        </Repeater>
      </Group>
    </div>
  );
}
