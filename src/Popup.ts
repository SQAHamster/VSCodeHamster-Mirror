import { rejects } from 'assert';
import { resolve } from 'path';
import * as vscode from 'vscode';

export class Popup {

    private messageStack: PopupMessage[] = [];
    private stackProcessingRunniung: boolean = false;
    private lastInputCancellation: vscode.CancellationTokenSource | undefined;

    public constructor() {

    }

    public async showError(msg: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            this.messageStack.push({ msg, type: "ERROR", callback: resolve });
            this.processMessages();
        });
    }

    public async showStatus(msg: string): Promise<undefined> {
        return new Promise(async (resolve, reject) => {
            this.messageStack.push({ msg, type: "STATUS", callback: resolve });
            this.processMessages();
        });
    }

    public async inputString(msg: string): Promise<string | undefined> {
        this.cancelInputs();
        this.lastInputCancellation = new vscode.CancellationTokenSource();
        try {
            let input: string | undefined;
            while (input === undefined) {
                input = await vscode.window.showInputBox({
                    prompt: msg
                }, this.lastInputCancellation.token);
            }
            if (!input || input.length === 0) {
                return undefined;
            }
            return input;
        } catch (err) {
            console.error("Error on string input", err);
            return undefined;
        }
    }

    public async inputInt(msg: string): Promise<number | undefined> {
        this.cancelInputs();
        this.lastInputCancellation = new vscode.CancellationTokenSource();
        try {
            let input: string | undefined;
            while (input === undefined) {
                input = await vscode.window.showInputBox({
                    prompt: msg,
                    validateInput: (val) => {
                        return (val && !isFinite(parseInt(val, 10))) ? "You have to enter a valid integer number" : undefined;
                    }
                }, this.lastInputCancellation.token);
            }
            if (!input || !isFinite(parseInt(input, 10))) {
                return undefined;
            }
            return parseInt(input, 10);
        } catch (err) {
            console.error("Error on int input", err);
            return undefined;
        }
    }

    public cancelAll(): void {
        this.messageStack.splice(0, this.messageStack.length);
        this.cancelInputs();
    }

    public cancelInputs(): void {
        this.lastInputCancellation?.cancel();
        this.lastInputCancellation?.dispose();
        this.lastInputCancellation = undefined;
    }

    private processMessages(): void {
        if (!this.stackProcessingRunniung) {
            this.stackProcessingRunniung = true;
            this.showTopStackMessage.call(this);
        }
    }

    private showTopStackMessage(): void {
        if (this.messageStack.length > 0) {
            const msg = this.messageStack.splice(0, 1)[0];
            if (msg.type === "ERROR") {
                vscode.window.showErrorMessage(msg.msg, { modal: true }).then(this.showTopStackMessage.bind(this)).then(msg.callback);
            } else if (msg.type === "STATUS") {
                vscode.window.showInformationMessage(msg.msg, { modal: true }).then(this.showTopStackMessage.bind(this)).then(msg.callback);
            }
        } else {
            this.stackProcessingRunniung = false;
        }
    }
}

type PopupMessage = { msg: string, type: "ERROR" | "STATUS", callback: () => void };
