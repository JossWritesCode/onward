import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import Logo from '../components/Logo';
import Sprig from '../components/illustrations/Sprig';
import { ChevronDownIcon, OnwardRuleIcon } from '../components/icons';
import { ButtonLink, buttonClasses } from '../components/ui';
import { shotSource, type Shot } from '../lib/landingShots';
import { prefersReducedMotion, useScheme } from '../lib/preferences';
import { useMediaQuery } from '../lib/useMediaQuery';

const WALKTHROUGH_ID = 'how-it-works';

// The landing page buttons are a size up from the app's, since there's only one thing to do here.
const bigButton = 'min-h-12! px-6! text-base/6!';

// Every section shares one width, so their left edges line up down the page.
const PAGE = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

/**
 * The front page for people who haven't signed in: a short look inside
 * Onward, using real screens filled with made-up sample data. Signed-in
 * people never see it; they go straight to their board (see PublicHome).
 */
export default function LandingPage() {
  const walkthroughHeading = useRef<HTMLHeadingElement>(null);

  function showWalkthrough(event?: MouseEvent) {
    event?.preventDefault();
    const heading = walkthroughHeading.current;
    if (!heading) return;
    heading.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    // Move keyboard focus along with the page, so Tab carries on from the walkthrough.
    heading.focus({ preventScroll: true });
  }

  // A link straight to /#how-it-works arrives before the page has drawn, so scroll once it has.
  useEffect(() => {
    if (window.location.hash === `#${WALKTHROUGH_ID}`) walkthroughHeading.current?.scrollIntoView();
  }, []);

  return (
    <div className="min-h-dvh overflow-x-clip">
      <title>Onward: a calmer way to organize your job search</title>

      <header className={`${PAGE} flex items-center justify-between gap-4 py-5`}>
        <Logo />
        <Link to="/login" className={buttonClasses('outline')}>
          Sign in
        </Link>
      </header>

      <main>
        <Hero onShowWalkthrough={showWalkthrough} />

        <section aria-labelledby={`${WALKTHROUGH_ID}-heading`} id={WALKTHROUGH_ID} className="scroll-mt-6">
          <div className={PAGE}>
            <div className="flex items-center gap-3 border-t border-line pt-10 text-link">
              <OnwardRuleIcon className="text-base" strokeWidth={2} />
              <h2
                id={`${WALKTHROUGH_ID}-heading`}
                ref={walkthroughHeading}
                tabIndex={-1}
                className="scroll-mt-6 rounded text-sm/5 font-semibold tracking-wide text-muted uppercase"
              >
                How it works
              </h2>
            </div>
          </div>

          <DetailsStep />
          <TailorStep />
          <PrepStep />
          <ProgressStep />
        </section>

        <MakerNote />

        <Closing />
      </main>
    </div>
  );
}

function Hero({ onShowWalkthrough }: { onShowWalkthrough: (event: MouseEvent) => void }) {
  return (
    <section
      aria-labelledby="hero-heading"
      className={`${PAGE} grid items-center gap-12 pt-8 pb-20 sm:pt-14 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-14 lg:pt-16 lg:pb-28 xl:gap-20`}
    >
      <div className="max-w-xl">
        <h1
          id="hero-heading"
          className="font-serif text-[40px]/[46px] font-medium tracking-[-0.015em] text-balance sm:text-[52px]/[58px]"
        >
          A calmer way to organize your job search.
        </h1>
        <p className="mt-5 text-lg/8 text-muted">
          Keep track of applications, tailor your resume for each role, and make time for interview prep. See the
          work you’ve done, even while you’re waiting to hear back.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <ButtonLink to="/signup" className={bigButton}>
            Get started
          </ButtonLink>
          <a href={`#${WALKTHROUGH_ID}`} onClick={onShowWalkthrough} className={buttonClasses('ghost', `${bigButton} text-link!`)}>
            See how it works
            <ChevronDownIcon />
          </a>
        </div>
      </div>

      <BoardPreview />
    </section>
  );
}

/**
 * The board: a saved role, applications waiting on a follow-up, and an
 * interview coming up. Wide screens see the first three columns side by side.
 * Phones see the top card of each, one above the next, so the words stay
 * big enough to read.
 */
function BoardPreview() {
  const wide = useMediaQuery('(min-width: 1024px)');

  if (wide) {
    return (
      <div className="relative">
        <Sprig className="absolute -top-16 -right-3 z-0 h-auto w-14 rotate-12 xl:-right-8" />
        <Frame fade="always" className="relative z-10">
          <Screenshot
            shot="board"
            eager
            sizes="(min-width: 1280px) 760px, 60vw"
            alt="The Onward board. Saved: Marigold Learning, Frontend Developer. Applied: Kestrel Maps, with a follow-up due today, and Fernway Books, with a follow-up on Nov 25 and a resume tailored for the role. Phone screen: Tidepool Studio, with the interview in 3 days."
          />
        </Frame>
      </div>
    );
  }

  const stages: { shot: Shot; alt: string }[] = [
    { shot: 'stage-saved', alt: 'The Saved column, with Marigold Learning, Frontend Developer, saved for later.' },
    { shot: 'stage-applied', alt: 'The Applied column, with Kestrel Maps, React Developer, and a follow-up due today.' },
    {
      shot: 'stage-interview',
      alt: 'The Phone screen column, with Tidepool Studio, Frontend Engineer, and the interview in 3 days.',
    },
  ];

  return (
    <ul aria-label="A look at the Onward board" className="mx-auto grid w-full max-w-sm gap-3 md:max-w-none md:grid-cols-3 md:items-start">
      {stages.map((stage) => (
        <li key={stage.shot}>
          <Screenshot
            shot={stage.shot}
            eager
            sizes="(min-width: 768px) 30vw, 384px"
            alt={stage.alt}
            className="rounded-2xl"
          />
        </li>
      ))}
    </ul>
  );
}

