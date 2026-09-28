import { useCallback, useRef, useState } from "react";

import type { GeneratorPreviewItem } from "@/api/codegen";

/** 写入范围 */
export type WriteScope = "all" | "frontend" | "backend";

/** 同名文件的覆盖策略 */
export type OverwriteMode = "overwrite" | "skip" | "ifChanged";

/** File System Access API 的最小类型声明 */
interface FsWritable {
  write: (data: string | Blob) => Promise<void>;
  close: () => Promise<void>;
}

interface FsFileHandle {
  getFile: () => Promise<File>;
  createWritable: () => Promise<FsWritable>;
}

interface FsDirectoryHandle {
  name: string;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FsDirectoryHandle>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FsFileHandle>;
}

interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<unknown>;
}

/** 是否支持本地写入 */
export function supportsLocalWrite(): boolean {
  return typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function";
}

/** 单次写入的进度 */
export interface WriteProgress {
  total: number;
  done: number;
  /** 当前正在写入的文件名 */
  current: string;
}

/** 并发写入的通道数：目录里文件不多，4 路足够且不会打满句柄 */
const CONCURRENCY = 4;

/** 把预览文件路径转成用户选定目录里的相对路径 */
function toRelativePath(file: GeneratorPreviewItem, appNames: string[]): string {
  let path = `${file.path}/${file.fileName}`.replace(/^\/+/, "");

  appNames.filter(Boolean).forEach((appName) => {
    if (path.startsWith(`${appName}/`)) path = path.slice(appName.length + 1);
  });

  const srcIndex = path.indexOf("/src/");
  if (srcIndex > 0) path = path.slice(srcIndex + 1);

  return path;
}

/** 按覆盖策略决定是否需要写入 */
async function resolveWrite(
  target: FsDirectoryHandle,
  fileName: string,
  content: string,
  mode: OverwriteMode
): Promise<{ skip: boolean; handle: FsFileHandle }> {
  if (mode === "overwrite") {
    return { skip: false, handle: await target.getFileHandle(fileName, { create: true }) };
  }

  try {
    const handle = await target.getFileHandle(fileName);
    const existing = await handle.getFile();
    const same = (await existing.text()) === content;
    return { skip: mode === "skip" || same, handle };
  } catch {
    // 文件不存在，走新建
    return { skip: false, handle: await target.getFileHandle(fileName, { create: true }) };
  }
}

/**
 * 写入本地目录
 * 不经过后端；不支持该 API 的浏览器只能退回下载 ZIP
 */
export function useLocalWrite() {
  const frontendDirRef = useRef<FsDirectoryHandle | null>(null);
  const backendDirRef = useRef<FsDirectoryHandle | null>(null);

  const [frontendName, setFrontendName] = useState("");
  const [backendName, setBackendName] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<WriteProgress>({ total: 0, done: 0, current: "" });

  /** 选择前端或后端目录 */
  const pickDirectory = useCallback(async (target: "frontend" | "backend") => {
    const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
    if (!picker) return false;

    try {
      const handle = (await picker({ mode: "readwrite" })) as FsDirectoryHandle;
      if (target === "frontend") {
        frontendDirRef.current = handle;
        setFrontendName(handle.name);
      } else {
        backendDirRef.current = handle;
        setBackendName(handle.name);
      }
      return true;
    } catch {
      // 用户取消选择，不算失败
      return false;
    }
  }, []);

  /**
   * 执行写入
   * @param files 预览产出的全部文件
   * @param options 写入范围、覆盖策略与项目名（用于剥路径前缀）
   */
  const writeFiles = useCallback(
    async (
      files: GeneratorPreviewItem[],
      options: {
        scope: WriteScope;
        overwriteMode: OverwriteMode;
        frontendAppName?: string;
        backendAppName?: string;
      }
    ) => {
      const { scope, overwriteMode, frontendAppName, backendAppName } = options;
      const root = scope === "frontend" ? frontendDirRef.current : backendDirRef.current;

      if (scope !== "all" && !root) {
        return { ok: false as const, reason: "missing-dir" as const };
      }

      const targets = files.filter((file) => scope === "all" || file.scope === scope);
      const queue = [...targets];
      const failed: string[] = [];
      const appNames = [frontendAppName ?? "", backendAppName ?? ""];

      let done = 0;
      setRunning(true);
      setProgress({ total: targets.length, done: 0, current: "" });

      /** 取该文件应该写入的根目录 */
      function rootFor(file: GeneratorPreviewItem) {
        return file.scope === "frontend" ? frontendDirRef.current : backendDirRef.current;
      }

      async function worker() {
        while (queue.length) {
          const file = queue.shift();
          if (!file) break;

          const targetRoot = rootFor(file);
          try {
            if (!targetRoot) throw new Error("missing-directory");

            // 逐级创建目录后再写文件
            const segments = toRelativePath(file, appNames).split("/").filter(Boolean);
            const fileName = segments.pop() as string;
            let dir = targetRoot;
            for (const segment of segments) {
              dir = await dir.getDirectoryHandle(segment, { create: true });
            }

            const { skip, handle } = await resolveWrite(dir, fileName, file.content, overwriteMode);
            if (!skip) {
              const writable = await handle.createWritable();
              await writable.write(file.content);
              await writable.close();
            }
          } catch {
            failed.push(file.fileName);
          } finally {
            done += 1;
            setProgress({ total: targets.length, done, current: file.fileName });
          }
        }
      }

      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
      setRunning(false);

      return { ok: true as const, failed, total: targets.length };
    },
    []
  );

  /** 清空已选目录（关闭弹窗时调用） */
  const reset = useCallback(() => {
    frontendDirRef.current = null;
    backendDirRef.current = null;
    setFrontendName("");
    setBackendName("");
    setProgress({ total: 0, done: 0, current: "" });
  }, []);

  return {
    supports: supportsLocalWrite(),
    frontendName,
    backendName,
    running,
    progress,
    pickDirectory,
    writeFiles,
    reset,
  };
}
