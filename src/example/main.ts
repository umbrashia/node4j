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
  const random = await myJava.jvm.java.util.Random();
  const number1 = await random.nextInt(10);
  const number2 = await random.nextInt(10);
  const currentTime = await myJava.jvm.System.currentTimeMillis();
  //take diffrence in milliseconds.
  const endTime = process.hrtime(startTime);
  const timeInMs = endTime[0] * 1000 + endTime[1] / 1000000;
  console.log(`Execution time: ${timeInMs} ms`);
  console.log(currentTime);
  console.log(`Generated numbers are: ${number1} and ${number2}`);
  try {
    // 2. Get a reference to the java.util.Random class and create a new instance.
    // Every interaction with the JVM is asynchronous, so we use 'await'.
    // console.log("Creating a java.util.Random instance...");
    // const Random = await gateway.jvm.java.util.Random;
    // const random = await Random.new();
    // // 3. Call methods on the Java object.
    // const number1 = await random.nextInt(10);
    // const number2 = await random.nextInt(10);
    // console.log(`Generated numbers are: ${number1} and ${number2}`);
  } finally {
    // 4. Shutdown the gateway connection.
    // gateway.shutdown();
    // console.log("Gateway shut down.");
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
