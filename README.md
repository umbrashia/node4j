# node4j
Node4J lets Node.js apps access Java objects in a JVM as if they were native. Java methods and collections are usable with familiar JavaScript syntax. It also supports callbacks, allowing Java code to invoke Node.js functions for seamless two-way integration.

## Installation

```bash
npm install node4j
```

## Usage

First, you need to start a Java gateway server. You can use the `py4j` library for this. 

```python
from py4j.java_gateway import JavaGateway

gateway = JavaGateway()
# Get the JVM view
jvm = gateway.jvm

# Example: Accessing a Java class
string_class = jvm.java.lang.String
my_string = string_class("Hello, world!")
print(my_string)
```

Then, in your Node.js code:

```typescript
import { Gateway } from 'node4j';

async function main() {
    const gateway = new Gateway(25333, 'localhost');
    await gateway.connect();

    // Get a JavaObject representing the entry point
    const entryPoint = await gateway.getEntryPoint();

    // Get a Java class
    const stringClass = await entryPoint.get("java.lang.String");

    // Create a new Java string
    const myString = await stringClass.newInstance("Hello from Node.js!");

    // Call a method on the Java string
    const upperCaseString = await myString.toUpperCase();

    console.log(upperCaseString); // HELLO FROM NODE.JS!

    gateway.disconnect();
}

main();
```
