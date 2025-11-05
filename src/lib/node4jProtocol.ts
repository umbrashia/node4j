// py4jProtocol.ts
// True Py4J-like encoder / decoder ported from the Python protocol module.

import { Buffer } from "buffer";
import { EncodeCommandInput, NodeJsProxyPool } from "./types";
import {
  BYTES_TYPE,
  BOOLEAN_TYPE,
  DECIMAL_TYPE,
  DOUBLE_TYPE,
  END,
  ERROR,
  FATAL_ERROR,
  GATEWAY_SERVER_OBJECT_ID,
  INTEGER_TYPE,
  JAVA_INFINITY,
  JAVA_MAX_INT,
  JAVA_MIN_INT,
  JAVA_NEGATIVE_INFINITY,
  JAVA_NAN,
  CALL_COMMAND_NAME,
  REFERENCE_TYPE,
  STRING_TYPE,
  RETURN_MESSAGE,
  NULL_TYPE,
  LONG_TYPE,
  VOID_TYPE,
  PYTHON_PROXY_TYPE,
  CONSTRUCTOR_COMMAND_NAME,
  REFLECTION_COMMAND_NAME,
  SUCCESS,
} from "./constants";

/* ... other command constants are available above if you want to add more */

/* ============================
   Utility converters
   ============================ */

