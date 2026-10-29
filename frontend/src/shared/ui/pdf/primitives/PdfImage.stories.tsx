import type { Meta, StoryObj } from "@storybook/react-vite";

import { PdfImage } from "./PdfImage";

const meta: Meta<typeof PdfImage> = {
  title: "Primitives/PDF/PdfImage",
  component: PdfImage,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PdfImage>;

const placeholderSvg = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
  <rect width="200" height="150" fill="#e5e7eb"/>
  <text x="100" y="75" font-family="Arial" font-size="14" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">Placeholder Image</text>
</svg>
`)}`;

export const Default: Story = {
  args: {
    src: placeholderSvg,
    width: 200,
    height: 150,
  },
};

export const ContainFit: Story = {
  args: {
    src: placeholderSvg,
    width: 300,
    height: 200,
    fit: "contain",
  },
};

export const CoverFit: Story = {
  args: {
    src: placeholderSvg,
    width: 300,
    height: 150,
    fit: "cover",
  },
};

export const WithRadius: Story = {
  args: {
    src: placeholderSvg,
    width: 200,
    height: 150,
    radius: 8,
  },
};

export const Rounded: Story = {
  args: {
    src: placeholderSvg,
    width: 150,
    height: 150,
    radius: 75,
  },
};

export const SmallThumbnail: Story = {
  args: {
    src: placeholderSvg,
    width: 64,
    height: 64,
    radius: 4,
  },
};

export const LargeImage: Story = {
  args: {
    src: placeholderSvg,
    width: 500,
    height: 300,
  },
};

export const LogoStyle: Story = {
  args: {
    src: placeholderSvg,
    width: 120,
    height: 120,
    fit: "contain",
  },
};

export const BannerStyle: Story = {
  args: {
    src: placeholderSvg,
    width: 500,
    height: 100,
    fit: "cover",
  },
};

export const InCard: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <PdfImage
          src={placeholderSvg}
          width={300}
          height={180}
          fit="cover"
          radius={8}
        />
        <div className="mt-4">
          <h3 className="font-semibold text-gray-900">Card Title</h3>
          <p className="text-gray-600 text-sm mt-1">Description for the card with image</p>
        </div>
      </div>
    </div>
  ),
};

export const InGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <PdfImage src={placeholderSvg} width={200} height={120} fit="cover" radius={4} />
        <h4 className="font-medium text-gray-900 mt-2">Image 1</h4>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <PdfImage src={placeholderSvg} width={200} height={120} fit="cover" radius={4} />
        <h4 className="font-medium text-gray-900 mt-2">Image 2</h4>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <PdfImage src={placeholderSvg} width={200} height={120} fit="cover" radius={4} />
        <h4 className="font-medium text-gray-900 mt-2">Image 3</h4>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <PdfImage src={placeholderSvg} width={200} height={120} fit="cover" radius={4} />
        <h4 className="font-medium text-gray-900 mt-2">Image 4</h4>
      </div>
    </div>
  ),
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PdfImage</h2>
        <p className="text-gray-600">
          Image display primitive for PDF generation. Wraps @react-pdf/renderer Image
          with safe defaults and theme integration.
        </p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Props</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`interface PdfImageProps {
  src: string;           // Image URL or data URI
  width?: number;        // Width in points
  height?: number;       // Height in points
  fit?: "contain" | "cover";  // Object fit mode
  radius?: number;       // Border radius in points
}`}</code></pre>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Usage</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`import { PdfImage } from '@/shared/ui/pdf/primitives';

<PdfImage
  src="https://example.com/logo.png"
  width={120}
  height={60}
  fit="contain"
/>

// With rounded corners
<PdfImage
  src="https://example.com/photo.jpg"
  width={200}
  height={200}
  radius={100}  // Circle
/>

// In a card
<PdfBox variant="card" padding="md">
  <PdfImage src="..." width={300} height={180} fit="cover" radius={8} />
  <PdfText variant="h3" bold>Card Title</PdfText>
</PdfBox>`}</code></pre>
      </div>
    </div>
  ),
};