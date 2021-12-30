import { WebControls } from "../WebHamster/out/ui/controls/WebControls.js";
import { vscode } from "./VsCodeStatusPoll.js";
import { InputMode } from "../WebHamster/out/enums/InputMode.js";

export class VsCodeControls extends WebControls {

    private openDialogs: Map<number, { message: any, inputId: number, mode: InputMode, resolve: (value: any) => void, reject: (reason: any) => void }>;

    public constructor(controlsContainer: HTMLDivElement) {
        super(controlsContainer);
        this.openDialogs = new Map();
        window.addEventListener("message", this.inputResponse.bind(this));
    }

    private inputResponse(e: Event & { data: any }) {
        const msg = e.data;
        if (msg.command === "inputResult") {
            const sentData = this.openDialogs.get(msg.inputId);
            if (sentData) {
                if (msg.error) {
                    sentData.reject(msg.error);
                } else {
                    if (sentData.mode === InputMode.READ_STRING) {
                        if (msg.message !== undefined) {
                            sentData.resolve(msg.message);
                        } else {
                            sentData.resolve(false);
                        }
                    } else if (sentData.mode === InputMode.READ_INT) {
                        if (typeof msg.message === "number") {
                            if (msg.message !== undefined) {
                                sentData.resolve(msg.message);
                            } else {
                                sentData.resolve(false);
                            }
                        } else {
                            sentData.reject("Returned value is not a valid integer");
                        }
                    } else if (sentData.mode === InputMode.CONFIRM_ALERT) {
                        sentData.resolve(true);
                    }
                }
                this.openDialogs.delete(msg.inputId);
            }
        } else if (msg.command === "controls") {
            const control = msg.control;
            switch (control) {
                case "resume":
                    this.resume();
                    break;
                case "pause":
                    this.pause();
                    break;
                case "undo":
                    this.undo();
                    break;
                case "redo":
                    this.redo();
                    break;
            }
        }
    }

    public async getStringInput(message: string, inputId: number): Promise<string | false | undefined> {
        return new Promise((resolve, reject) => {
            const msg = {
                command: "inputString",
                message,
                inputId
            };
            console.log("Sending: ", msg);
            this.openDialogs.set(inputId, { message: msg, inputId, mode: InputMode.READ_STRING, resolve, reject });
            vscode.postMessage(msg);
        });
    }

    public async getIntegerInput(message: string, inputId: number): Promise<number | false | undefined> {
        return new Promise((resolve, reject) => {
            const msg = {
                command: "inputInteger",
                message,
                inputId
            };
            console.log("Sending: ", msg);
            this.openDialogs.set(inputId, { message: msg, inputId, mode: InputMode.READ_INT, resolve, reject });
            vscode.postMessage(msg);
        });
    }

    public async showAlert(message: string, inputId: number): Promise<true | undefined> {
        return new Promise((resolve, reject) => {
            const msg = {
                command: "error",
                message,
                inputId
            };
            console.log("Sending: ", msg);
            this.openDialogs.set(inputId, { message: msg, inputId, mode: InputMode.CONFIRM_ALERT, resolve, reject });
            vscode.postMessage(msg);
        });
    }

    public cancelDialogs(): void {
        vscode.postMessage({
            command: "cancelInput"
        });
        this.openDialogs.clear();
    }

    public set resumeActive(isActive: boolean) {
        super.resumeActive = isActive;
        vscode.postMessage({
            command: "controlsActive",
            control: "resume",
            active: isActive
        });
    }

    public set pauseActive(isActive: boolean) {
        super.pauseActive = isActive;
        vscode.postMessage({
            command: "controlsActive",
            control: "pause",
            active: isActive
        });
    }

    public set undoActive(isActive: boolean) {
        super.undoActive = isActive;
        vscode.postMessage({
            command: "controlsActive",
            control: "undo",
            active: isActive
        });
    }

    public set redoActive(isActive: boolean) {
        super.redoActive = isActive;
        vscode.postMessage({
            command: "controlsActive",
            control: "redo",
            active: isActive
        });
    }
}