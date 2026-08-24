import { createFileRoute } from "@tanstack/react-router";
import { SheafApp } from "@/components/sheaf/SheafApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SheafApp />;
}
