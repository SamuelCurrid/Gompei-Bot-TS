import { Client, Intents } from "discord.js";

const allIntents = new Intents(Object.values(Intents.FLAGS));

const nonPrivilegedIntents = allIntents.remove([
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MEMBERS,
]);

// As far as plugin code is concerned the client should always be ready.
export type GompeiClient = Client<true>;

let client: GompeiClient;

export function getClient() {
    return (client ??= new Client({
        intents: allIntents
    }));
}