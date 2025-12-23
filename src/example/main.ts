import { Gateway } from "../lib/gateway";
import { JarExecutor } from "../lib/JarExecutor";
import { WorkerJarExecutor } from "../lib/WorkerJarExecutor";

/**
 * This is the main entry point for the example.
 * It demonstrates how to connect to a Java Virtual Machine (JVM)
 * using the JavaGateway and interact with Java objects.
 */
async function main() {
  /* const executeJar = new JarExecutor({
    jarPath: "src/example/sampleJavaNode-1.0-SNAPSHOT.jar",
    javaOpts: ["-Xmx512m"],
    readySignal: "server is started of spark java bridge...",
    timeoutMs: 5000,
    restartOnCrash: true,
    maxRestarts: 3,
  });
  executeJar.on("stdout", console.warn);
  await executeJar.start();*/
  const workerExecuterJar = new WorkerJarExecutor();
  await workerExecuterJar.start({
    jarPath: "src/example/sampleJavaNode-1.0-SNAPSHOT.jar",
    javaOpts: ["-Xmx512m"],
    readySignal: "server is started of spark java bridge...",
    timeoutMs: 5000,
    restartOnCrash: true,
    maxRestarts: 3,
    onMessage: (message) => {
      switch (message.type) {
        case "stdout":
          console.log("stdout", JSON.stringify(message.data));
          break;
        case "stderr":
          console.error("stderr", message.data);
          break;
        case "exit":
          console.error("exit", message.data);
          break;
        case "shutdown":
          console.log("shutdown", message.data);
          break;
        case "ready":
          console.log("is ready", message.data);
          break;
        default:
          console.log("default message type", message);
          break;
      }
    },
  });
  console.log("isRunning check : ", await workerExecuterJar.isRunning());
  const myJava = new Gateway({
    host: "127.0.0.1",
    port: 25333,
  });
  //start initial time checkpoint.
  const startTime = process.hrtime();
  const stack = await myJava.entryPoint.getStack();
  await stack.push("main");
  await stack.push("Second item");
  const popValue = await stack.pop();
  console.log("pop value : " + popValue);
  const random = await myJava.jvm.java.util.Random();
  const number1 = await random.nextInt(10);
  const number2 = await random.nextInt(10);
  const system = await myJava.jvm.System;
  const currentTime = await system.currentTimeMillis();
  //take diffrence in milliseconds.
  const endTime = process.hrtime(startTime);
  const timeInMs = endTime[0] * 1000 + endTime[1] / 1000000;
  console.log(`Execution time: ${timeInMs} ms`);
  console.log("Current time in ms : " + currentTime);
  console.log(`Generated numbers are: ${number1} and ${number2}`);
  workerExecuterJar.stop();
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
