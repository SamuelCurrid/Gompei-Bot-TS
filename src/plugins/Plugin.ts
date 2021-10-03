import { Awaited, ClientEvents, Message } from "discord.js";
import { GompeiClient } from "../client";
import { Thisify } from "../util/types";

export type TextCommandContext = Message;

interface TextCommandInfo<TState, UseThis extends boolean> {
    commandName: string;
    aliases?: string[];
    description?: string;
    // Need to do this wonky thing with type parameters so that
    // typescript doesn't try to use the parameter for type inference
    permissions?: Thisify<UseThis, <T extends TState>(state: T, ctx: TextCommandContext) => Awaited<boolean>>;
    callback: Thisify<UseThis, <T extends TState>(state: T, ctx: TextCommandContext) => Awaited<void>>;
}

export interface Plugin<TState, UseThis extends boolean = boolean> {
    name: string;
    description?: string;
    useThis?: UseThis;
    init?: (client: GompeiClient) => Awaited<TState>;
    textCommands?: TextCommandInfo<TState, UseThis>[];
    slashCommands?: never; // not yet implemented
    eventListeners?: { [EventName in keyof ClientEvents]: (state: TState, ...args: ClientEvents[EventName]) => Awaited<void> };
}

export function makePlugin<T, UseThis extends boolean>(plugin: Plugin<T, UseThis>) {
    return plugin;
}