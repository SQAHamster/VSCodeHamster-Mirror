import { rejects } from "assert";
import { HamsterStatusPoll } from "../WebHamster/out/network/HamsterStatusPoll.js";

declare function acquireVsCodeApi(): any;

export const vscode = acquireVsCodeApi();

export class VsCodeStatusPoll extends HamsterStatusPoll {

    private nextMsgId = 0;
    private sentRequests: Map<number, { message: any, resolve: (value: any) => void, reject: (reason: any) => void }>;

    public constructor(url?: string) {
        super(url);
        this.sentRequests = new Map();
        window.addEventListener("message", this.handleVSCodeMsg.bind(this));
    }

    protected async request(method: string, url: string, body?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const msg = {
                command: "request",
                url,
                method,
                body,
                id: this.nextMsgId++
            };
            console.log("Sending: ", msg);
            const sentEvent = { message: msg, resolve, reject };
            this.sentRequests.set(msg.id, sentEvent);
            vscode.postMessage(msg);
            const requests = this.sentRequests;
            setTimeout(() => {
                if (requests.has(msg.id)) {
                    reject("Timout occured");
                    requests.delete(msg.id);
                }
            }, 6000);
        });
    }

    private handleVSCodeMsg(e: (Event & { data: any })) {
        console.log("Received: ", e);
        const msg = e.data;
        if (msg.command === "requestResponse") {
            const sentData = this.sentRequests.get(msg.id);
            if (sentData) {
                if (msg.response) {
                    sentData.resolve(msg.response);
                } else {
                    if (msg.neterror) {
                        this.resetAllListeners();
                    }
                    sentData.reject(msg.error);

                }
                this.sentRequests.delete(msg.id);
            } else {
                console.error("No open enty fund");
            }
        }
    }
}