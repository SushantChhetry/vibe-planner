import { SupportShell } from "@/components/support/SupportShell";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SupportShell>{children}</SupportShell>;
}
