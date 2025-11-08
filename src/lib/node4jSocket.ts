import net from "net";
import { CallbackSocket } from "./types";

export class ConnectionSocket {
  #socket: net.Socket = undefined as any;
  #host: string;
  #port: number;
  #callback: Array<CallbackSocket> = [] as any;
  constructor(host: string, port: number) {
    this.#host = host;
    this.#port = port;
  }

  async connect(): Promise<any> {
    if (this.#socket) return this.#socket;
    this.#socket = net.createConnection({ host: this.#host, port: this.#port });
    this.#socket.setEncoding("utf8");
    return await new Promise((resolve, reject) => {
      this.#socket.on("data", (chunk) => {
        if (this.#callback.length) {
          this.#callback[0].buffer += chunk;
          if (this.#callback[0].buffer.endsWith("\n")) {
            const response = this.#callback[0].buffer;
            this.#callback.shift()?.resolve(response);
          }
        }
        // Py4J responses always end with '\n'
      });
      this.#socket.on("error", (err) => {
        if (this.#callback.length) {
          this.#callback.shift()?.reject(err);
        } else {
          reject(err);
        }
      });
      this.#socket.on("close", () => {
        console.log("Connection closed successfuly");
        if (this.#callback.length) {
          this.#callback.shift()?.resolve("Connection closed successfuly");
        }
      });
      this.#socket.on("connect", () => {
        console.log("Connected to server");
        resolve(this.#socket);
      });
    });
  }

  async sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.#socket.write(command);
      this.#callback.push({ buffer: "", resolve, reject });
    });
  }

  async close(): Promise<void> {
    await new Promise((resolve, reject) => {
      if (this.#callback.length)
        this.#callback.splice(0, this.#callback.length);
      this.#callback.push({ buffer: "", resolve, reject });
      this.#socket.end();
    });
  }
}
