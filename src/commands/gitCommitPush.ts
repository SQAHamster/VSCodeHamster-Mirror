import * as vscode from 'vscode';
import { VSCodeCommand } from "./VSCodeCommand";
import * as childProcess from "child_process";

export function gitCommitPush(): () => Promise<void> {
    const gitCommitPushCommand = new GitCommitPushCommand();
    return gitCommitPushCommand.execute.bind(gitCommitPushCommand);
}

class GitCommitPushCommand implements VSCodeCommand {


    public async execute(): Promise<void> {
        try {
            await new Promise((resolve, reject) => {
                if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length < 1) {
                    reject("Please open the folder containing the project");
                    return;
                }
                childProcess.exec(
                    `git add . && git commit -m "Changes by HamsterExtension" && git pull && git push`,
                    {
                        cwd: vscode.workspace.workspaceFolders[0].uri.fsPath
                    },
                    (err, stdout, stderr) => {
                        if (err) {
                            reject("An error occured while saving: " + stderr);
                            return;
                        }
                        vscode.window.showInformationMessage("Saving to Artemis finished. For test-results log into artemis");
                        resolve();
                    });
            });
        } catch (err) {
            vscode.window.showErrorMessage(err);
        }
    }
}