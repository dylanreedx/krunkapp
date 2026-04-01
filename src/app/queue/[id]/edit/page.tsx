import { redirect } from "next/navigation";

import { getSession } from "@/server/better-auth/server";
import { HydrateClient, api } from "@/trpc/server";
import { QueueEditor } from "./_components/queue-editor";

export default async function QueueEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { id } = await params;

  // Prefetch queue data
  void api.queue.getById.prefetch({ queueId: id });
  void api.queue.listFriends.prefetch();

  return (
    <HydrateClient>
      <QueueEditor queueId={id} userId={session.user.id} />
    </HydrateClient>
  );
}
