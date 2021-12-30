import * as vscode from 'vscode';
import { VSCodeCommand } from "./VSCodeCommand";
import * as childProcess from "child_process";
import * as path from "path";
import { URL } from 'url';
import * as fs from "fs";
import { Popup } from '../Popup';

export function gitClone(popup: Popup): () => Promise<void> {
    const gitCloneCommand = new GitCloneCommand(popup);
    return gitCloneCommand.execute.bind(gitCloneCommand);
}

class GitCloneCommand implements VSCodeCommand {

    public constructor(private popup: Popup) { }

    public async execute(): Promise<void> {
        try {
            await new Promise(async (resolve, reject) => {
                if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length < 1) {
                    reject("Please open the folder where the project should be saved to");
                    return;
                }
                const baseFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
                let repositoryUrl: string = await vscode.window.showInputBox({ prompt: "Please enter the URL of the repository" }) || "";
                if (repositoryUrl && repositoryUrl.length > 0) {
                    try {
                        repositoryUrl = (new URL(repositoryUrl)).toString();
                    } catch (err) {
                        reject("Please enter a valid http/https git URL");
                        return;
                    }
                    const repositoryBase = new URL(repositoryUrl).pathname
                    if (path.basename(baseFolder) === path.basename(repositoryBase).replace(/(^.+)(\.[^/.]+)$/, "$1")) {
                        reject("You are already in a folder named like the repository! Maybe you are already in the right one?");
                        return;
                    }
                    fs.readdir(baseFolder, (err, files) => {
                        if (err) {
                            reject("Please open the folder where the project should be saved to");
                            return;
                        }
                        if (files.some(name => name.toLowerCase() === path.basename(repositoryBase).replace(/(^.+)(\.[^/.]+)$/, "$1"))) {
                            reject("There is already a folder named like the repository! Maybe you want to open that.");
                            return;
                        }
                        if (files.some(name => name.toLowerCase().match(/\.git/))) {
                            reject("You are already in a folder that is a git repository. Maybe you are already in the right one?");
                            return;
                        }
                        const gitCmd = `git clone "${repositoryUrl}"`;
                        console.log("Cloning", gitCmd);
                        vscode.window.setStatusBarMessage("Started downloading.", 2000);
                        childProcess.exec(
                            gitCmd,
                            {
                                cwd: baseFolder
                            },
                            (err, stdout, stderr) => {
                                if (err) {
                                    reject("An error occured while saving: " + stderr);
                                    return;
                                }
                                vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(path.join(baseFolder, path.basename(repositoryBase).replace(/(^.+)(\.[^/.]+)$/, "$1"))));
                                resolve();
                            });
                    });
                } else {
                    reject("Please enter a valid http/https git URL");
                    return;
                }
            });
            vscode.window.showInformationMessage("Saving to Artemis finished. For test-results log into artemis");
        } catch (err) {
            this.popup.showError(err);
        }
    }
}