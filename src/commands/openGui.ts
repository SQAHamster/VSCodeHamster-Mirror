import * as vscode from 'vscode';
import { VSCodeCommand } from "./VSCodeCommand";
import * as path from 'path';
import { URL } from 'url';
import * as fs from "fs";
import { Popup } from '../Popup';
import * as request from "request";
import { HamsterGameTreeProvider } from '../HamsterGameTreeViewProvider';
import { MessageSender } from '../MessageSender';
import { LogMessage } from '../LogMessage';

export function openGui(extensionPath: string, popup: Popup, tree: HamsterGameTreeProvider, disposeable?: vscode.Disposable[]): () => void {
    const guiOpener = new OpenGuiCommand(extensionPath, popup, tree, disposeable);
    return guiOpener.execute.bind(guiOpener);
}

export class OpenGuiCommand implements VSCodeCommand, MessageSender {

    private openedGui: vscode.WebviewPanel | undefined = undefined;
    private knownLogEntries: LogMessage[] = [];
    private lastShownEntry = -1;
    private alreadyShowingError: boolean = false;
    private clearErrorInterval: NodeJS.Timeout;

    public constructor(private extensionPath: string, private popup: Popup, private tree: HamsterGameTreeProvider, private disposeable?: vscode.Disposable[]) {
        this.clearErrorInterval = setInterval(() => {
            this.alreadyShowingError = false;
        }, 20000);
    }

    public postMessage(message: any) {
        if (this.openedGui) {
            this.openedGui.webview.postMessage(message);
        }
    }

    private logEntryToString(logEntry: LogMessage): string {
        return logEntry.id + ": " + logEntry.message;
    }

