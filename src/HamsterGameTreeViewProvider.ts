import * as vscode from 'vscode';
import * as path from "path";
import { LogMessage } from './LogMessage';

export class HamsterGameTreeProvider implements vscode.TreeDataProvider<string> {

    private static readonly commandStrings: any = {
        "general": "General",
        "controls": "Controls",
        "log": "Log",
        "openGui": "Open Hamster GUI",
        "killAll": "Kill all running games",
        "resume": "Resume game",
        "pause": "Pause game",
        "step": "Step",
        "undo": "Undo",
        "redo": "Redo",
        "gitClone": "Download Code from Artemis / GitHub",
        "gitCommitPush": "Save Code to Artemis and test",
        "availableGames": "Startable Hamster Games",
        "restartJava": "Clean Java cache (use with care)",
        "openDocumentation": "Open the SQA Code Online documentation",
    };
    private logEntries: LogMessage[] = [];
    private availableGames: { name: string, gameId: number }[] = [];
    private gamesStr: string[] = [];
    private _isResumeVisible: boolean = false;
    private _isPauseVisible: boolean = false;
    private _isUndoVisible: boolean = false;
    private _isRedoVisible: boolean = false;
    private hamsterSvgUri: string | undefined;

    public constructor(private extensionPath: string) {
        (async () => {
            this.hamsterSvgUri = new TextDecoder().decode(await vscode.workspace.fs.readFile(vscode.Uri.file(path.join(this.extensionPath, "res", "HamsterCustom.svg"))));
        })();
    }

