import type { Meta, StoryObj } from "@storybook/react-vite";

import { ZenosBootSplash } from "./ZenosBootSplash";

const meta: Meta<typeof ZenosBootSplash> = {
  title: "Primitives/Core/ZenosBootSplash",
  component: ZenosBootSplash,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ZenosBootSplash>;

export const Default: Story = {
  render: () => <ZenosBootSplash />,
};

export const InContext: Story = {
  render: () => (
    <div className="relative min-h-screen">
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-gray-900">App Header</span>
          <nav className="flex gap-4">
            <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
          </nav>
        </div>
      </header>
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to the App</h1>
          <p className="text-gray-600">The splash screen will show on initial load.</p>
        </div>
      </main>
      <ZenosBootSplash />
    </div>
  ),
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ZenosBootSplash</h2>
        <p className="text-gray-600">
          High-fidelity corporate splash loader featuring a pulsing geometric gradient,
          dynamic SVG spinning tech ring, and absolute zero layout-shifting during initial hydrations.
        </p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Fixed position, full-screen overlay</li>
          <li>Pulsing ambient glow animation</li>
          <li>Spinning SVG tech ring</li>
          <li>High z-index (system level)</li>
          <li>Zero layout shift during hydration</li>
          <li>Matches index.html inline bootloader</li>
        </ul>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Usage</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`import { ZenosBootSplash } from '@/shared/ui';

// In your root layout or App.tsx
export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <ZenosBootSplash />
    </>
  );
}

// Or conditionally show during initial load
export function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Initialize app, then hide splash
    initializeApp().then(() => setIsLoading(false));
  }, []);
  
  return (
    <>
      {isLoading && <ZenosBootSplash />}
      <AppContent />
    </>
  );
}`}</code></pre>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Live Preview</h3>
        <div className="relative h-64 bg-slate-950 rounded-lg overflow-hidden">
          <ZenosBootSplash />
        </div>
      </div>
    </div>
  ),
};

export const DarkThemeOnly: Story = {
  render: () => (
    <div className="dark min-h-screen">
      <ZenosBootSplash />
    </div>
  ),
};