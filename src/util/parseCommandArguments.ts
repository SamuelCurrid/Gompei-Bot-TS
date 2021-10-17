import { GuildMember, Invite, Role, TextChannel } from "discord.js";
import { TextCommandContext } from "../plugins/Plugin";
import { partition } from "./string";
import { Split } from "./types";

export class InvalidArgumentError extends TypeError { }

const EXACT = 'exact:' as const;
const REGEX = 'regex:' as const;

export type ArgumentTypeMap = {
    number: number;
    int: number;
    string: string;
    rest: string;
    textChannel: Promise<TextChannel>;
    member: Promise<GuildMember>;
    role: Promise<Role>;
    invite: Promise<Invite>;
} & {
    [Key in string as `${typeof REGEX}/${string}/${string}`]: string;
};

export type ArgumentType = keyof ArgumentTypeMap | RegExp | `${typeof EXACT}${string}`;

export type ArgumentList = [...Exclude<ArgumentType, 'rest'>[], ...(['rest'] | [])];

export type ParseArgumentsReturnType<T extends ArgumentType[]>
    = T extends [infer Arg, ...infer Rest]
    ? Arg extends keyof ArgumentTypeMap
        // @ts-expect-error Remove this comment once the ts bug gets fixed
        ? [ArgumentTypeMap[Arg], ...ParseArgumentsReturnType<Rest>]
        : Arg extends `${typeof EXACT}${infer Options}`
            // @ts-expect-error Remove this comment once the ts bug gets fixed
            ? [Split<Options, '|'>, ...ParseArgumentsReturnType<Rest>]
            // @ts-expect-error Remove this comment once the ts bug gets fixed
            : [string, ...ParseArgumentsReturnType<Rest>]
    : [];

export default function parseArgumentsFactory(argumentContent: string) {
    return function parseArguments<T extends ArgumentList>(
        this: TextCommandContext,
        ...types: T
    ): ParseArgumentsReturnType<T> {
        let rest = argumentContent;
        const args = [];
        
        for (const type of types) {
            if (type === 'rest') {
                args.push(rest);
                break;
            }
            if (type === 'string') {
                // parse strings
            }
    
            const [argContent, _rest] = partition(rest, ' ');
            rest = _rest;
    
            if (type instanceof RegExp || type.startsWith(REGEX)) {
                let regexp: RegExp;
                if (typeof type === 'string') {
                    const [, pattern, flags] = type.split('/');
                    regexp = RegExp(pattern, flags);
                }
                else {
                    regexp = type;
                }
                if (regexp.test(argContent)) {
                    args.push(argContent);
                    continue;
                }
                throw new InvalidArgumentError(`${argContent} does not satisfy ${regexp}`)
            }
    
            if (type.startsWith(EXACT)) {
                const field = type.slice(EXACT.length);
                if (field.split('|').includes(argContent)) {
                    args.push(argContent);
                    continue;
                }
                throw new InvalidArgumentError(`${argContent} is not one of ${field}`);
            }
    
            switch (type) {
                case 'string':
                    // remove once quoted string parsing is written
                    args.push(argContent);
                    continue;
                case 'number': {
                    const arg = +argContent;
                    if (isNaN(arg)) {
                        throw new InvalidArgumentError(`${argContent} is not a number`);
                    }
                    args.push(arg);
                    continue;
                }
                case 'int': {
                    const arg = +argContent;
                    if (arg % 1 !== 0) {
                        throw new InvalidArgumentError(`${argContent} is not an integer`);
                    }
                    args.push(arg);
                    continue;
                }
                case 'textChannel':
                    args.push(
                        Promise.resolve()
                            .then(() => parseMaybeMention('#', argContent))
                            .then(x => this.guild?.channels.fetch(x) ?? Promise.reject())
                            .then(ch => ch?.type === 'GUILD_TEXT' ? ch : Promise.reject())
                            .catch(() => {
                                throw new InvalidArgumentError(`Channel ${argContent} could not be found`)
                            })
                    );
                    continue;
                case 'member':
                    args.push(
                        Promise.resolve()
                            .then(() => parseMaybeMention('@!', argContent))
                            .catch(() => parseMaybeMention('@', argContent))
                            .then(x => this.guild?.members.fetch(x) ?? Promise.reject())
                            .catch(() => {
                                throw new InvalidArgumentError(`Member ${argContent} could not be found`)
                            })
                    );
                    continue;
                case 'role':
                    args.push(
                        Promise.resolve()
                            .then(() => parseMaybeMention('@&', argContent))
                            .then(x => this.guild?.roles.fetch(x) ?? Promise.reject())
                            .catch(() => {
                                throw new InvalidArgumentError(`Role ${argContent} could not be found`)
                            })
                    );
                    continue;
                case 'invite':
                    args.push(
                        this.guild?.invites.fetch(argContent)
                            .catch(() => {
                                throw new InvalidArgumentError(`Invite code ${argContent} could not be found`)
                            })
                    );
                    continue;
            }
        }
    
        return args as any;
    }
}

function parseMaybeMention(sigil: string, content: string) {
    if (!content.startsWith('<')) {
        return content;
    }
    if (content.startsWith(`<${sigil}`) && content.endsWith('>')) {
        return content.slice(sigil.length + 1, -1);
    }
    throw new InvalidArgumentError();
}