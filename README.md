# Node4J

Node4J is a Node.js library that allows you to interact with Java objects as if they were native TypeScript/JavaScript objects. It acts as a bridge, enabling seamless communication between a Node.js application and a Java Virtual Machine (JVM). This project is heavily inspired by the Python library `Py4J`.

## Features

- **Connect to a running JVM**: Establish a connection to a Java application running a `GatewayServer`.
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

### 1. The Java Side (Server)

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

    public int addition(int first, int second) {
        return first + second;
    }

    public String sayHello(String name) {
        return "Hello, " + name + " from Java!";
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

### 2. The Node.js Side (Client)

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

Output

```
pop value : Second item
Generated numbers are: 2 and 5
java system current time : 1764422092819
```

## License

This project is licensed under the MIT License. See the [LICENSE](license) file for details.

Copyright (c) 2025 Shantanu Sharma
