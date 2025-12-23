import { Worker } from "worker_threads";
import path from "path";
import { JarWrokerExecuterOptions } from "./types";

export class WorkerJarExecutor {
  worker: Worker | null = null;

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

  stop() {
    this.worker?.postMessage({ action: "stop" });
    this.worker?.terminate();
  }
}
