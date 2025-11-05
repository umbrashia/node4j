import { encodeCommand } from "./node4jProtocol";
import { JavaProxy, ProxyCommandType } from "./types";

export class Gateway {
  #jvm: JavaProxy;
  constructor(obj: any) {
    const Localobj = obj;
    this.#jvm = this.createJavaProxy(null, []);
  }
  get jvm() {
    return this.#jvm;
  }

  generateCommand(proxyCommand: ProxyCommandType): string {
    if (!proxyCommand.javaBridge)
      return encodeCommand({
        cmd: "constructor",
        fullPath: proxyCommand.fullPath,
      });
    else return "no command found";
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
        const fullPath = path.join(".");
        // console.log(`CALLING: ${fullPath} with args:`, args);
        return this.generateCommand({ javaBridge, fullPath, args });
      },
      get: (target, prop: string, receiver) => {
        if (
          prop === "then" ||
          prop === "constructor" ||
          typeof prop === "symbol"
        ) {
          return undefined;
          // return Reflect.get(target, prop, receiver);
          // return [...path, prop];
        }
        return this.createJavaProxy(javaBridge, [...path, prop]);
      },
    }) as unknown as JavaProxy; // Cast to our recursive type
  }
}
