import * as vscode from 'vscode';
import { HamsterGameFinder } from "../HamsterGameFinder";
import { VSCodeCommand } from "./VSCodeCommand";

export function executeGame(gameFinder: HamsterGameFinder): (gameId: number) => Promise<void> {
    const executeGameCommand = new ExecuteGameCommand(gameFinder);
    return executeGameCommand.execute.bind(executeGameCommand);
}

class ExecuteGameCommand implements VSCodeCommand {

    public constructor(private gameFinder: HamsterGameFinder) { }

    public async execute(gameId: number): Promise<void> {
        const debugConfig = this.gameFinder.getConfigForId(gameId);
        if (vscode.debug.activeDebugSession) {
            vscode.commands.executeCommand("codeHamster.killAll");
        }
        vscode.debug.startDebugging(debugConfig.workspace, debugConfig.debugConfig);
    }
}