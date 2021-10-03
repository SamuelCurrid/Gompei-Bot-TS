import { Awaited, ClientEvents, Message } from "discord.js";
import { GompeiClient } from "../client";

export interface TextCommandContext extends Message {
    argumentContent: string;
}

interface TextCommandInfo {
    commandName: string;
    aliases?: string[];
    description?: string;
    // Need to do this wonky thing with type parameters so that
    // typescript doesn't try to use the parameter for type inference
    /** Return false if command fails and has no side effects */
    callback: (ctx: TextCommandContext) => Awaited<boolean | void>;
}

export interface PluginInfo {
    name: string;
    description?: string;
    textCommands?: TextCommandInfo[];
    slashCommands?: never; // not yet implemented
    eventListeners?: { [EventName in keyof ClientEvents]: (...args: ClientEvents[EventName]) => Awaited<void> };
}

export type Plugin = (client: GompeiClient) => PluginInfo;

export function Plugin(plugin: Plugin) {
    return plugin;
}
