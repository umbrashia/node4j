import { Gateway } from "../lib/gateway";

/**
 * This is the main entry point for the example.
 * It demonstrates how to connect to a Java Virtual Machine (JVM)
 * using the JavaGateway and interact with Java objects.
 */
async function main() {
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
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
