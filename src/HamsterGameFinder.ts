import * as vscode from 'vscode';

export class HamsterGameFinder {

    private nextGameId: number = 0;
    private readonly knownGamesInWorkspace: Map<vscode.WorkspaceFolder, { className: string, id: number }[]>;
    private readonly gamesById: Map<number, { className: string, workspace: vscode.WorkspaceFolder }>;
    private readonly listeners: Set<(games: { name: string, gameId: number }[]) => void>;

    constructor() {
        this.knownGamesInWorkspace = new Map();
        this.gamesById = new Map();
        this.listeners = new Set();
    }

    public foldersAdded(folders: readonly vscode.WorkspaceFolder[]): void {
        folders.forEach(workspace => {
            try {
                vscode.workspace.fs.readFile(workspace.uri.with({ path: workspace.uri.path + "/" + "config.json" })).then(data => {
                    try {
                        const configFile = JSON.parse(new TextDecoder("utf-8").decode(data));
                        if (typeof configFile === "object" && typeof configFile.exercises === "object" && configFile.exercises instanceof Array && configFile.exercises.length > 0) {
                            const exercises: string[] = configFile.exercises;
                            const classNames: string[] = [...new Set(exercises.filter(val => typeof val === "string"))];
                            const games = classNames.map(name => {
                                const game = { className: name, id: this.nextGameId++ };
                                this.gamesById.set(game.id, { className: game.className, workspace: workspace });
                                return game;
                            });
                            this.knownGamesInWorkspace.set(workspace, games);
                            this.fireLiseners();
                        }
                    } catch (err) {
                        console.error(err);
                    }
                });
            } catch (err) {
                console.error(err);
            }
        });
    }

    public foldersRemoved(folders: readonly vscode.WorkspaceFolder[]): void {
        folders.forEach(workspace => {
            this.knownGamesInWorkspace.get(workspace)?.forEach(game => {
                this.gamesById.delete(game.id);
            });
            this.knownGamesInWorkspace.delete(workspace);
            this.fireLiseners();
        });
    }

    private fireLiseners() {
        const newGames = this.allGameNames;
        this.listeners.forEach(listener => listener(newGames));
    }

    public get allGameNames(): { name: string, gameId: number }[] {
        const games: { name: string, gameId: number }[] = [];
        this.gamesById.forEach((game, id) => {
            const nameParts = game.className.split(".");
            if (nameParts.length > 0) {
                games.push({ name: nameParts[nameParts.length - 1], gameId: id });
            }
        });
        return games;
    }

    public getConfigForId(id: number): { workspace: vscode.WorkspaceFolder, debugConfig: vscode.DebugConfiguration } {
        const game = this.gamesById.get(id);
        if (!game) {
            throw new Error("There is no game with that id");
        }
        return {
            workspace: game.workspace,
            debugConfig: {
                name: "Debug " + game.className,
                request: "launch",
                type: "java",
                mainClass: game.className
            }
        }
    }

    public addGamesChangesListener(listener: (games: { name: string, gameId: number }[]) => void): void {
        this.listeners.add(listener);
    }

    public removeGamesChangedListener(listener: (games: { name: string, gameId: number }[]) => void): void {
        this.listeners.delete(listener);
    }
}