import { getArchive } from "@/lib/challenges";
import { StatsView } from "@/components/stats-view";

export const revalidate = 60;

export default async function StatsPage() {
  const challenges = await getArchive();
  return <StatsView challenges={challenges} />;
}
