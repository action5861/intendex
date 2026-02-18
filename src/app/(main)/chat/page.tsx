import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/common/header";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex flex-col h-full">
      <Header title="AI 채팅" />
      <ChatInterface userId={session.user.id} />
    </div>
  );
}
