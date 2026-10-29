import * as fs from "fs";
import * as path from "path";
import type {
  DiagnosticArtifact,
  ScreenshotOptions,
  ArtifactCollectionOptions,
  FailureArtifactOptions,
  ConsoleLogEntry,
  NetworkRequestEntry,
} from "../types";

const artifactStore = new Map<string, DiagnosticArtifact[]>();
const consoleLogs: ConsoleLogEntry[] = [];
const networkRequests: NetworkRequestEntry[] = [];

let originalConsole: Console | null = null;
let originalFetch: typeof fetch | null = null;

function getOutputDir(options: ArtifactCollectionOptions): string {
  return options.outputDir || path.join(process.cwd(), "test-results", "artifacts", options.testId);
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function startConsoleCapture(): void {
  if (originalConsole) return;
  
  originalConsole = { ...console };
  
  const levels: Array<"log" | "warn" | "error" | "info" | "debug"> = ["log", "warn", "error", "info", "debug"];
  
  for (const level of levels) {
    const original = console[level].bind(console);
    (console as any)[level] = (...args: any[]) => {
      consoleLogs.push({ level, args, timestamp: Date.now() });
      original(...args);
    };
  }
}

export function stopConsoleCapture(): ConsoleLogEntry[] {
  if (!originalConsole) return [];
  
  for (const level of ["log", "warn", "error", "info", "debug"] as const) {
    (console as any)[level] = originalConsole[level].bind(originalConsole);
  }
  
  originalConsole = null;
  const logs = [...consoleLogs];
  consoleLogs.length = 0;
  return logs;
}

export function getConsoleLogs(): ConsoleLogEntry[] {
  return [...consoleLogs];
}

export function clearConsoleLogs(): void {
  consoleLogs.length = 0;
}

export function startNetworkCapture(): void {
  if (originalFetch) return;
  
  originalFetch = globalThis.fetch.bind(globalThis);
  
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const start = Date.now();
    const url = input instanceof Request ? input.url : String(input);
    const method = input instanceof Request ? input.method : (init?.method || "GET");
    
    let headers: Record<string, string> = {};
    if (input instanceof Request) {
      input.headers.forEach((value, key) => { headers[key] = value; });
    } else if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => { headers[key] = value; });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => { headers[key] = value; });
      } else {
        headers = { ...init.headers as Record<string, string> };
      }
    }
    
    let body: string | undefined;
    if (input instanceof Request) {
      const cloned = input.clone();
      body = await cloned.text();
    } else if (init?.body) {
      body = typeof init.body === "string" ? init.body : JSON.stringify(init.body);
    }
    
    try {
      const response = await originalFetch!(input, init);
      const end = Date.now();
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => { responseHeaders[key] = value; });
      
      let responseBody: string | undefined;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json") || contentType?.includes("text/")) {
        const cloned = response.clone();
        responseBody = await cloned.text();
      }
      
      networkRequests.push({
        url,
        method,
        headers,
        body,
        response: {
          status: response.status,
          headers: responseHeaders,
          body: responseBody,
        },
        timing: { start, end, duration: end - start },
      });
      
      return response;
    } catch (error) {
      const end = Date.now();
      networkRequests.push({
        url,
        method,
        headers,
        body,
        timing: { start, end, duration: end - start },
      });
      throw error;
    }
  };
}

export function stopNetworkCapture(): NetworkRequestEntry[] {
  if (!originalFetch) return [];
  
  globalThis.fetch = originalFetch;
  originalFetch = null;
  const requests = [...networkRequests];
  networkRequests.length = 0;
  return requests;
}

export function getNetworkRequests(): NetworkRequestEntry[] {
  return [...networkRequests];
}

export function clearNetworkRequests(): void {
  networkRequests.length = 0;
}

export async function captureScreenshot(
  page: any, // Playwright Page or similar
  options: ScreenshotOptions = {}
): Promise<Buffer> {
  if (typeof page.screenshot === "function") {
    return page.screenshot({
      fullPage: options.fullPage ?? true,
      quality: options.quality,
      type: options.format ?? "png",
      clip: options.clip,
    });
  }
  
  if (typeof page.getScreenshot === "function") {
    return page.getScreenshot(options);
  }
  
  throw new Error("Page object does not support screenshot capture");
}

