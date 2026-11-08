/**
 * The "Save to Onward" bookmark. You drag it to your bookmarks bar from the
 * Account page; clicking it on a job posting reads the page in your own
 * browser (where you're signed in to LinkedIn or Indeed) and opens Onward's
 * "Add application" form with the details filled in.
 *
 * Nothing is sent anywhere except the new Onward tab, and nothing is saved
 * until you click Save there. The details travel in the address's #fragment,
 * which browsers never send to a server.
 *
 * `readJobPage` runs on the job site, so it must be self-contained: no
 * imports, no helpers from outside the function. It avoids innerHTML and
 * DOMParser because LinkedIn blocks those for scripts (Trusted Types).
 */

export type ImportedJob = {
  company?: string;
  role?: string;
  location?: string;
  salaryRange?: string;
  workArrangement?: 'ONSITE' | 'HYBRID' | 'REMOTE';
  jobDescription?: string;
  postingUrl?: string;
  /** Where it came from, like "linkedin.com". */
  source?: string;
};

export function readJobPage(origin: string): void {
  type Job = {
    company?: string;
    role?: string;
    location?: string;
    salaryRange?: string;
    workArrangement?: 'ONSITE' | 'HYBRID' | 'REMOTE';
    jobDescription?: string;
    postingUrl?: string;
    source?: string;
  };

  const clean = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();

  const textOf = (...selectors: string[]) => {
    for (const selector of selectors) {
      const element = document.querySelector<HTMLElement>(selector);
      const text = clean(element?.innerText ?? element?.textContent);
      if (text) return text;
    }
    return '';
  };

  // Text of each child (like a row of buttons) kept apart, so "$150K/yr" and
  // "Hybrid" don't run together into one word.
  const partsText = (...selectors: string[]) => {
    for (const selector of selectors) {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) continue;
      const parts = Array.from(element.querySelectorAll<HTMLElement>('button, li, span, a'))
        .map((part) => clean(part.innerText ?? part.textContent))
        .filter(Boolean);
      const text = parts.length > 0 ? parts.join(' · ') : clean(element.innerText ?? element.textContent);
      if (text) return text;
    }
    return '';
  };

  // Keeps paragraphs and bullet points readable.
  const blockText = (...selectors: string[]) => {
    for (const selector of selectors) {
      const element = document.querySelector<HTMLElement>(selector);
      const text = (element?.innerText ?? element?.textContent ?? '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      if (text) return text;
    }
    return '';
  };

  const decodeEntities = (text: string) =>
    text
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&amp;/g, '&');

  // Descriptions in structured data are HTML, sometimes escaped twice. Turn
  // them into plain text without the DOM.
  const htmlToText = (html: string) =>
    decodeEntities(
      (/&lt;\/?[a-z]/i.test(html) ? decodeEntities(html) : html)
        .replace(/<\s*br\s*\/?>/gi, '\n')
        .replace(/<\s*li[^>]*>/gi, '\n• ')
        .replace(/<\/\s*(p|div|h[1-6]|ul|ol|li)\s*>/gi, '\n')
        .replace(/<[^>]+>/g, ''),
    )
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const arrangementIn = (text: string): Job['workArrangement'] => {
    if (/\bhybrid\b/i.test(text)) return 'HYBRID';
    if (/\bremote\b/i.test(text)) return 'REMOTE';
    if (/\bon[- ]?site\b|\bin[- ]office\b/i.test(text)) return 'ONSITE';
    return undefined;
  };

  // "$120K/yr - $150K/yr", "$45 - $55 an hour", "CA$90,000–CA$110,000 a year"
  const salaryIn = (text: string) => {
    const match = text.match(
      /(?:[A-Z]{1,3})?[$£€][\d.,]+(?:\s*[Kk])?(?:\s*\/\s*(?:yr|hr|year|hour))?(?:\s*(?:-|–|to)\s*(?:[A-Z]{1,3})?[$£€][\d.,]+(?:\s*[Kk])?(?:\s*\/\s*(?:yr|hr|year|hour))?)?(?:\s+(?:a|an|per)\s+(?:year|hour|month))?/,
    );
    return match ? clean(match[0]) : '';
  };

  // 1. Structured data (schema.org JobPosting), which many job sites include for Google.
  const fromStructuredData = (): Job => {
    const postings: Record<string, unknown>[] = [];
    const visit = (node: unknown) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object') return;
      const record = node as Record<string, unknown>;
      const type = record['@type'];
      if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) postings.push(record);
      if (record['@graph']) visit(record['@graph']);
    };
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        visit(JSON.parse(script.textContent ?? ''));
      } catch {
        // Not valid JSON. Skip it.
      }
    });
    const posting = postings[0];
    if (!posting) return {};

    const job: Job = {};
    job.role = clean(String(posting.title ?? ''));
    const organization = posting.hiringOrganization as { name?: string } | string | undefined;
    job.company = clean(typeof organization === 'string' ? organization : organization?.name);

    const places = ([] as unknown[]).concat(posting.jobLocation ?? []) as { address?: Record<string, string> }[];
    job.location = places
      .map((place) => {
        const address = place?.address ?? {};
        return [address.addressLocality, address.addressRegion, address.addressCountry].filter(Boolean).join(', ');
      })
      .filter(Boolean)
      .slice(0, 3)
      .join(' · ');
    if (String(posting.jobLocationType ?? '').toUpperCase() === 'TELECOMMUTE') job.workArrangement = 'REMOTE';

    const salary = posting.baseSalary as
      | { currency?: string; value?: { minValue?: number; maxValue?: number; value?: number; unitText?: string } }
      | undefined;
    const amount = salary?.value;
    if (amount && (amount.minValue || amount.value)) {
      const format = (n?: number) => (n ? n.toLocaleString() : '');
      const range = amount.minValue && amount.maxValue ? `${format(amount.minValue)}–${format(amount.maxValue)}` : format(amount.minValue ?? amount.value);
      const unit = amount.unitText ? ` per ${String(amount.unitText).toLowerCase()}` : '';
      job.salaryRange = `${salary?.currency ? `${salary.currency} ` : ''}${range}${unit}`;
    }
    if (typeof posting.description === 'string') job.jobDescription = htmlToText(posting.description);
    if (typeof posting.url === 'string') job.postingUrl = posting.url;
    return job;
  };

  // 2. What's on screen, for the sites people use most.
  const host = location.hostname.replace(/^www\./, '');
  const params = new URLSearchParams(location.search);

  const fromLinkedIn = (): Job => {
    const top = textOf(
      '.job-details-jobs-unified-top-card__primary-description-container',
      '.job-details-jobs-unified-top-card__tertiary-description-container',
      '.jobs-unified-top-card__primary-description',
      '.topcard__flavor-row',
    );
    const preferences = partsText('.job-details-fit-level-preferences', '.job-details-preferences-and-skills', '.jobs-unified-top-card__job-insight');
    const id = params.get('currentJobId') ?? location.pathname.match(/\/jobs\/view\/(?:[^/]*?-)?(\d+)/)?.[1];
    return {
      role: textOf('.job-details-jobs-unified-top-card__job-title', '.jobs-unified-top-card__job-title', '.top-card-layout__title', 'h1'),
      company: textOf(
        '.job-details-jobs-unified-top-card__company-name',
        '.jobs-unified-top-card__company-name',
        '.topcard__org-name-link',
        '.topcard__flavor',
      ),
      location: clean(top.split('·')[0]) || textOf('.topcard__flavor--bullet'),
      workArrangement: arrangementIn(preferences) ?? arrangementIn(top),
      salaryRange: salaryIn(preferences) || salaryIn(top),
      jobDescription: blockText('#job-details', '.jobs-description__content', '.jobs-box__html-content', '.show-more-less-html__markup'),
      postingUrl: id ? `https://www.linkedin.com/jobs/view/${id}/` : undefined,
    };
  };

  const fromIndeed = (): Job => {
    const location_ = textOf(
      '[data-testid="inlineHeader-companyLocation"]',
      '[data-testid="job-location"]',
      '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
      '.jobsearch-JobInfoHeader-subtitle > div:last-child',
    );
    const salaryText = partsText('#salaryInfoAndJobType', '[data-testid="jobsearch-OtherJobDetailsContainer"]', '#jobDetailsSection');
    const jk = params.get('jk') ?? params.get('vjk');
    return {
      role: textOf('[data-testid="jobsearch-JobInfoHeader-title"]', 'h1.jobsearch-JobInfoHeader-title', 'h1').replace(/\s*-\s*job post$/i, ''),
      company: textOf('[data-testid="inlineHeader-companyName"]', '[data-company-name="true"]', '.jobsearch-CompanyInfoContainer a'),
      location: location_.replace(/\s*•\s*(remote|hybrid).*$/i, ''),
      workArrangement: arrangementIn(location_) ?? arrangementIn(salaryText),
      salaryRange: salaryIn(salaryText),
      jobDescription: blockText('#jobDescriptionText', '.jobsearch-JobComponent-description'),
      postingUrl: jk ? `${location.origin}/viewjob?jk=${encodeURIComponent(jk)}` : undefined,
    };
  };

  // 3. Last resort: the page title.
  const fromPageTitle = (): Job => {
    const meta = (name: string) =>
      document.querySelector<HTMLMetaElement>(`meta[property="${name}"], meta[name="${name}"]`)?.content ?? '';
    return { role: clean(meta('og:title') || document.title).split(/\s[|–-]\s/)[0] };
  };

  const onScreen = host.endsWith('linkedin.com') ? fromLinkedIn() : /(^|\.)indeed\./.test(host) ? fromIndeed() : {};
  const structured = fromStructuredData();
  const fallback = fromPageTitle();

  // On-screen details win for LinkedIn and Indeed, since they show the job you clicked.
  const job: Job = { source: host, postingUrl: location.href };
  for (const source of [fallback, structured, onScreen]) {
    for (const [key, value] of Object.entries(source)) {
      if (value) (job as Record<string, unknown>)[key] = value;
    }
  }
  if (job.jobDescription && job.jobDescription.length > 20000) job.jobDescription = job.jobDescription.slice(0, 20000);

  const url = `${origin}/applications/new#import=${encodeURIComponent(JSON.stringify(job))}`;
  if (!window.open(url, '_blank')) location.href = url;
}

/** The bookmark's address, for an Onward running at `origin`. */
export function bookmarkletHref(origin: string): string {
  return `javascript:${encodeURIComponent(`void (${readJobPage.toString()})(${JSON.stringify(origin)})`)}`;
}

/** Reads the job the bookmark passed in the address, if any. */
export function importedJobFromHash(hash: string): ImportedJob | null {
  const match = hash.match(/^#import=(.+)$/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as ImportedJob;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * A stable key for a job posting, so the same job saved twice is noticed even
 * when the address has different tracking bits on it.
 */
export function postingKey(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host.endsWith('linkedin.com')) {
      const id = parsed.searchParams.get('currentJobId') ?? parsed.pathname.match(/\/jobs\/view\/(?:[^/]*?-)?(\d+)/)?.[1];
      if (id) return `linkedin:${id}`;
    }
    if (/(^|\.)indeed\./.test(host)) {
      const jk = parsed.searchParams.get('jk') ?? parsed.searchParams.get('vjk');
      if (jk) return `indeed:${jk}`;
    }
    return `${host}${parsed.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}
