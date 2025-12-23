// RobustJarExecutor.ts
import { spawn, ChildProcessByStdio } from "child_process";
import path from "path";
import EventEmitter from "events";
import Stream from "stream";
import { EventJarExecutor, JVMJarExeOptions } from "./types";

export class JarExecutor extends EventEmitter<EventJarExecutor> {
  private child: ChildProcessByStdio<
    null,
    Stream.Readable,
    Stream.Readable
  > | null = null;
  private restarts = 0;
  private ready = false;

  constructor(private options: JVMJarExeOptions) {
    super();
  }

  /** Launch JVM exactly like Py4J.launch_gateway(), but more robust */
  async start(): Promise<void> {
    const {
      jarPath,
      args = [],
      javaOpts = [],
      cwd = process.cwd(),
      env = process.env,
      readySignal = "Gateway",
      timeoutMs = 10000,
      restartOnCrash = false,
      maxRestarts = 3,
    } = this.options;

    const fullJarPath = path.resolve(jarPath);

    return new Promise((resolve, reject) => {
      const launchArgs = [...javaOpts, "-jar", fullJarPath, ...args];

      this.child = spawn("java", launchArgs, {
        cwd,
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      // console.log(this.child.spawnargs);
      this.ready = false;

      // Timeout logic
      const timeout = setTimeout(() => {
        if (!this.ready) {
          this.kill("JVM startup timeout");
          reject(new Error("JVM did not become ready before timeout"));
        }
      }, timeoutMs);

      // STDOUT handler
      this.child.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        if (this.listenerCount("stdout")) {
          this.emit("stdout", text);
        }

        if (!this.ready && text.includes(readySignal)) {
          this.ready = true;
          clearTimeout(timeout);
          this.emit("ready");
          resolve();
        }
      });

      // STDERR handler
      this.child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        this.emit("stderr", text);
      });

      this.child.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      this.child.on("exit", (code, signal) => {
        if (this.listenerCount("exit")) {
          this.emit("exit", code, signal);
        }

        if (!this.ready) return; // crash during startup

        if (restartOnCrash && this.restarts < maxRestarts) {
          this.restarts++;
          console.warn(
            `[Node4J] JVM crashed. Restarting (${this.restarts}/${maxRestarts})...`
          );
          this.start().catch(() => {});
        }
      });
    });
  }

  /** Graceful shutdown with fallback */
  kill(reason = "manual shutdown") {
    if (!this.child) return;

    this.emit("shutdown", reason);

    try {
      this.child.kill("SIGTERM");

      setTimeout(() => {
        if (this.child && !this.child.killed) {
          console.warn(
            "[Node4J] JVM did not shut down gracefully — force killing."
          );
          this.child.kill("SIGKILL");
        }
      }, 2000);
    } catch (e) {
      console.error("[Node4J] Error killing JVM:", e);
    }
  }

  /** Returns true if JVM is running */
  isRunning(): boolean {
    return !!this.child && !this.child.killed;
  }
}