export async function captureTrace(
  context: any, // Playwright BrowserContext
  options: { name?: string } = {}
): Promise<Buffer> {
  if (typeof context.tracing?.startChunk === "function") {
    await context.tracing.startChunk({ name: options.name });
    const buffer = await context.tracing.stopChunk();
    return buffer;
  }
  
  if (typeof context.startTracing === "function") {
    await context.startTracing({ name: options.name });
    const buffer = await context.stopTracing();
    return buffer;
  }
  
  throw new Error("Context does not support trace capture");
}

export function captureDomSnapshot(
  container: HTMLElement,
  options: { includeStyles?: boolean; maxDepth?: number } = {}
): string {
  const { includeStyles = true, maxDepth = 10 } = options;
  
  function serializeNode(node: Node, depth: number): string {
    if (depth > maxDepth) return "";
    
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.trim() ? `TEXT: ${node.textContent.trim()}` : "";
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    const attrs: string[] = [];
    
    for (const attr of Array.from(element.attributes)) {
      if (attr.name !== "style" || includeStyles) {
        attrs.push(`${attr.name}="${attr.value}"`);
      }
    }
    
    const children = Array.from(element.childNodes)
      .map(child => serializeNode(child, depth + 1))
      .filter(Boolean)
      .join("\n");
    
    const indent = "  ".repeat(depth);
    const attrStr = attrs.length ? " " + attrs.join(" ") : "";
    
    return `${indent}<${tagName}${attrStr}>\n${children}\n${indent}</${tagName}>`;
  }
  
  return serializeNode(container, 0);
}

export function capturePageHtml(): string {
  return document.documentElement.outerHTML;
}

export function capturePageState(): Record<string, any> {
  return {
    url: window.location.href,
    title: document.title,
    readyState: document.readyState,
    scrollPosition: { x: window.scrollX, y: window.scrollY },
    viewportSize: { width: window.innerWidth, height: window.innerHeight },
    localStorage: { ...localStorage },
    sessionStorage: { ...sessionStorage },
    cookies: document.cookie,
    userAgent: navigator.userAgent,
  };
}

export function saveArtifact(
  artifact: DiagnosticArtifact,
  outputDir: string
): string {
  ensureDir(outputDir);
  
  const ext = getExtensionForType(artifact.type);
  const filename = `${artifact.name}_${artifact.timestamp}.${ext}`;
  const filepath = path.join(outputDir, filename);
  
  if (artifact.content instanceof Buffer) {
    fs.writeFileSync(filepath, artifact.content);
  } else if (artifact.content instanceof Uint8Array) {
    fs.writeFileSync(filepath, Buffer.from(artifact.content));
  } else {
    fs.writeFileSync(filepath, artifact.content);
  }
  
  return filepath;
}

function getExtensionForType(type: DiagnosticArtifact["type"]): string {
  switch (type) {
    case "screenshot": return "png";
    case "trace": return "zip";
    case "console": return "log";
    case "network": return "json";
    case "dom": return "html";
    case "json": return "json";
    case "html": return "html";
    case "text": return "txt";
    default: return "bin";
  }
}

export function collectTestArtifacts(
  options: ArtifactCollectionOptions
): DiagnosticArtifact[] {
  const artifacts: DiagnosticArtifact[] = [];
  const outputDir = getOutputDir(options);
  ensureDir(outputDir);
  
  const timestamp = Date.now();
  const testId = options.testId;
  
  if (options.collectConsole) {
    const logs = stopConsoleCapture();
    if (logs.length > 0) {
      const artifact: DiagnosticArtifact = {
        name: "console",
        type: "console",
        content: logs.map(l => `[${l.level.toUpperCase()}] ${l.args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")}`).join("\n"),
        timestamp,
        testId,
        metadata: { count: logs.length },
      };
      artifacts.push(artifact);
      saveArtifact(artifact, outputDir);
    }
  }
  
  if (options.collectNetwork) {
    const requests = stopNetworkCapture();
    if (requests.length > 0) {
      const artifact: DiagnosticArtifact = {
        name: "network",
        type: "network",
        content: JSON.stringify(requests, null, 2),
        timestamp,
        testId,
        metadata: { count: requests.length },
      };
      artifacts.push(artifact);
      saveArtifact(artifact, outputDir);
    }
  }
  
  if (options.collectDom) {
    const dom = capturePageHtml();
    const artifact: DiagnosticArtifact = {
      name: "dom",
      type: "html",
      content: dom,
      timestamp,
      testId,
    };
    artifacts.push(artifact);
    saveArtifact(artifact, outputDir);
  }
  
  artifactStore.set(testId, artifacts);
  return artifacts;
}

