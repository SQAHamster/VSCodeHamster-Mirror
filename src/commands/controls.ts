import * as vscode from 'vscode';
import { MessageSender } from '../MessageSender';
import { OpenGuiCommand } from './openGui';
import { VSCodeCommand } from "./VSCodeCommand";

export function controls(control: string, sender: MessageSender): () => Promise<void> {
    const controlsCommand = new ControlsCommand(control, sender);
    return controlsCommand.execute.bind(controlsCommand);
}

class ControlsCommand implements VSCodeCommand {

    public constructor(private control: string, private sender: MessageSender) { }

    public async execute(): Promise<void> {
        this.sender.postMessage({ command: "controls", control: this.control });
    }

}