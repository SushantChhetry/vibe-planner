import Image from "next/image";

const SLACK_HREF =
  "https://pumi.slack.com/archives/C0AQMHU3KPS";

type SlackCommunityLinkProps = {
  className?: string;
  /** Compact height to match header nav pills */
  dense?: boolean;
};

export function SlackCommunityLink({
  className = "",
  dense = false,
}: SlackCommunityLinkProps) {
  const size = dense ? 18 : 22;
  const padding = dense
    ? "h-9 px-3"
    : "px-4 py-2.5 sm:px-4 sm:py-2.5";
  return (
    <a
      href={SLACK_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-lg border border-stone-200/90 bg-white/80 text-sm font-medium text-stone-700 shadow-sm shadow-stone-900/5 transition hover:border-teal-200 hover:bg-teal-50/60 hover:text-teal-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${padding} ${className}`}
    >
      <Image
        src="/images/slack.svg"
        alt=""
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden
      />
      <span>Join Slack for feature requests and more</span>
    </a>
  );
}