function DetailsStep() {
  return (
    <Step
      title="Keep the details together."
      body="Each application keeps the resume you sent and the day to follow up, right on its card. No more digging through old emails to remember where things stand."
    >
      <div className="mx-auto w-full max-w-88">
        <Screenshot
          shot="card"
          sizes="352px"
          alt="An application card for Fernway Books, Frontend Developer. It shows a follow-up on Nov 25, the resume Frontend v3 tailored for Fernway Books, the date applied, the location and a contact, Theo Adeyemi."
          className="rounded-2xl"
        />
      </div>
    </Step>
  );
}

/**
 * Tailoring with the AI you already use. Onward writes the message and reads
 * the reply, so there's no separate AI service to pay for.
 */
function TailorStep() {
  const steps = [
    'Copy the message Onward writes, with your resume and the job inside.',
    'Paste it into ChatGPT, or any AI chat you already use.',
    'Paste the reply back, and your tailored resume is ready.',
  ];

  return (
    <Step
      flip
      title="Tailor your resume with the AI you already use."
      body="Many job apps charge a monthly fee to tailor your resume with AI. Onward doesn’t. It works with the AI you already have, by copy and paste, so there’s no extra subscription."
      extra={
        <ol className="mt-6 space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="w-5 shrink-0 font-serif text-xl/7 font-medium text-link tabular-nums lining-nums" aria-hidden="true">
                {index + 1}
              </span>
              <span className="text-base/7">{step}</span>
            </li>
          ))}
        </ol>
      }
    >
      <div className="mx-auto w-full max-w-md">
        {/* No fade here: the crop ends just under the button, and a fade would make it look switched off. */}
        <Frame>
          <Screenshot
            shot="tailor"
            phone="tailor-phone"
            sizes="(min-width: 768px) 448px, 100vw"
            alt="The Resume section of an application for Kestrel Maps. The message for ChatGPT has just been copied, ChatGPT’s reply is pasted into the box below it, and the Make tailored resume button is ready."
          />
        </Frame>
      </div>
    </Step>
  );
}

function PrepStep() {
  return (
    <Step
      title="Prepare a little at a time."
      body="When an interview is on the calendar, it gets its own short checklist. Tick off a step, or practice one question out loud. A few minutes a day adds up."
    >
      {/* Two pages from the workbook: the checklist, with a practice prompt laid over its lower edge. */}
      <div className="mx-auto w-full max-w-lg">
        <Frame fade="always">
          <Screenshot
            shot="checklist"
            phone="checklist-phone"
            sizes="(min-width: 768px) 512px, 100vw"
            alt="The prep checklist for a phone screen at Tidepool Studio in 3 days, with 2 of 5 steps done: research the company and reread the job description. Still to do: rehearse two stories, write three questions to ask, and plan the logistics."
          />
        </Frame>
        <Frame className="relative z-10 -mt-10 ml-6 sm:-mt-14 sm:ml-14">
          <Screenshot
            shot="prompt"
            phone="prompt-phone"
            sizes="(min-width: 768px) 456px, 90vw"
            alt="A practice prompt: Tell me about a project you’re proud of."
          />
        </Frame>
      </div>
    </Step>
  );
}

/** The payoff: a whole week of effort, counted. It gets the most room on the page. */
function ProgressStep() {
  return (
    <div className={`${PAGE} py-20 sm:py-28`}>
      <div className="mx-auto max-w-2xl text-center">
        <h3 className="font-serif text-[34px]/[40px] font-medium tracking-[-0.01em] text-balance sm:text-[42px]/[48px]">
          See what you did this week.
        </h3>
        <p className="mt-4 text-lg/8 text-muted">
          A job search is full of work nobody sees. Onward counts every application, conversation and practice session,
          so you can see your effort add up, whatever the inbox says.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-[49rem] sm:mt-14">
        {/* Phones get the recap's own phone layout, which is a whole card, so only the wide crop fades out. */}
        <Frame fade="wide" className="mx-auto max-w-md sm:max-w-none">
          <Screenshot
            shot="progress"
            phone="progress-phone"
            sizes="(min-width: 832px) 784px, 100vw"
            alt="This week’s recap, Nov 16 to Nov 22: 3 applications, 3 networking, 1 tailored materials and 4 practice sessions, with a 15-day streak. Under it, each step newest first: practiced an interview answer today, sent an application to Cobalt & Finch, asked a former teammate about a referral, studied system design for 30 minutes, and thanked Maya Lindqvist for an intro call."
          />
        </Frame>
      </div>
    </div>
  );
}