export function collectFailureArtifacts(
  options: FailureArtifactOptions
): DiagnosticArtifact[] {
  const artifacts: DiagnosticArtifact[] = [];
  const outputDir = options.outputDir || path.join(process.cwd(), "test-results", "failures", options.testName);
  ensureDir(outputDir);
  
  const timestamp = Date.now();
  const testId = options.testId;
  
  const errorArtifact: DiagnosticArtifact = {
    name: "error",
    type: "json",
    content: JSON.stringify({
      message: options.error.message,
      stack: options.error.stack,
      name: options.error.name,
      category: options.category,
    }, null, 2),
    timestamp,
    testId,
    metadata: { category: options.category },
  };
  artifacts.push(errorArtifact);
  saveArtifact(errorArtifact, outputDir);
  
  const logs = getConsoleLogs();
  if (logs.length > 0) {
    const artifact: DiagnosticArtifact = {
      name: "console",
      type: "console",
      content: logs.map(l => `[${l.level.toUpperCase()}] ${l.args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")}`).join("\n"),
      timestamp,
      testId,
    };
    artifacts.push(artifact);
    saveArtifact(artifact, outputDir);
  }
  
  const requests = getNetworkRequests();
  if (requests.length > 0) {
    const artifact: DiagnosticArtifact = {
      name: "network",
      type: "network",
      content: JSON.stringify(requests, null, 2),
      timestamp,
      testId,
    };
    artifacts.push(artifact);
    saveArtifact(artifact, outputDir);
  }
  
  const dom = capturePageHtml();
  const artifact: DiagnosticArtifact = {
    name: "dom",
    type: "html",
    content: dom,
    timestamp,
    testId,
  };
  artifacts.push(artifact);
  saveArtifact(artifact, outputDir);
  
  const pageState = capturePageState();
  const stateArtifact: DiagnosticArtifact = {
    name: "page-state",
    type: "json",
    content: JSON.stringify(pageState, null, 2),
    timestamp,
    testId,
  };
  artifacts.push(stateArtifact);
  saveArtifact(stateArtifact, outputDir);
  
  artifactStore.set(testId, artifacts);
  return artifacts;
}

export function getArtifacts(testId: string): DiagnosticArtifact[] {
  return artifactStore.get(testId) || [];
}

export function clearArtifacts(testId: string): void {
  artifactStore.delete(testId);
}

export function clearAllArtifacts(): void {
  artifactStore.clear();
}

export async function captureFailureSnapshot(
  page: any,
  context: any,
  options: FailureArtifactOptions
): Promise<DiagnosticArtifact[]> {
  const artifacts = collectFailureArtifacts(options);
  const outputDir = options.outputDir || path.join(process.cwd(), "test-results", "failures", options.testName);
  
  try {
    const screenshot = await captureScreenshot(page, { fullPage: true });
    const artifact: DiagnosticArtifact = {
      name: "screenshot",
      type: "screenshot",
      content: screenshot,
      timestamp: Date.now(),
      testId: options.testId,
    };
    artifacts.push(artifact);
    saveArtifact(artifact, outputDir);
  } catch (error) {
    console.warn("Failed to capture screenshot:", error);
  }
  
  try {
    const trace = await captureTrace(context, { name: options.testName });
    const artifact: DiagnosticArtifact = {
      name: "trace",
      type: "trace",
      content: trace,
      timestamp: Date.now(),
      testId: options.testId,
    };
    artifacts.push(artifact);
    saveArtifact(artifact, outputDir);
  } catch (error) {
    console.warn("Failed to capture trace:", error);
  }
  
  return artifacts;
}