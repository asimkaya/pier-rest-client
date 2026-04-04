import type { Component } from "solid-js";

const App: Component = () => {
  return (
    <div class="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tight">
          <span class="text-primary">Volt</span> API Client
        </h1>
        <p class="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default App;
