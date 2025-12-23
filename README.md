# Node4J

Node4J is a Node.js library that allows you to interact with Java objects as if they were native TypeScript/JavaScript objects. It acts as a bridge, enabling seamless communication between a Node.js application and a Java Virtual Machine (JVM). This project is heavily inspired by the Python library `Py4J`.

## Features

- **Connect to a running JVM**: Establish a connection to a Java application running a `GatewayServer`.
- **Execute JAR files**: Launch and manage Java JAR files directly from Node.js using worker threads.
- **Interact with Java Objects**: Call methods and access properties on Java objects directly from Node.js.
- **Asynchronous API**: All interactions with the JVM are asynchronous, returning Promises for modern `async/await` syntax.
- **Access Static Members**: Access static classes and methods, like `System.out.println`.
- **Create Java Objects**: Instantiate new Java objects from your Node.js code.

## Installation

```bash
npm install node4j
```

## Getting Started

Using Node4J involves two parts: a Java application that acts as the server and a Node.js application that acts as the client.

### Option 1: Connect to an Existing JVM Gateway Server

#### 1. The Java Side (Server)

Your Java application needs to run a `GatewayServer` to expose an entry point object to Node.js clients. This project uses the `py4j` library to create the gateway server.

First, add the `py4j` dependency to your Java project. If you are using Maven, add this to your `pom.xml`:

```xml
<dependency>
    <groupId>net.sf.py4j</groupId>
    <artifactId>py4j</artifactId>
    <version>0.10.9.9</version>
</dependency>
```

Next, create your main application class. This class will be the entry point for your Node.js application.

**`SampleJavaNode.java`**

```java
package com.example.samplejavanode;

import py4j.GatewayServer;

/**
 *
 * @author shantanusharma01
 */
public class SampleJavaNode {

    private Stack stack;

    public SampleJavaNode() {
      stack = new Stack();
      stack.push("Initial Item");
    }

    public Stack getStack() {
        return stack;
    }

    public static void main(String[] args) {
        SampleJavaNode app = new SampleJavaNode();
        // The second argument is the port for the gateway server
        GatewayServer server = new GatewayServer(app, 25333);
        server.start();
        System.out.println("Gateway Server started on port 25333");
    }
}
```

Here is the `Stack` class used in the example:

**`Stack.java`**

```java
package com.example.samplejavanode;

import java.util.LinkedList;
import java.util.List;

public class Stack {
    private List<String> internalList = new LinkedList<String>();

    public void push(String element) {
        internalList.add(0, element);
    }

    public String pop() {
        return internalList.remove(0);
    }

    public List<String> getInternalList() {
        return internalList;
    }

    public void pushAll(List<String> elements) {
        for (String element : elements) {
            this.push(element);
        }
    }
}
```

Run the `main` method in `SampleJavaNode` to start the server.

#### 2. The Node.js Side (Client)

On the client side, you use the `Gateway` class from `node4j` to connect to the Java application.

Here is an example written in TypeScript:

**`main.ts`**

```typescript
import { Gateway } from "node4j";

async function main() {
  // Connect to the Java Gateway Server
  const myJava = new Gateway({
    host: "127.0.0.1",
    port: 25333,
  });

  // 1. Interact with the entry point object (SampleJavaNode)
  const stack = await myJava.entryPoint.getStack();
  await stack.push("main");
  await stack.push("Second item");
  const popValue = await stack.pop(); // popValue will be "Second item"
  console.log("pop value : " + popValue);

  // 2. Create new Java objects and call static methods
  const random = await myJava.jvm.java.util.Random();
  const number1 = await random.nextInt(10);
  const number2 = await random.nextInt(10);
  console.log(`Generated numbers are: ${number1} and ${number2}`);

  const system = await myJava.jvm.System;
  const currentTime = await system.currentTimeMillis();
  console.log("java system current time : " + currentTime);
}

main().catch(console.error);
```

Output:

```text
pop value : Second item
Generated numbers are: 2 and 5
java system current time : 1764422092819
```

