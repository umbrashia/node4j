import { Gateway } from './gateway';

export class JavaObject {
    constructor(private objectId: string, private gateway: Gateway) {}

    public async invoke(methodName: string, ...args: any[]): Promise<any> {
        const command = `c\n${this.objectId}\n${methodName}\n${args.map(arg => JSON.stringify(arg)).join('\n')}\ne\n`;
        const result = await this.gateway.send(command);
        return JSON.parse(result);
    }

    public async get(fieldName: string): Promise<JavaObject> {
        const command = `f\n${this.objectId}\n${fieldName}\ne\n`;
        const objectId = await this.gateway.send(command);
        return new JavaObject(objectId, this.gateway);
    }

    public async newInstance(...args: any[]): Promise<JavaObject> {
        const command = `n\n${this.objectId}\n${args.map(arg => JSON.stringify(arg)).join('\n')}\ne\n`;
        const objectId = await this.gateway.send(command);
        return new JavaObject(objectId, this.gateway);
    }
}
