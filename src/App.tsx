import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAppStore } from "./store/useAppStore";
import { seedIfNeeded } from "./data/seed";
import { CategoryPicker } from "./features/onboarding/CategoryPicker";
import { Feed } from "./features/feed/Feed";

const Settings = lazy(() => import("./features/settings/Settings"));

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="h-[100dvh] w-screen bg-zinc-950 flex md:items-center md:justify-center md:p-4 overflow-hidden">
    <div className="relative w-full h-full md:w-[min(440px,100%)] md:h-[min(860px,100%)] bg-bg md:rounded-[28px] md:overflow-hidden md:border md:border-zinc-800 md:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
      {children}
    </div>
  </div>
);

function App() {
  const selectedCategories = useAppStore((s) => s.selectedCategories);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    seedIfNeeded()
      .then(() => setSeeded(true))
      .catch((err) => setSeedError(String(err)));
  }, []);

  if (seedError) {
    return (
      <Frame>
        <div className="absolute inset-0 flex items-center justify-center text-rose-300 px-6 text-sm">
          Lỗi load dữ liệu: {seedError}
        </div>
      </Frame>
    );
  }

  if (!seeded) {
    return (
      <Frame>
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
          Đang chuẩn bị từ vựng...
        </div>
      </Frame>
    );
  }

  if (!selectedCategories) {
    return (
      <Frame>
        <CategoryPicker onDone={() => undefined} />
      </Frame>
    );
  }

  return (
    <Frame>
      <Feed onOpenSettings={() => setSettingsOpen(true)} />
      <AnimatePresence>
        {settingsOpen && (
          <Suspense fallback={null}>
            <Settings onClose={() => setSettingsOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </Frame>
  );
}

export default App;
