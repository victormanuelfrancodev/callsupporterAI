import { ClassificationEditor } from "@/components/settings/classification-editor";
import { requireWorkspace } from "@/lib/auth";
import { saveClassification } from "../actions";

export default async function ClassificationSettings(props: PageProps<"/w/[slug]/settings/classification">) {
  const { slug } = await props.params;
  const { workspace } = await requireWorkspace(slug);
  return <ClassificationEditor initial={workspace.config.classification} save={saveClassification.bind(null, slug)} />;
}
