import { SupportShell } from "@/components/support/SupportShell";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SupportShell>{children}</SupportShell>;
}