### Option 2: Execute JAR Files Directly from Node.js

Node4J now includes a powerful `WorkerJarExecutor` class that allows you to launch and manage Java `.jar` files directly from your Node.js application using worker threads.

**Example Usage:**

```typescript
import { Gateway, WorkerJarExecutor } from "node4j";

async function main() {
  // Launch the JAR file using WorkerJarExecutor
  const workerExecuterJar = new WorkerJarExecutor();
  await workerExecuterJar.start({
    jarPath: "src/example/sampleJavaNode-1.0-SNAPSHOT.jar",
    javaOpts: ["-Xmx512m"],
    readySignal: "Gateway Server started on port 25333",
    timeoutMs: 5000,
    restartOnCrash: true,
    maxRestarts: 3,
    onMessage: (message) => {
      switch (message.type) {
        case "stdout":
          console.log(message.args);
          break;
        case "stderr":
          console.error(message.args);
          break;
        case "exit":
          console.error(message.args);
          break;
        case "shutdown":
          console.log(message.args);
          break;
        case "ready":
          console.log(message.args);
          break;
        default:
          console.log(message);
          break;
      }
    },
  });

  // Now connect to the running JAR
  const myJava = new Gateway({
    host: "127.0.0.1",
    port: 25333,
  });

  // Use the gateway as usual...
  const stack = await myJava.entryPoint.getStack();
  await stack.push("Item from Node.js");
  const value = await stack.pop();
  console.log("Popped value:", value);

  // Shutdown the JAR when done
  await workerExecuterJar.shutdown();
}

main().catch(console.error);
```

**`WorkerJarExecutor` Configuration Options:**

| Option           | Type                               | Description                                                          |
| ---------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `jarPath`        | `string`                           | Path to the `.jar` file to execute                                   |
| `javaOpts`       | `string[]`                         | Java options (e.g., `["-Xmx512m", "-Dproperty=value"]`)              |
| `readySignal`    | `string`                           | Text to look for in stdout/stderr to determine when the JAR is ready |
| `timeoutMs`      | `number`                           | Timeout in milliseconds to wait for the ready signal                 |
| `restartOnCrash` | `boolean`                          | Whether to restart the JAR if it crashes                             |
| `maxRestarts`    | `number`                           | Maximum number of restart attempts                                   |
| `onMessage`      | `(message: WorkerMessage) => void` | Callback for handling messages from the JAR process                  |

**`WorkerMessage` Types:**

```typescript
type WorkerMessage =
  | { type: "stdout"; args: string }
  | { type: "stderr"; args: string }
  | { type: "exit"; args: string }
  | { type: "shutdown"; args: string }
  | { type: "ready"; args: string };
```

**Benefits of `WorkerJarExecutor`**

- **Simplified Deployment**: No need to manually start Java processes—your Node.js app manages everything.
- **Process Isolation**: JAR runs in a separate process with proper lifecycle management.
- **Automatic Restarts**: Configurable restart policies for crashed JARs.
- **Real-time Monitoring**: Capture and handle stdout/stderr from the Java process.
- **Ready Signal Detection**: Automatically detect when the JAR is ready to accept connections.

## API Reference

### `Gateway` Class

The main class for connecting to a Java Gateway Server.

```typescript
const gateway = new Gateway({
  host: "127.0.0.1",
  port: 25333,
  // Optional: connection timeout in milliseconds
  connectionTimeout: 10000,
});
```

### `WorkerJarExecutor` Class

Manages the execution of `.jar` files from Node.js.

```typescript
const executor = new WorkerJarExecutor();

// Start the JAR
await executor.start(config);

// Check if JAR is running
const isRunning = executor.isRunning();

// Shutdown the JAR
await executor.shutdown();
```

## Error Handling

Node4J provides comprehensive error handling for both connection issues and Java method execution errors. All methods return Promises that will reject with descriptive error messages.

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/umbrashia/node4j/blob/main/LICENSE) file for details.

Copyright (c) 2025 Shantanu Sharma
