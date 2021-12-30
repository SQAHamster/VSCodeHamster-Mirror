import * as vscode from 'vscode';
import * as request from "request";
import * as path from 'path';
import { URL } from 'url';

import { openGui, OpenGuiCommand } from './commands/openGui';
import { Popup } from './Popup';
import { HamsterGameTreeProvider } from './HamsterGameTreeViewProvider';
import { gitCommitPush } from './commands/gitCommitPush';
import { gitClone } from './commands/gitClone';
import * as fs from 'fs';
import { HamsterGameFinder } from './HamsterGameFinder';
import { executeGame } from './commands/executeGame';
import { controls } from './commands/controls';
import { execFile } from "child_process";
// import { authenticateIfNeeded } from './GitAutentication';

let globalTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "codeHamster" is now active!');

	const treeViewProvider: HamsterGameTreeProvider = new HamsterGameTreeProvider(context.extensionPath);
	const popup = new Popup();
	const hamsterGameFinder = new HamsterGameFinder();
	const openGuiCmd: OpenGuiCommand = new OpenGuiCommand(context.extensionPath, popup, treeViewProvider, context.subscriptions);

	hamsterGameFinder.addGamesChangesListener(treeViewProvider.setGames.bind(treeViewProvider));

	if (vscode.workspace.workspaceFolders) {
		hamsterGameFinder.foldersAdded(vscode.workspace.workspaceFolders);
	}

	vscode.workspace.onDidChangeWorkspaceFolders(evt => {
		hamsterGameFinder.foldersRemoved(evt.removed);
		hamsterGameFinder.foldersAdded(evt.added);
	});

	let hamsterAvailable: boolean = false;
	let lastHeartbeat = -1;
	globalTimer = setInterval(() => {
		request("http://localhost:8080/gamesList", { timeout: 500 }, (err, res, body) => {
			if (typeof body === "string" && res.statusCode == 200) {
				if (!hamsterAvailable) {
					console.log("Hamster started");
					vscode.commands.executeCommand("codeHamster.openGui");
				}
				hamsterAvailable = true;
			} else {
				if (hamsterAvailable) {
					console.log("Hamster ended");
				}
				hamsterAvailable = false;
			}
		});
		/*const date = new Date();
		if (date.getTime() - lastHeartbeat > 30000) {
			fs.writeFile("~/codeHamsterHeartbeat", date.toISOString(), { encoding: "utf-8" }, (err) => {
				console.error(err);
			});
			console.log("Wrote hearbeat");
			lastHeartbeat = date.getTime();
		}*/
	}, 1000);

	context.subscriptions.push(vscode.commands.registerCommand("codeHamster.test", async () => {
		/*console.log(hamsterGameFinder.allGameNames);
		const dbgConfig = hamsterGameFinder.getConfigForId(1);
		console.log(dbgConfig);
		vscode.debug.startDebugging(dbgConfig.workspace, dbgConfig.debugConfig);*/

		const gitExt = vscode.extensions.getExtension("vscode.git")?.exports;
		const gitApi = await gitExt?.model.init(vscode.Uri.parse("https://gitlab.artemis.sqa.ddnss.org/PSETEMPLATE/psetemplate-exercise.git"));
		console.log("End");
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.openGui', openGuiCmd.execute.bind(openGuiCmd)));

	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.executeGame', executeGame(hamsterGameFinder)));

	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.killAll', () => {
		vscode.commands.executeCommand("workbench.action.debug.stop");
		if (process.platform == "win32") {
			execFile("tskill", ["java"], (err, stdout, stderr) => {
				if (err) {
					console.error("Couldn't kill java: ", stderr);
				}
			});
		} else {
			execFile("pkill", ["java"], (err, stdout, stderr) => {
				if (err) {
					console.error("Couldn't kill java: ", stderr);
				}
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.resume', controls("resume", openGuiCmd)));
	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.pause', controls("pause", openGuiCmd)));
	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.undo', controls("undo", openGuiCmd)));
	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.redo', controls("redo", openGuiCmd)));

	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.gitClone', gitClone(popup)));

	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.gitCommitPush', gitCommitPush()));

	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.restartJava', () => {
		vscode.commands.executeCommand("java.clean.workspace");
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codeHamster.openDocumentation', () => {
		vscode.env.openExternal(vscode.Uri.parse("https://github.com/SQAHamster/SQA-Code-Online-Documentation/blob/master/doc.md"));
	}));

	context.subscriptions.push(vscode.window.registerTreeDataProvider(
		'hamsterGameView',
		treeViewProvider
	));

	// authenticateIfNeeded();
}

export function deactivate() {
	if (globalTimer) {
		clearInterval(globalTimer);
	}
	console.log("Hamster game extension disabled");
}



