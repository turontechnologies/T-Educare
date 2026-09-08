import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">T-Educare</h1>
      <p className="text-muted-foreground max-w-md">
        School management platform — frontend scaffold ready. Start building
        features in <code>src/app</code>.
      </p>
      <Button>Get started</Button>
    </main>
  );
}
