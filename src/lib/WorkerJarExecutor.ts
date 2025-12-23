import { Worker } from "worker_threads";
import path from "path";
import { JarWrokerExecuterOptions } from "./types";

export class WorkerJarExecutor {
  worker: Worker | null = null;
  #resolveIsRunning: [(value: any) => void] = [] as any;

  start(options: JarWrokerExecuterOptions) {
    return new Promise((resolve, reject) => {
      try {
        const onMessage = options.onMessage;
        delete options.onMessage;
        this.worker = new Worker(
          path.resolve(path.dirname(__filename), "./JarWorkerThread.js"),
          {
            workerData: { options },
          }
        );

        this.worker.on("message", (msg) => {
          switch (msg.type) {
            case "ready":
              resolve(true);
              break;
            case "isRunning":
              this.#resolveIsRunning.pop()?.(msg.data);
              break;
            default:
              onMessage?.(msg);
          }
        });

        this.worker.on("error", reject);

        this.worker.on("exit", (code) => {
          if (code !== 0) {
            console.log("Worker thread is close code:", code);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async isRunning(): Promise<boolean> {
    return new Promise((resolve) => {
      this.worker?.postMessage({ action: "isRunning" });
      this.#resolveIsRunning.push(resolve);
    });
  }

  stop() {
    this.worker?.postMessage({ action: "stop" });
    this.worker?.terminate();
  }
}
