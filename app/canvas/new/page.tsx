import { createProjectAndRedirect } from "@/app/actions/projects";

export default async function NewCanvasPage() {
  await createProjectAndRedirect();
}
