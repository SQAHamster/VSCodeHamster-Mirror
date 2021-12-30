import { AddLogEntryDelta } from "../WebHamster/out/deltas/AddLogEntryDelta.js";
import { Delta } from "../WebHamster/out/deltas/Delta.js";
import { DeltaType } from "../WebHamster/out/enums/DeltaType.js";
import { DeltaListener } from "../WebHamster/out/deltas/DeltaListener.js";
import { vscode } from "./VsCodeStatusPoll.js";
import { ColorProvider } from "../WebHamster/out/ui/entityProviders/ColorProvider.js";

export class VsCodeLog implements DeltaListener {

    constructor(private readonly provider: ColorProvider) { }

    public reset(): void {
        vscode.postMessage({
            command: "reset"
        });
    }

    public newDelta(delta: Delta) {
        if (delta.type === DeltaType.ADD_LOG_ENTRY) {
            const addDelta = (delta as AddLogEntryDelta);
            let color: string | undefined;
            const hamsterId = addDelta.hamsterId;
            if (hamsterId) {
                color = this.provider.getColor(hamsterId.toString(10));
            }
            console.log(addDelta.hamsterId + ": " + addDelta.message);
            vscode.postMessage({
                command: "addLog",
                hamsterId: addDelta.hamsterId,
                color: color,
                message: addDelta.message
            });
        } else if (delta.type === DeltaType.REMOVE_LOG_ENTRY) {
            vscode.postMessage({
                command: "removeLog"
            });
        }
    }
}