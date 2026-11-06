import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Icon>
);

export const ArrowUpRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 17 17 7M9 7h8v8" />
  </Icon>
);

export const BriefcaseIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18" />
  </Icon>
);

export const UsersIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
  </Icon>
);

export const LogOutIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Icon>
);

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Icon>
);

export const ExternalLinkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </Icon>
);

export const MapPinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
);

export const CalendarIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M8 3v4M16 3v4M3.5 10.5h17" />
  </Icon>
);

export const MailIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
);

export const XIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const SparklesIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5 13.8 9a2 2 0 0 0 1.2 1.2l5.5 1.8-5.5 1.8a2 2 0 0 0-1.2 1.2L12 20.5 10.2 15A2 2 0 0 0 9 13.8L3.5 12 9 10.2A2 2 0 0 0 10.2 9Z" />
    <path d="M19 3v4M17 5h4" />
  </Icon>
);

export const TrophyIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z" />
    <path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4.9M17 6h2.5a2.5 2.5 0 0 1-2.6 4.9" />
  </Icon>
);

export const HeartIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 20s-7.5-4.6-9-9.4C1.9 7 4.2 4 7.4 4c2 0 3.5 1.1 4.6 2.7C13.1 5.1 14.6 4 16.6 4c3.2 0 5.5 3 4.4 6.6-1.5 4.8-9 9.4-9 9.4Z" />
  </Icon>
);

export const VolumeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M11 5 6 9H3v6h3l5 4Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </Icon>
);

export const VolumeOffIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M11 5 6 9H3v6h3l5 4Z" />
    <path d="m16 9 6 6M22 9l-6 6" />
  </Icon>
);

export const BoardIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4" width="5" height="16" rx="1.5" />
    <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
    <rect x="16" y="4" width="5" height="7" rx="1.5" />
  </Icon>
);

export const ListIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </Icon>
);

export const ColumnsIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
    <circle cx="9" cy="7" r="1.8" fill="currentColor" />
    <circle cx="15" cy="12" r="1.8" fill="currentColor" />
    <circle cx="7" cy="17" r="1.8" fill="currentColor" />
  </Icon>
);

export const QuoteIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 7H5.5A1.5 1.5 0 0 0 4 8.5V12a1 1 0 0 0 1 1h3v1.5A2.5 2.5 0 0 1 5.5 17M20 7h-3.5A1.5 1.5 0 0 0 15 8.5V12a1 1 0 0 0 1 1h3v1.5a2.5 2.5 0 0 1-2.5 2.5" />
  </Icon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const ChevronUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 15 6-6 6 6" />
  </Icon>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m15 6-6 6 6 6" />
  </Icon>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export const FlameIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3.1 2.1-5 3.6-7 .4 1.7 1.3 2.8 2.6 3.4C11.4 7.2 13 4.4 15.4 3c-.3 2.6.5 4.4 1.9 6 1.2 1.4 1.7 2.9 1.7 4.7C19 17.8 15.9 21 12 21Z" />
    <path d="M12 21c-1.7 0-3-1.3-3-3 0-1.9 1.6-2.8 2.3-4.4.9 1 2.2 1.6 2.9 2.8.5.8.8 1.4.8 2.1 0 1.4-1.3 2.5-3 2.5Z" />
  </Icon>
);

export const SnowflakeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5" />
    <path d="m9.5 4 2.5 2 2.5-2M9.5 20l2.5-2 2.5 2M4 10.6l3.1-.5-.9-3M20 13.4l-3.1.5.9 3M4 13.4l3.1.5-.9 3M20 10.6l-3.1-.5.9-3" />
  </Icon>
);

export const ChatIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 12.5a7.5 7.5 0 0 1-11 6.6L4 20l1-4.4A7.5 7.5 0 1 1 20 12.5Z" />
    <path d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01" />
  </Icon>
);

export const CoffeeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z" />
    <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v2M12 3v2" />
  </Icon>
);

export const ReplyIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5A5.5 5.5 0 0 1 20 14.5 5.5 5.5 0 0 1 14.5 20H11" />
  </Icon>
);

export const FileTextIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Icon>
);

export const SendIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M21 3 10 14M21 3l-7 18-4-7-7-4Z" />
  </Icon>
);

export const ShareIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </Icon>
);

export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="8" y="8" width="12" height="12" rx="2.5" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Icon>
);

export const TimerIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 9.5v4l2.5 2M10 2.5h4M19 6l1.5-1.5" />
  </Icon>
);

export const BookIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
    <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7.5h8" />
  </Icon>
);

export const MicIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </Icon>
);

export const ShuffleIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const RefreshIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 11a8 8 0 0 0-14.7-4.4L4 8M4 3.5V8h4.5M4 13a8 8 0 0 0 14.7 4.4L20 16M20 20.5V16h-4.5" />
  </Icon>
);

export const CodeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />
  </Icon>
);

export const DotsIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="5" cy="12" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <circle cx="19" cy="12" r="1.3" fill="currentColor" />
  </Icon>
);
