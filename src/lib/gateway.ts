import path from "path";
import {
  PACKAGE_TYPE,
  STATIC_PREFIX,
  SUCCESS,
  SUCCESS_CLASS_COMMAND,
  SUCCESS_METHOD_COMMAND,
  SUCCESS_PACKAGE_COMMAND,
} from "./constants";
import {
  decodeResponse,
  encodeCommand,
  Node4jJavaObjectRef,
} from "./node4jProtocol";
import { ConnectionSocket } from "./node4jSocket";
import { JavaProxy, ProxyCommandType } from "./types";

export class Gateway {
  #jvm: JavaProxy;
  public connectionSocket: ConnectionSocket = undefined as any;
  constructor({
    host = "127.0.0.1",
    port = 25333,
  }: {
    host?: string;
    port?: number;
  }) {
    this.connectionSocket = new ConnectionSocket(host, port);
    this.#jvm = this.createJavaProxy(null, []);
  }
  get jvm() {
    return this.#jvm;
  }

  async generateCommand(proxyCommand: ProxyCommandType): Promise<any> {
    await this.connectionSocket.connect();
    let command = "";
    const pathString = proxyCommand.path.filter((el) => el !== "getJavaClass");
    if (
      !proxyCommand.javaBridge &&
      !proxyCommand.path.includes("getJavaClass")
    ) {
      let tempCmd = "";
      for (const key in pathString) {
        tempCmd = encodeCommand({
          cmd: "reflection",
          fullPath: command || pathString.slice(0, Number(key) + 1).join("."),
          subPath: command ? pathString[Number(key)] : undefined,
        });
        const refType = decodeResponse(
          await this.connectionSocket.sendCommand(tempCmd)
        );
        if (refType === SUCCESS_PACKAGE_COMMAND) {
          continue;
        }
        if (
          refType.startsWith(SUCCESS_CLASS_COMMAND) &&
          pathString.length > Number(key) + 1
        ) {
          command = refType.substring(2);
          continue;
        }
        if (
          refType.startsWith(SUCCESS_CLASS_COMMAND) &&
          pathString.length <= Number(key) + 1
        ) {
          command = encodeCommand({
            cmd: "constructor",
            fullPath: pathString.slice(0, Number(key) + 1).join("."),
            args: proxyCommand.args || [],
          });
        }
        if (refType.startsWith(SUCCESS_METHOD_COMMAND)) {
          command = encodeCommand({
            cmd: "call",
            targetRefId: STATIC_PREFIX + command,
            methodName: pathString[Number(key)],
            args: proxyCommand.args,
          });
        }
      }
    } else {
      command = encodeCommand({
        cmd: "call",
        targetRefId: proxyCommand.javaBridge._get_object_id(),
        methodName: pathString.join("."),
        args: proxyCommand.args,
      });
    }

    const javaSocketCommand = await this.connectionSocket.sendCommand(command);
    const response = await decodeResponse(javaSocketCommand);
    return response;
  }

  /**
   * Creates a recursive, callable proxy for building Java paths.
   * @param javaBridge Your bridge instance
   * @param path The current path (e.g., ['java', 'util'])
   */
  private createJavaProxy(javaBridge: any, path: string[]): JavaProxy {
    const target = () => {};
    return new Proxy(target, {
      apply: async (target, thisArg, args) => {
        const response = await this.generateCommand({ path, javaBridge, args });
        if (response instanceof Node4jJavaObjectRef)
          return this.createJavaProxy(response, []);
        else return response;
      },
      get: (target, prop: string, receiver) => {
        if (
          prop === "toJSON" ||
          prop === "then" ||
          prop === "constructor" ||
          typeof prop === "symbol"
        ) {
          return undefined;
          // return Reflect.get(target, path.join("."), receiver);
          //  undefined
        }
        return this.createJavaProxy(javaBridge, [...path, prop]);
      },
    }) as unknown as JavaProxy; // Cast to our recursive type
  }
}
