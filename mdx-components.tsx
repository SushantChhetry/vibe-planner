import type { MDXComponents } from "mdx/types";
import type { AnchorHTMLAttributes, DetailedHTMLProps } from "react";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    a: (
      props: DetailedHTMLProps<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        HTMLAnchorElement
      >
    ) => (
      <a
        className="rounded font-medium text-teal-800 underline decoration-teal-600/35 underline-offset-[3px] transition hover:bg-teal-600/8 hover:text-teal-900 hover:decoration-teal-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="rounded-md border border-stone-200/80 bg-stone-50 px-1.5 py-0.5 font-mono text-[0.88em] text-stone-800 before:hidden after:hidden"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="overflow-x-auto rounded-xl border border-stone-200/90 bg-gradient-to-br from-white to-stone-50/80 p-4 text-sm leading-relaxed text-stone-800 shadow-inner shadow-stone-900/5"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="rounded-r-lg border-l-[3px] border-teal-600 bg-teal-50/35 py-1 pl-4 pr-3 not-italic text-stone-700 [&>p]:my-2"
        {...props}
      />
    ),
    hr: (props) => (
      <hr
        className="my-10 border-0 border-t border-stone-200/90"
        {...props}
      />
    ),
  };
}
