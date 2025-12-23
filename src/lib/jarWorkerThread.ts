// JarWorker.js

import { JarExecutor } from "./JarExecutor";
import { parentPort, workerData } from "worker_threads";

(async () => {
  const executor = new JarExecutor(workerData.options);
  if (parentPort != null) {
    parentPort.on("message", (msg) => {
      if (msg.action === "stop") {
        executor.kill("Worker stop command received");
      }
      if (msg.action === "isRunning") {
        if (parentPort)
          parentPort.postMessage({
            type: "isRunning",
            data: executor.isRunning(),
          });
      }
    });
    executor.on("stdout", (d) => {
      if (parentPort) parentPort.postMessage({ type: "stdout", data: d });
    });
    executor.on("stderr", (d) => {
      if (parentPort) parentPort.postMessage({ type: "stderr", data: d });
    });
    executor.on("ready", () => {
      if (parentPort) parentPort.postMessage({ type: "ready" });
    });
    executor.on("exit", (code) => {
      if (parentPort) parentPort.postMessage({ type: "exit", code });
    });
    executor.on("shutdown", (reason) => {
      if (parentPort) parentPort.postMessage({ type: "shutdown", reason });
    });
  }
  await executor.start();
})();
