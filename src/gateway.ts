import * as net from 'net';

import { JavaObject } from './java-object';

export class Gateway {
    private client: net.Socket;

    constructor(private port: number, private host: string) {
        this.client = new net.Socket();
    }

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.connect(this.port, this.host, () => {
                resolve();
            });

            this.client.on('error', (err) => {
                reject(err);
            });
        });
    }

    public disconnect(): void {
        this.client.destroy();
    }

    public send(data: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.write(data);

            this.client.once('data', (chunk) => {
                resolve(chunk.toString());
            });

            this.client.once('error', (err) => {
                reject(err);
            });
        });
    }

    public getEntryPoint(): JavaObject {
        return new JavaObject('e', this);
    }
}
