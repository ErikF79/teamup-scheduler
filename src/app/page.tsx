import Scheduler from "@/components/teamup/Scheduler";
import { Header } from "@/components/teamup/Header";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <Scheduler />
    </div>
  );
}