    public execute(): void {
        if (this.openedGui) {
            this.openedGui.reveal();
        } else {
            const panel = vscode.window.createWebviewPanel("hamsterGui", "Hamster game", vscode.ViewColumn.One, {
                enableScripts: true,
                portMapping: [
                    /*{
                        webviewPort: 8080,
                        extensionHostPort: 8080
                    }*/
                ],
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.extensionPath, 'WebHamster', 'out')),
                    vscode.Uri.file(path.join(this.extensionPath, 'out_webview')),
                    vscode.Uri.file(path.join(this.extensionPath, 'WebHamster', 'res')),
                    vscode.Uri.file(path.join(this.extensionPath, 'gui_res'))
                ],
                retainContextWhenHidden: true
            });
            panel.iconPath = vscode.Uri.file(path.join(this.extensionPath, "res", 'Hamster.svg'));
            this.openedGui = panel;
            panel.onDidDispose(() => {
                this.openedGui = undefined;
            }, null, this.disposeable);
            const paths = {
                js: panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, 'WebHamster', 'out', 'index.js'))),
                css: panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, 'WebHamster', 'res', 'style.css'))),
                vscodeCss: panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, 'gui_res', 'style.css'))),
                grain: panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, 'WebHamster', 'res', 'Grain.svg'))),
                wall: panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, 'WebHamster', 'res', 'Wall.svg'))),
                hamster: "data:image/svg+xml;base64," + fs.readFileSync(path.join(this.extensionPath, 'WebHamster', 'res', 'Hamster.svg')).toString('base64'),
                vscodeJs: panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, 'out_webview', 'vscodeIndex.js'))),
                networkJs: panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, 'out_webview', 'vscodeMsgPoll.js'))),
            };
            panel.webview.onDidReceiveMessage(msg => {
                switch (msg.command) {
                    case "info":
                        this.popup.showStatus(msg.message);
                        break;
                    case "error":
                        this.popup.showError(msg.message).then(() => {
                            panel.webview.postMessage({ command: "inputResult", message: "VscodeOK", inputId: msg.inputId });
                        }).catch((err) => {
                            panel.webview.postMessage({ command: "inputResult", message: undefined, inputId: msg.inputId });
                        });
                        break;
                    case "inputString":
                        console.log("input string");
                        this.popup.inputString(msg.message).then(result => {
                            panel.webview.postMessage({ command: "inputResult", message: result, inputId: msg.inputId });
                        }).catch((err) => {
                            panel.webview.postMessage({ command: "inputResult", message: undefined, inputId: msg.inputId });
                        });
                        break;
                    case "inputInteger":
                        console.log("input integer");
                        this.popup.inputInt(msg.message).then(result => {
                            panel.webview.postMessage({ command: "inputResult", message: result, inputId: msg.inputId });
                        }).catch((err) => {
                            panel.webview.postMessage({ command: "inputResult", message: undefined, inputId: msg.inputId });
                        });
                        break;
                    case "cancelInput":
                        this.popup.cancelAll();
                        break;
                    case "addLog":
                        if (this.knownLogEntries.length <= this.lastShownEntry + 1) {
                            this.knownLogEntries.push({ id: msg.hamsterId, message: msg.message, color: msg.color });
                        }
                        this.lastShownEntry++;
                        this.tree.setLog(this.knownLogEntries.slice(0, this.lastShownEntry + 1));
                        break;
                    case "removeLog":
                        if (this.lastShownEntry > -1) {
                            this.lastShownEntry--;
                            this.tree.setLog(this.knownLogEntries.slice(0, this.lastShownEntry + 1));
                        }
                        break;
                    case "reset":
                        if (this.knownLogEntries.length > 0) {
                            this.knownLogEntries = [];
                            this.tree.setLog([]);
                            this.lastShownEntry = -1;
                        }
                        /*this.tree.isResumeVisible = false;
                        this.tree.isPauseVisible = false;
                        this.tree.isUndoVisible = false;
                        this.tree.isRedoVisible = false;*/
                        break;
                    case "controlsActive":
                        switch (msg.control) {
                            case "resume":
                                this.tree.isResumeVisible = !!msg.active;
                                break;
                            case "pause":
                                this.tree.isPauseVisible = !!msg.active;
                                break;
                            case "undo":
                                this.tree.isUndoVisible = !!msg.active;
                                break;
                            case "redo":
                                this.tree.isRedoVisible = !!msg.active;
                                break;
                        }
                        break;
                    case "request":
                        if (typeof msg.url === "string" && typeof msg.method === "string" && (typeof msg.body === "string" || typeof msg.body === "undefined")) {
                            console.log(msg.method + " request to " + msg.url.toString());
                            request({
                                uri: msg.url,
                                method: msg.method
                            }, (err, res, body) => {
                                if (err) {
                                    if (!this.alreadyShowingError) {
                                        this.alreadyShowingError = true;
                                        console.log(err);
                                        vscode.window.showErrorMessage("No running Hamster game found.");
                                    }
                                    this.openedGui?.webview.postMessage({ command: "requestResponse", error: err, id: msg.id, neterror: true });
                                    console.error(err);
                                    return;
                                }
                                if (res.statusCode !== 200) {
                                    console.log(res.body);
                                    this.popup.showError("Error while loading hamster game.\n" + res.body);
                                    this.openedGui?.webview.postMessage({ command: "requestResponse", error: "Error fetching: " + res.statusCode + "; " + body, id: msg.id });
                                    console.error("Error fetching: " + res.statusCode + "; " + body);
                                    return;
                                }
                                this.openedGui?.webview.postMessage({ command: "requestResponse", response: JSON.parse(body), id: msg.id }).then((e) => console.log("Sent msg: ", e));
                            });

                        }
                        break;
                }
            });
            panel.webview.html = `
                <!doctype html>
                <html lang="en">

                <head>
                    <!-- Required meta tags -->
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

                    <link rel="stylesheet" href="${paths.css}">
                    <link rel="stylesheet" href="${paths.vscodeCss}">

                    <title>Hamstersimulator</title>
                </head>

                <body class="p-3">
                    <div id="controlsContainer"></div>
                    <div style="max-width:45rem;">
                        <div id="territoryConatiner"></div>
                        <span class="alert alert-warning noGamePopup">No hamstergame running yet. Start a game to see the territory.</span>
                    </div>
                    <script type="module">
                        import {vscodeMain} from "${paths.vscodeJs}";
                        vscodeMain('${paths.hamster}', '${paths.grain}', '${paths.wall}');
                    </script>
                </body>
                </html>`;
        }
    }
}