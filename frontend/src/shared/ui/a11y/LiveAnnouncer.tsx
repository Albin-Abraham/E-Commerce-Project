import React, { useEffect, useState } from "react";

type AnnouncePriority = "polite" | "assertive";

interface Announcement {
  id: number;
  message: string;
  priority: AnnouncePriority;
}

type AnnounceListener = (announcement: Announcement) => void;

class AnnouncerManager {
  private listeners = new Set<AnnounceListener>();
  private idCounter = 0;

  subscribe(listener: AnnounceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  announce(message: string, priority: AnnouncePriority = "polite"): void {
    if (!message) return;
    const announcement: Announcement = {
      id: ++this.idCounter,
      message,
      priority,
    };
    this.listeners.forEach((listener) => listener(announcement));
  }
}

export const announcerManager = new AnnouncerManager();

/**
 * Global programmatic screen reader announcement helper.
 *
 * @param message - The announcement text.
 * @param priority - "polite" (default, doesn't interrupt speech) or "assertive" (interrupts immediately).
 */
export function announce(
  message: string,
  priority: AnnouncePriority = "polite"
): void {
  announcerManager.announce(message, priority);
}

/**
 * LiveAnnouncer Component
 *
 * Mounts dedicated ARIA live regions in the DOM for screen reader speech synthesis.
 */
export const LiveAnnouncer: React.FC = () => {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");

  useEffect(() => {
    return announcerManager.subscribe(({ message, priority }) => {
      if (priority === "assertive") {
        setAssertiveMessage(message);
      } else {
        setPoliteMessage(message);
      }
    });
  }, []);


  return (
    <div
      data-testid="live-announcer-root"
      aria-hidden="false"
      className="sr-only"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      <div
        id="live-announcer-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {politeMessage}
      </div>
      <div
        id="live-announcer-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {assertiveMessage}
      </div>
    </div>
  );
};

LiveAnnouncer.displayName = "LiveAnnouncer";
