import { getTodaysChallenge } from "@/lib/challenges";
import { TodayView } from "@/components/today-view";
import { EmptyState } from "@/components/empty-state";

export const revalidate = 60;

export default async function TodayPage() {
  const challenge = await getTodaysChallenge();
  if (!challenge) {
    return (
      <EmptyState
        title="No challenge yet"
        body="The first Picks Daily play hasn't been published. Check back soon."
      />
    );
  }
  return <TodayView challenge={challenge} />;
}