function escapeNewLine(original?: string | null): string | null | undefined {
  if (original === null || original === undefined) return original;
  // Python: replace backslash first, then CR then LF
  return String(original)
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

function unescapeNewLine(escaped?: string | null): string | null | undefined {
  if (escaped === null || escaped === undefined) return escaped;
  // Use a sentinel to correctly restore double-backslashes first
  const sentinel = "\u0000";
  let s = String(escaped).replace(/\\\\/g, sentinel);
  s = s.replace(/\\r/g, "\r").replace(/\\n/g, "\n");
  return s.replace(new RegExp(sentinel, "g"), "\\");
}

function encodeFloat(f: number): string {
  // Python repr behaviour mapped to JS:
  if (Number.isNaN(f)) return JAVA_NAN;
  if (f === Number.POSITIVE_INFINITY) return JAVA_INFINITY;
  if (f === Number.NEGATIVE_INFINITY) return JAVA_NEGATIVE_INFINITY;
  // Prefer JS's toString for floats (similar to repr in many cases)
  return String(f);
}

function encodeBytearray(b: Uint8Array | Buffer): string {
  const buf = Buffer.isBuffer(b) ? b : Buffer.from(b);
  return buf.toString("base64");
}

function decodeBytearray(encoded: string): Uint8Array {
  const buf = Buffer.from(encoded, "base64");
  return new Uint8Array(buf);
}

/* Helper to detect "python proxy" like objects:
   In Python code they check parameter.Java.implements. We'll check JS shape:
   - parameter?.Java?.implements is an array-like -> treat as proxy.
   - If you need different behaviour, pass a custom detector later.
*/
function isPythonProxy(param: any): boolean {
  try {
    return !!(
      param &&
      param.Java &&
      Array.isArray(param.Java.implements) &&
      param.Java.implements.length >= 0
    );
  } catch {
    return false;
  }
}

/* ============================
   getCommandPart (mirrors Python get_command_part)
   ============================ */

export function getCommandPart(
  parameter: any,
  NodeJsProxyPool?: NodeJsProxyPool
): string {
  // Returns a single command part line (without trailing \n)
  // Mirrors Python logic and type prefixes.
  if (parameter === null || parameter === undefined) {
    return NULL_TYPE;
  }

  // Booleans
  if (typeof parameter === "boolean") {
    // Python used smart_decode for "True"/"False". We'll use lowercase "true"/"false"
    return BOOLEAN_TYPE + String(parameter);
  }

  // Decimal: in JS we don't have Decimal by default. If user passes an object with toDecimalString, use it.
  if (
    parameter &&
    typeof parameter === "object" &&
    typeof parameter.toDecimalString === "function"
  ) {
    return DECIMAL_TYPE + parameter.toDecimalString();
  }

  // Integer within Java int range -> INTEGER_TYPE
  if (
    typeof parameter === "number" &&
    Number.isInteger(parameter) &&
    parameter <= JAVA_MAX_INT &&
    parameter >= JAVA_MIN_INT
  ) {
    return INTEGER_TYPE + String(parameter);
  }

  // Big integers / longs
  if (typeof parameter === "bigint") {
    return LONG_TYPE + parameter.toString();
  }
  // Numbers outside int range -> LONG_TYPE (mirror Python behaviour where big int becomes long)
  if (
    typeof parameter === "number" &&
    (Math.floor(parameter) !== parameter ||
      parameter > JAVA_MAX_INT ||
      parameter < JAVA_MIN_INT)
  ) {
    // If float (non-integer) will be handled later; but if integer outside range, use LONG
    if (Number.isInteger(parameter)) {
      return LONG_TYPE + String(parameter);
    }
  }

  // Floats
  if (typeof parameter === "number" && !Number.isInteger(parameter)) {
    return DOUBLE_TYPE + encodeFloat(parameter);
  }

  // Byte arrays / Buffer
  if (parameter instanceof Uint8Array || Buffer.isBuffer(parameter)) {
    return BYTES_TYPE + encodeBytearray(parameter);
  }

  // Strings
  if (typeof parameter === "string") {
    return STRING_TYPE + (escapeNewLine(parameter) as string);
  }

  // Python proxy check
  if (isPythonProxy(parameter) && NodeJsProxyPool) {
    const proxyId = NodeJsProxyPool.put(parameter); // e.g., "p0"
    let part = PYTHON_PROXY_TYPE + proxyId;
    for (const iface of parameter.Java.implements) {
      part += ";" + iface;
    }
    return part;
  }

  // JS object interpreted as reference to an existing Java object:
  // Accept either:
  // - parameter.__py4jRef (string)
  // - parameter._get_object_id() function
  if (parameter && typeof parameter === "object") {
    if (typeof parameter.__py4jRef === "string") {
      return REFERENCE_TYPE + parameter.__py4jRef;
    }
    if (typeof parameter._get_object_id === "function") {
      // some wrappers might implement this; call it:
      const id = parameter._get_object_id();
      return REFERENCE_TYPE + id;
    }
  }

  // If still not matched but numeric-like (maybe float edge-case)
  if (typeof parameter === "number") {
    // integer handled above; fallback to double
    return DOUBLE_TYPE + encodeFloat(parameter);
  }

  // Final fallback: throw unsupported
  throw new Error(
    "Unsupported argument type for Py4J wire protocol: " + String(parameter)
  );
}

/* Append newline to each part when building commands */

/* ============================
   Command builders
   ============================ */

/**
 * Build a constructor command:
 * i\n
 * s<fully-qualified-class-name>\n
 * e\n
 */
export function encodeConstructor(fullPath: string): string {
  const lines: string[] = [];
  lines.push(CONSTRUCTOR_COMMAND_NAME.trim()); // "i"
  lines.push(escapeNewLine(fullPath) as string);
  lines.push(END);
  return lines.join("\n") + "\n";
}

/**
 * Build a Call command:
 * c\n
 * r<targetRef>\n           (reference to target object, e.g., "o0" or "rj" for jvm)
 * s<methodName>\n
 * <arg1part>\n
 * ...
 * e\n
 *
 * targetRef must be already encoded as a raw id (e.g., "o1" or DEFAULT_JVM_ID)
 */
export function encodeCall(
  targetRefId: string,
  methodName: string,
  args: any[] = [],
  NodeJsProxyPool?: NodeJsProxyPool
): string {
  const parts: string[] = [];
  parts.push(CALL_COMMAND_NAME.trim()); // "c"
  // target reference: the protocol expects a REFERENCE_TYPE + id as a command part
  parts.push(REFERENCE_TYPE + targetRefId);
  // method name is sent as a string part
  parts.push(STRING_TYPE + (escapeNewLine(methodName) as string));
  // arguments converted via getCommandPart
  for (const a of args) {
    parts.push(getCommandPart(a, NodeJsProxyPool));
  }
  parts.push(END);
  return parts.join("\n") + "\n";
}

/**
 * Build a reflection command (simple version: r\n s<classFqn>\n e\n)
 */
export function encodeReflection(classFqn: string): string {
  const parts: string[] = [];
  parts.push(REFLECTION_COMMAND_NAME.trim()); // "r"
  parts.push(STRING_TYPE + (escapeNewLine(classFqn) as string));
  parts.push(END);
  return parts.join("\n") + "\n";
}

export function encodeCommand(input: EncodeCommandInput): string {
  switch (input.cmd) {
    case "constructor":
      return encodeConstructor(input.fullPath);
    case "reflection":
      return encodeReflection(input.fullPath);
    case "call":
      return encodeCall(
        input.targetRefId,
        input.methodName,
        input.args ?? [],
        input.NodeJsProxyPool
      );
    default:
      throw new Error("Unsupported command type");
  }
}

/* ============================
   Response decoding
   ============================ */

export class Node4JError extends Error {
  cause?: any;
  constructor(message?: string, cause?: any) {
    super(message);
    this.cause = cause;
    Object.setPrototypeOf(this, Node4JError.prototype);
  }
}
export class Node4JJavaError extends Node4JError {
  javaExceptionRef?: any;
  constructor(message?: string, javaExceptionRef?: any) {
    super(message);
    this.javaExceptionRef = javaExceptionRef;
    Object.setPrototypeOf(this, Node4JJavaError.prototype);
  }
}

function isErrorAnswer(answer: string): boolean {
  return !answer || answer.length === 0 || answer[0] !== SUCCESS;
}

/**
 * decodeResponse accepts either a raw response string that may start with
 * '!' (RETURN_MESSAGE) or the content after stripping '!' (both are supported).
 *
 * Examples:
 *   "!yi42\n" or "yi42\n" -> integer 42
 *   "!ysHello\\nWorld\n" -> "Hello\nWorld"
 *   "!yrj\n" -> reference { __py4jRef: 'rj' }
 */
export function decodeResponse(raw: string): any {
  // normalize: remove leading '!' if present, trim trailing newlines.
  let answer = raw;
  if (answer.startsWith(RETURN_MESSAGE)) {
    answer = answer.slice(1);
  }
  // Trim trailing newlines
  answer = answer.replace(/[\r\n]+$/g, "");

  // Now mimic get_return_value behaviour: check is_error, then convert.
  if (isErrorAnswer(answer)) {
    // Error path. Python's get_return_value raises Py4JJavaError if answer[1] == REFERENCE_TYPE
    // or Py4JError otherwise. We try to produce helpful messages.
    if (answer.length > 1) {
      const errType = answer[1];
      const errPayload = answer.slice(2);
      if (errType === REFERENCE_TYPE) {
        throw new Node4JJavaError("Java exception (remote reference)", {
          __py4jRef: errPayload,
        });
      } else {
        // try to decode string payload if it's a string
        if (errType === STRING_TYPE) {
          throw new Node4JError(unescapeNewLine(errPayload) as string);
        } else {
          throw new Node4JError("Java error: " + errPayload);
        }
      }
    } else {
      throw new Node4JError("Unknown error response from gateway");
    }
  } else {
    // success path
    if (answer.length < 2) {
      // no type byte -> nothing to return
      return undefined;
    }
    const t = answer[1];
    const payload = answer.slice(2);

    switch (t) {
      case NULL_TYPE:
        return null;
      case BOOLEAN_TYPE:
        return payload.toLowerCase() === "true";
      case LONG_TYPE:
        // Use BigInt where possible
        try {
          return BigInt(payload);
        } catch {
          return payload; // fallback string
        }
      case DECIMAL_TYPE:
        // No native Decimal in JS; return string representation
        return payload;
      case INTEGER_TYPE:
        return parseInt(payload, 10);
      case BYTES_TYPE:
        return decodeBytearray(payload);
      case DOUBLE_TYPE:
        if (payload === JAVA_INFINITY) return Number.POSITIVE_INFINITY;
        if (payload === JAVA_NEGATIVE_INFINITY) return Number.NEGATIVE_INFINITY;
        if (payload === JAVA_NAN) return NaN;
        return parseFloat(payload);
      case STRING_TYPE:
        return unescapeNewLine(payload);
      case REFERENCE_TYPE:
        // return a JS-friendly wrapper for existing Java object id
        return { __py4jRef: payload };
      case VOID_TYPE:
        return undefined;
      default:
        // Unknown type — return raw payload
        return payload;
    }
  }
}

/* ============================
   Example usage & tests
   ============================ */

// Example (constructor):
// encodeConstructor("java.util.Random") -> "i\nsjava.util.Random\ne\n"

// Example (call on jvm to create Random instance):
// Typically you'd do reflection/constructor sequence on real Gateway, but a
// convenience example for how to create raw commands:
//
// const ctorCmd = encodeConstructor("java.util.Random");
// // send ctorCmd on socket
//
// // Suppose Java returns a reference like "!yr0\n"  -> decodeResponse -> { __py4jRef: "r0" }
// // Then call nextInt on that ref:
// const callCmd = encodeCall("r0", "nextInt", [10]);
// // send callCmd on socket

/* ============================
   Exported API:
   - getCommandPart
   - encodeConstructor
   - encodeCall
   - encodeReflection
   - encodeCommand (convenience)
   - decodeResponse
   - Py4JError / Py4JJavaError
   ============================ */
