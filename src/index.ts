import { Awaited, Constants, DiscordAPIError } from 'discord.js';
import { config } from 'dotenv';
import { getClient } from './client';
import logging from './plugins/logging';
import { Plugin, TextCommandContext } from './plugins/Plugin';
import { Thisify } from './util/types';

// Load .env file
// Uses ".env" by default but custom .env file can be loaded.
const { parsed, error } = config({ path: process.argv[2] });

if (error) {
    throw error;
}

const textCommandPrefix = process.env.PREFIX ?? '.';

const plugins: Plugin<any>[] = [
    logging
];

const client = getClient();

client.login(process.env.BOT_TOKEN)
    .catch((e: Error & { code: string }) => {
        if (e.code === Constants.WSCodes[4004]) {
            console.error("Invalid bot token. Please check your .env file.");
            process.exit(1);
        }
    });

client.on('ready', async () => {

    const textCommandsLookup = {} as { [commandName: string]: ((ctx: TextCommandContext) => Awaited<boolean>)[] };

    // Text command handling
    client.on('messageCreate', async msg => {
        if (msg.content.startsWith(textCommandPrefix)) {
            const command = msg.content.slice(textCommandPrefix.length);
            const [commandName] = command.split(' ', 1);
            
            if (textCommandsLookup[commandName]) {
                for (const command of textCommandsLookup[commandName]) {
                    // Run the commands until we get the first blocking (i.e. successful) one.
                    if (await command(msg)) {
                        if (process.env.COMMAND_SHADOWING !== false) {
                            break;
                        }
                    }
                }
            }
        }
    });

    // Load plugins
    const pluginsWithState = plugins.map(async plugin => {
        console.log(`Loading ${plugin.name}...`);
        return [plugin, await plugin.init?.(client)] as const;
    });

    await Promise.allSettled(pluginsWithState.map(async p => {
        const [plugin, state] = await p;

        const thisObj = plugin.useThis ? state : undefined;
        const stateObj = plugin.useThis ? [] : [state];

        let count = {
            commands: 0,
            commandNames: 0,
            eventListeners: 0
        };

        // Load text commands
        if (plugin.textCommands) {
            for (const command of plugin.textCommands) {
                const callback = async (ctx: TextCommandContext) => {
                    if (await command.permissions?.apply(thisObj, [...stateObj, ctx] as any) === false) {
                        return false;
                    }
                    await command.callback.apply(thisObj, [...stateObj, ctx] as any);
                    return true;
                };
                for (const name of [command.commandName, ...command.aliases ?? []]) {
                    (textCommandsLookup[name] ??= []).push(callback);
                    count.commandNames++;
                }
                count.commands++;
            }
        }

        // Load event handlers
        if (plugin.eventListeners) {
            for (const eventType of Object.keys(plugin.eventListeners)) {
                const handler = (...args: any[]) => (plugin.eventListeners as any)[eventType].apply(thisObj, [...stateObj, ...args]);
                client.on(eventType, handler);
                count.eventListeners++;
            }
        }

        console.log(
            `Finished loading ${plugin.name} ` +
            `(${count.commands} commands with ${count.commandNames} names; ` +
            `${count.eventListeners} event listeners)`);
    }));
});