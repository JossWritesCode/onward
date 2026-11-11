import { client } from '../../apollo';
import { LogActivityMutation } from '../../graphql/operations';
import { celebrateWin, showToast } from '../celebrate';

const FIELD_NAMES: Record<string, string> = {
  name: 'name',
  location: 'location',
  phone: 'phone number',
  email: 'email',
  links: 'links',
};

function list(words: string[]) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')}${words.length > 2 ? ',' : ''} and ${words[words.length - 1]}`;
}

/**
 * A toast with a "Log a win: tailored resume" button. The win is only logged
 * if the button is pressed. With an application, it's logged against that
 * application, so it shows up in its history.
 */
function showResumeToast(title: string, body: string, application?: { id: string; company: string } | null) {
  showToast('celebrate', title, body, {
    label: 'Log a win: tailored resume',
    onClick: () => {
      client
        .mutate({
          mutation: LogActivityMutation,
          variables: {
            kind: 'TAILORED_MATERIALS',
            jobApplicationId: application?.id ?? null,
            note: application ? `Tailored resume for ${application.company}` : 'Tailored resume',
          },
          refetchQueries: ['Progress', 'Streak', 'Today'],
        })
        .then(({ data }) => {
          const errors = data?.logActivity.errors ?? [];
          if (errors.length > 0) showToast('gentle', "That didn't log", errors[0].message);
          else celebrateWin('TAILORED_MATERIALS');
        })
        .catch(() => showToast('gentle', "That didn't log", 'You can log it from the Progress page instead.'));
    },
  });
}

/** After a pasted resume is saved. */
export function showNewResumeToast(filledFields: readonly string[], application?: { id: string; company: string } | null) {
  const filled = filledFields.map((field) => FIELD_NAMES[field] ?? field);
  const body =
    filled.length > 0
      ? `Your ${list(filled)} came from your last resume. Give everything a read-through.`
      : 'Give it a read-through, then download your PDF.';
  showResumeToast(application ? `Resume saved for ${application.company}` : 'Resume saved', body, application);
}

/** After a resume is copied for an application. */
export function showTailoredToast(application: { id: string; company: string }, baseTitle: string) {
  showResumeToast(
    `Copied for ${application.company}`,
    `This started as "${baseTitle}". Shape it for this job, then log the win when you're done.`,
    application,
  );
}
