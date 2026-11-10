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
 * The toast after a new resume is saved. It offers to log the win, and only
 * logs it if the button is pressed: a new resume isn't always a tailored one.
 */
export function showNewResumeToast(filledFields: readonly string[]) {
  const filled = filledFields.map((field) => FIELD_NAMES[field] ?? field);
  const body =
    filled.length > 0
      ? `Your ${list(filled)} came from your last resume. Give everything a read-through.`
      : 'Give it a read-through, then download your PDF.';

  showToast('celebrate', 'Resume saved', body, {
    label: 'Log a win: tailored resume',
    onClick: () => {
      client
        .mutate({
          mutation: LogActivityMutation,
          variables: { kind: 'TAILORED_MATERIALS', note: 'Tailored resume' },
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
