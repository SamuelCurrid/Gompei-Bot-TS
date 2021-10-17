import { Client, Intents } from "discord.js";
import { StorageManager } from "./storage";

const allIntents = new Intents(Object.values(Intents.FLAGS));

const nonPrivilegedIntents = allIntents.remove([
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MEMBERS,
]);

// As far as plugin code is concerned the client should always be ready.
export interface GompeiClient extends Client<true> {
    storage: StorageManager;
}

let client: GompeiClient;

export function getClient() {
    return (client ??= Object.assign(new Client<true>({
        intents: allIntents
    }), {
        storage: new StorageManager()
    }));
}