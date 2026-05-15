import { getArchive } from "@/lib/challenges";
import { ArchiveView } from "@/components/archive-view";

export const revalidate = 60;

export default async function ArchivePage() {
  const challenges = await getArchive();
  return <ArchiveView challenges={challenges} />;
}
