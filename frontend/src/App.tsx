import { UrlShortenerForm } from "./components/url-shortener-form";
import { Toaster } from "sonner";
import { BackgroundRippleEffect } from "./components/ui/background-ripple-effect";

function App() {
  return (
    <main className="dark bg-neutral-800 min-h-screen flex flex-col items-center justify-center p-4 font-mono">
      <BackgroundRippleEffect />
      <div className="text-center mb-8 relative">
        <h1 className="-mt-35 font-bold tracking-tight text-8xl md:text-9xl text-yellow-100/90 animate-in fade-in slide-in-from-top-3 duration-700 dm-serif-text-regular relative z-10">
          Pathly
        </h1>
        <p className="mt-3 text-stone-400 animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
          Your modern URL shortener with analytics.
        </p>
      </div>
      <UrlShortenerForm/>
      <Toaster theme="dark" position="bottom-right" />
    </main>
  );
}

export default App;