    public getTreeItem(element: string): vscode.TreeItem | Thenable<vscode.TreeItem> {
        let elementStr = HamsterGameTreeProvider.commandStrings[element];
        if (!elementStr) {
            elementStr = element;
        }
        const item = new vscode.TreeItem(elementStr, vscode.TreeItemCollapsibleState.None);
        switch (element) {
            case "general":
            case "controls":
            case "log":
            case "availableGames":
                item.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
                break;
            case "openDocumentation":
                item.command = { command: "codeHamster.openDocumentation", title: "" };
                item.iconPath = {
                    light: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "docsBlack.svg")),
                    dark: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "docsWhite.svg"))
                };
                break;
            case "gitClone":
                item.command = { command: "codeHamster.gitClone", title: "" };
                item.iconPath = {
                    light: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "downloadBlack.svg")),
                    dark: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "downloadWhite.svg"))
                };
                break;
            case "gitCommitPush":
                item.command = { command: "codeHamster.gitCommitPush", title: "" };
                item.iconPath = {
                    light: vscode.Uri.file(path.join(this.extensionPath, "res", "saveBlack.svg")),
                    dark: vscode.Uri.file(path.join(this.extensionPath, "res", "saveWhite.svg"))
                };
                break;
            case "openGui":
                item.command = { command: "codeHamster.openGui", title: "" };
                item.iconPath = {
                    light: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "fullscreenBlack.svg")),
                    dark: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "fullscreenWhite.svg"))
                };
                break;
            case "killAll":
                item.command = { command: "codeHamster.killAll", title: "" };
                item.iconPath = vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "cancel.svg"));
                break;
            case "resume":
                item.command = { command: "codeHamster.resume", title: "" };
                item.iconPath = vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "play.svg"));
                break;
            case "pause":
                item.command = { command: "codeHamster.pause", title: "" };
                item.iconPath = vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "pause.svg"));
                break;
            case "undo":
                item.command = { command: "codeHamster.undo", title: "" };
                item.iconPath = {
                    light: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "undoBlack.svg")),
                    dark: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "undoWhite.svg"))
                };
                break;
            case "redo":
                item.command = { command: "codeHamster.redo", title: "" };
                item.iconPath = {
                    light: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "redoBlack.svg")),
                    dark: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "redoWhite.svg"))
                };
                break;
            case "restartJava":
                item.command = { command: "codeHamster.restartJava", title: "Clean java language server workspace (use with care)" };
                item.iconPath = {
                    light: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "cleanCacheBlack.svg")),
                    dark: vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "cleanCacheWhite.svg"))
                };
                item.tooltip = "This clears the cache of the java extensoion.\nOnly use, if executing of java code doen't work at all.";
                break;
            default:
                if (element.startsWith("Log:")) {
                    const matches = element.match(/^Log:([^:]*):(-?[0-9]*):(.*)/);
                    if (matches) {
                        item.label = matches[3];
                        if (this.hamsterSvgUri && matches[1]) {
                            item.iconPath = vscode.Uri.parse("").with({ scheme: "data", path: `image/svg+xml,${encodeURIComponent(this.hamsterSvgUri?.replace(/\$customColor/g, matches[1]))}` });
                        }
                    }
                } else if (element.startsWith("HamsterGame:")) {
                    item.label = "Start " + element.replace(/^HamsterGame:[0-9]*:(.*)/, "$1");
                    item.command = { command: "codeHamster.executeGame", arguments: [parseInt(element.replace(/HamsterGame:([0-9]*):.*/, "$1"), 10)], title: "" };
                    item.iconPath = vscode.Uri.file(path.join(this.extensionPath, "res", "buttons", "play.svg"));
                }
        }
        item.contextValue = element;
        return item;
    }
    public getChildren(element?: string | undefined): vscode.ProviderResult<string[]> {
        if (!element) {
            return Promise.resolve(["general", "availableGames", "controls", "log"]);
        } else if (element === "general") {
            return Promise.resolve(["openGui", "gitClone", "gitCommitPush", "openDocumentation", "restartJava"]);
        } else if (element === "controls") {
            const controls = [];
            if (this._isResumeVisible) {
                controls.push("resume");
            }
            if (this._isPauseVisible) {
                controls.push("pause");
            }
            if (this._isUndoVisible) {
                controls.push("undo");
            }
            if (this._isRedoVisible) {
                controls.push("redo");
            }
            controls.push("killAll");
            return Promise.resolve(controls);
        } else if (element === "log") {
            return Promise.resolve(this.logEntries.map(msg => "Log:" + (msg.color ?? "") + ":" + (msg.id ?? "") + ":" + msg.message));
        } else if (element === "availableGames") {
            return Promise.resolve(this.gamesStr);
        } else {
            return Promise.resolve([]);
        }
        return Promise.reject();
    }

    public setLog(entries: LogMessage[]) {
        this.logEntries = entries;
        this._onDidChangeTreeData.fire();
    }

    public setGames(games: { name: string, gameId: number }[]) {
        this.availableGames = games;
        this.gamesStr = games.map(game => "HamsterGame:" + game.gameId + ":" + game.name);
        this._onDidChangeTreeData.fire();
    }

    public set isResumeVisible(visible: boolean) {
        this._isResumeVisible = visible;
        this._onDidChangeTreeData.fire();
    }
    public get isResumeVisible(): boolean {
        return this._isResumeVisible;
    }
    public set isPauseVisible(visible: boolean) {
        this._isPauseVisible = visible;
        this._onDidChangeTreeData.fire();
    }
    public get isPauseVisible(): boolean {
        return this._isPauseVisible;
    }
    public set isUndoVisible(visible: boolean) {
        this._isUndoVisible = visible;
        this._onDidChangeTreeData.fire();
    }
    public get isUndoVisible(): boolean {
        return this._isUndoVisible;
    }
    public set isRedoVisible(visible: boolean) {
        this._isRedoVisible = visible;
        this._onDidChangeTreeData.fire();
    }
    public get isRedoVisible(): boolean {
        return this._isRedoVisible;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<string | undefined> = new vscode.EventEmitter<string | undefined>();
    readonly onDidChangeTreeData?: vscode.Event<string | undefined | null> = this._onDidChangeTreeData.event;
}