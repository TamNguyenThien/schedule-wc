import MatchDetailPage from "@/components/MatchDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatchDetailPage matchId={id} />;
}
