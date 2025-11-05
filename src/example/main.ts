import { Gateway } from "../lib/gateway";

/**
 * This is the main entry point for the example.
 * It demonstrates how to connect to a Java Virtual Machine (JVM)
 * using the JavaGateway and interact with Java objects.
 */
async function main() {
  const myJava = new Gateway(new Object());
  console.log(JSON.stringify(await myJava.jvm.java.util.Random(22, 33)));

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
