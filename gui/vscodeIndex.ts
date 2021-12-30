import { TileContentType } from "../WebHamster/out/enums/TileContentType.js";
import { HamsterGame } from "../WebHamster/out/HamsterGame.js";
import { HamsterGUIClient } from "../WebHamster/out/network/HamsterGUIClient.js";
import { HamsterGameControls } from "../WebHamster/out/ui/controls/HamsterGameControls.js";
import { GrainProvider } from "../WebHamster/out/ui/entityProviders/GrainProvider.js";
import { HamsterProvider } from "../WebHamster/out/ui/entityProviders/HamsterProvider.js";
import { WallProvider } from "../WebHamster/out/ui/entityProviders/WallProvider.js";
import { GuiConfig } from "../WebHamster/out/ui/GuiConfig.js";
import { WebGui } from "../WebHamster/out/ui/territory/WebGui.js";
import { VsCodeControls } from "./VsCodeControls.js";
import { VsCodeLog } from "./VsCodeLog.js";
import { VsCodeStatusPoll } from "./VsCodeStatusPoll.js";

export function vscodeMain(hamsterImgPath: string, grainImgPath: string, wallImgPath: string) {
    const controls: HamsterGameControls = new VsCodeControls(document.getElementById("controlsContainer") as HTMLDivElement);
    const client: HamsterGUIClient = new VsCodeStatusPoll("http://localhost:8080");
    const guiConfig = new GuiConfig();
    const gui = new WebGui((document.getElementById("territoryConatiner") as HTMLDivElement), guiConfig._maxGrainsVisible);
    const game = new HamsterGame();
    const hamsterProvider = new HamsterProvider(hamsterImgPath);
    const grainProvider = new GrainProvider(grainImgPath);
    const wallProvider = new WallProvider(wallImgPath);
    const log = new VsCodeLog(hamsterProvider);
    gui.registerEntityProvider(TileContentType.HAMSTER, hamsterProvider);
    gui.registerEntityProvider(TileContentType.GRAIN, grainProvider);
    gui.registerEntityProvider(TileContentType.WALL, wallProvider);
    client.addStatusReceiver(game, "0", true);
    client.addNewGameListener({
        newGame: (gameId, guiClient) => {
            if (guiClient.currentlyRunningGames.length === 1) {
                guiClient.updateStatusReceiver(game, gameId, true);
            }
        }
    });
    game.addDeltaListener(gui);
    game.addDeltaListener(log);
    game.addInputInterface(controls);
    game.reset();
    client.start();
}