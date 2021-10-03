import { Awaited, Constants, DiscordAPIError, Message } from 'discord.js';
import { config } from 'dotenv';
import { getClient } from './client';
import logging from './plugins/logging';
import { Plugin, PluginInfo, TextCommandContext } from './plugins/Plugin';
import { InvalidArgumentError } from './util/parseCommandArguments';
import { partition } from './util/string';

// Load .env file
// Uses ".env" by default but custom .env file can be loaded.
const { parsed, error } = config({ path: process.argv[2] });

if (error) {
    throw error;
}

const textCommandPrefix = process.env.PREFIX ?? '.';

const plugins: Plugin[] = [
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
            const [commandName, restOfContent] = partition(msg.content.slice(textCommandPrefix.length), ' ');
            
            if (textCommandsLookup[commandName]) {
                for (const command of textCommandsLookup[commandName]) {
                    // Run the commands until we get the first blocking (i.e. successful) one.
                    if (await command(Object.assign(msg, {
                        argumentContent: restOfContent
                    } as Omit<TextCommandContext, keyof Message>))) {
                        if (process.env.COMMAND_SHADOWING !== false) {
                            break;
                        }
                    }
                }
            }
        }
    });

    // Load plugins
    await Promise.allSettled(plugins.map(async pluginFactory => {
        const plugin = pluginFactory(client);

        console.log(`Loading ${plugin.name}...`);

        let count = {
            commands: 0,
            commandNames: 0,
            eventListeners: 0
        };

        // Load text commands
        if (plugin.textCommands) {
            for (const command of plugin.textCommands) {
                const callback = async (ctx: TextCommandContext) => {
                    try {
                        return await command.callback(ctx) === false;
                    }
                    catch (e) {
                        if (e instanceof InvalidArgumentError) {
                            return false;
                        }
                        else {
                            throw e;
                        }
                    }
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
                const handler = (...args: any[]) => (plugin.eventListeners as any)[eventType](...args);
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