/**
 * Who made Onward, and the optional extra for people looking in tech. It
 * leads with "any job search" so nobody thinks Onward is only for engineers.
 */
function MakerNote() {
  return (
    <section aria-labelledby="maker-heading" className={`${PAGE} grid items-center gap-10 pb-20 sm:pb-28 md:grid-cols-2 md:gap-14 lg:gap-24`}>
      <div className="max-w-lg">
        <h2 id="maker-heading" className="font-serif text-[32px]/[38px] font-medium tracking-[-0.01em] text-balance sm:text-[38px]/[44px]">
          <span className="block">Made by a software engineer,</span> <span className="block">for any job search.</span>
        </h2>
        <p className="mt-4 text-lg/8 text-muted">
          Onward was built by a software engineer who wanted a calmer way to look for work. It works the same in any
          field.
        </p>
        <p className="mt-4 text-lg/8 text-muted">
          Looking in tech? Turn on the software engineering track in Settings to count LeetCode practice toward your
          streak and see your GitHub activity and study hours in one place. It stays out of sight unless you switch it
          on.
        </p>
      </div>
      <div className="mx-auto w-full max-w-md">
        <Frame fade="always">
          <Screenshot
            shot="engineering"
            sizes="(min-width: 768px) 448px, 100vw"
            alt="The Software engineering track in Settings: it adds an Engineering page with your LeetCode streak, GitHub contributions and hours studied. The Show the Engineering page switch is on."
          />
        </Frame>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section aria-labelledby="closing-heading" className={`${PAGE} pb-24 sm:pb-32`}>
      <div className="flex flex-col items-center border-t border-line pt-20 text-center sm:pt-24">
        <OnwardRuleIcon className="text-2xl text-link" strokeWidth={2} />
        <h2 id="closing-heading" className="mt-6 font-serif text-[34px]/[40px] font-medium tracking-[-0.01em] sm:text-[42px]/[48px]">
          Start with one application
        </h2>
        <p className="mt-3 max-w-md text-lg/8 text-muted">Add the next job you’re applying to. Everything else can come later.</p>
        <ButtonLink to="/signup" className={`${bigButton} mt-8`}>
          Get started
        </ButtonLink>
      </div>
    </section>
  );
}

/** One step of the walkthrough: a few words beside a screenshot. `flip` puts the picture first on wide screens. */
function Step({
  title,
  body,
  extra,
  flip = false,
  children,
}: {
  title: string;
  body: string;
  /** Anything that goes under the words, like a short list. */
  extra?: ReactNode;
  flip?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${PAGE} grid items-center gap-10 py-14 sm:py-20 md:grid-cols-2 md:gap-14 lg:gap-24`}>
      <div className={`max-w-md ${flip ? 'md:order-2' : ''}`}>
        <h3 className="font-serif text-[32px]/[38px] font-medium tracking-[-0.01em] sm:text-[38px]/[44px]">{title}</h3>
        <p className="mt-4 text-lg/8 text-muted">{body}</p>
        {extra}
      </div>
      <div className={flip ? 'md:order-1' : ''}>{children}</div>
    </div>
  );
}

/**
 * A soft paper edge around a screenshot. `fade` lets a crop that's cut off at
 * the bottom fade into the page instead of stopping hard: "always", or "wide"
 * for screens from 640px up.
 */
function Frame({ fade, className = '', children }: { fade?: 'always' | 'wide'; className?: string; children: ReactNode }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-line bg-page shadow-[0_1px_2px_rgb(40_40_35/0.05),0_18px_40px_-20px_rgb(40_40_35/0.25)] dark:shadow-[0_18px_40px_-20px_rgb(0_0_0/0.6)] ${fade ? 'relative' : ''} ${className}`}
    >
      {children}
      {fade && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-b from-transparent to-page ${fade === 'wide' ? 'hidden sm:block' : ''}`}
        />
      )}
    </div>
  );
}

/**
 * A screenshot that matches the page's light or dark colors. `phone` swaps in
 * a crop of the phone layout on narrow screens, where the wide one would be
 * too small to read.
 */
function Screenshot({
  shot,
  phone,
  alt,
  sizes,
  eager = false,
  className = '',
}: {
  shot: Shot;
  phone?: Shot;
  alt: string;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  const scheme = useScheme();
  const wide = shotSource(shot, scheme);
  const image = (source: typeof wide) => (
    <img
      src={source.src}
      srcSet={source.srcSet}
      sizes={sizes}
      width={source.width}
      height={source.height}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      className={`block h-auto w-full ${className}`}
    />
  );

  if (!phone) return image(wide);

  const narrow = shotSource(phone, scheme);
  return (
    <picture>
      <source media="(min-width: 640px)" srcSet={wide.srcSet} sizes={sizes} width={wide.width} height={wide.height} />
      {image(narrow)}
    </picture>
  );
}
