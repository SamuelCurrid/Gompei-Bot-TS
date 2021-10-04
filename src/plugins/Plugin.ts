import { Awaited, ClientEvents, Message } from "discord.js";
import { GompeiClient } from "../client";
import { ArgumentList, ParseArgumentsReturnType } from "../util/parseCommandArguments";
import { ClearPromises } from "../util/types";

export interface TextCommandContext extends Message {
    parseArguments<T extends ArgumentList>(this: TextCommandContext, ...types: T): ParseArgumentsReturnType<T>;
    parseArgumentsAsync<T extends ArgumentList>(this: TextCommandContext, ...types: T): Promise<ClearPromises<ParseArgumentsReturnType<T>>>;
}

interface TextCommandInfo {
    commandName: string;
    aliases?: string[];
    description?: string;
    check?: (ctx: TextCommandContext) => Awaited<boolean>;
    callback(ctx: TextCommandContext): Awaited<void>;
}

export interface PluginInfo {
    name: string;
    latch?: Promise<void>;
    description?: string;
    textCommands?: TextCommandInfo[];
    slashCommands?: never; // not yet implemented
    eventListeners?: { [EventName in keyof ClientEvents]?: (...args: ClientEvents[EventName]) => Awaited<void> };
}

export type Plugin = (client: GompeiClient) => PluginInfo;

export function Plugin(plugin: Plugin) {
    return plugin;
}
