import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { ProgressModal } from "./ProgressModal";

const meta: Meta<typeof ProgressModal> = {
  title: "Primitives/Table/ProgressModal",
  component: ProgressModal,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ProgressModal>;

const ProgressContent = ({ status, progress, title, close }: any) => (
  <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4">
    <div className="text-center mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-gray-500">{Math.round(progress)}%</p>
    </div>
    <div className="text-center text-sm text-gray-600">
      {status === "completed" && "Operation completed successfully!"}
      {status === "failed" && "Operation failed. Please try again."}
      {status === "processing" && "Processing your data..."}
      {status === "uploading" && "Uploading files..."}
      {status === "pending" && "Waiting to start..."}
      {status === "queued" && "Queued for processing..."}
    </div>
    {(status === "completed" || status === "failed") && (
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={close}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    )}
  </div>
);

export const Processing: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [progress, setProgress] = useState(0);
    
    React.useEffect(() => {
      if (!isOpen) return;
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }, [isOpen]);
    
    return (
      <ProgressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status="processing"
        progress={progress}
        title="Processing Data"
        dismissable={false}
      >
        {ProgressContent}
      </ProgressModal>
    );
  },
};

export const Uploading: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [progress, setProgress] = useState(0);
    
    React.useEffect(() => {
      if (!isOpen) return;
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + 15;
        });
      }, 300);
      return () => clearInterval(interval);
    }, [isOpen]);
    
    return (
      <ProgressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status="uploading"
        progress={progress}
        title="Uploading Files"
        dismissable={false}
      >
        {ProgressContent}
      </ProgressModal>
    );
  },
};

export const Completed: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <ProgressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status="completed"
        progress={100}
        title="Complete"
      >
        {ProgressContent}
      </ProgressModal>
    );
  },
};

export const Failed: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <ProgressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status="failed"
        progress={0}
        title="Failed"
      >
        {ProgressContent}
      </ProgressModal>
    );
  },
};

export const Pending: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <ProgressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status="pending"
        progress={0}
        title="Pending"
      >
        {ProgressContent}
      </ProgressModal>
    );
  },
};

export const Queued: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <ProgressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status="queued"
        progress={0}
        title="Queued"
      >
        {ProgressContent}
      </ProgressModal>
    );
  },
};

export const WithCustomLabels: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("processing" as any);
    
    React.useEffect(() => {
      if (!isOpen) return;
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setStatus("completed");
            return 100;
          }
          return p + 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }, [isOpen]);
    
    return (
      <ProgressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status={status}
        progress={progress}
        labels={{
          titleProcessing: "Importing Records...",
          titleComplete: "Import Successful!",
          titleFailed: "Import Failed",
        }}
      >
        {ProgressContent}
      </ProgressModal>
    );
  },
};

export const Dismissable: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [progress, setProgress] = useState(0);
    
    React.useEffect(() => {
      if (!isOpen) return;
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }, [isOpen]);
    
    return (
      <ProgressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status="processing"
        progress={progress}
        title="Processing (Dismissable)"
        dismissable={true}
      >
        {ProgressContent}
      </ProgressModal>
    );
  },
};

export const NotDismissable: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [progress, setProgress] = useState(0);
    
    React.useEffect(() => {
      if (!isOpen) return;
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }, [isOpen]);
    
    return (
      <ProgressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status="processing"
        progress={progress}
        title="Processing (Not Dismissable)"
        dismissable={false}
      >
        {ProgressContent}
      </ProgressModal>
    );
  },
};

export const FullFlow: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState("pending" as any);
    const [progress, setProgress] = useState(0);
    
    const start = () => {
      setIsOpen(true);
      setStatus("pending");
      setProgress(0);
      
      setTimeout(() => setStatus("uploading"), 500);
      setTimeout(() => setStatus("processing"), 1500);
      
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setStatus("completed");
            return 100;
          }
          return p + 5;
        });
      }, 100);
    };
    
    return (
      <>
        <button
          onClick={start}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg"
        >
          Start Full Flow
        </button>
        {isOpen && (
          <ProgressModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            status={status}
            progress={progress}
            dismissable={status !== "completed" && status !== "failed"}
          >
            {ProgressContent}
          </ProgressModal>
        )}
      </>
    );
  },
};

export const WithErrorDetails: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <ProgressModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        status="failed"
        progress={0}
        title="Import Failed"
      >
        {({ status, progress, title, close }) => (
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Row 5: Invalid email format</li>
                <li>• Row 12: Duplicate entry</li>
                <li>• Row 23: Required field missing</li>
              </ul>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={close}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={close}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </ProgressModal>
    );
  },
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ProgressModal</h2>
        <p className="text-gray-600">
          Headless modal container for task progress with render props.
          Handles overlay, dismiss prevention during processing, and keyboard escape.
        </p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Status Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-4 rounded border"><code>pending</code> - Waiting to start</div>
          <div className="bg-white p-4 rounded border"><code>queued</code> - Queued for processing</div>
          <div className="bg-white p-4 rounded border"><code>uploading</code> - Uploading files</div>
          <div className="bg-white p-4 rounded border"><code>processing</code> - Actively processing</div>
          <div className="bg-white p-4 rounded border"><code>completed</code> - Finished successfully</div>
          <div className="bg-white p-4 rounded border"><code>failed</code> - Failed with errors</div>
        </div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Props</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`<ProgressModal
  isOpen={true}
  onClose={() => setOpen(false)}
  status="processing"
  progress={50}
  title="Importing..."
  dismissable={false}
>
  {({ status, progress, title, close }) => (
    <ModalContent status={status} progress={progress} title={title} close={close} />
  )}
</ProgressModal>`}</code></pre>
      </div>
    </div>
  ),
};