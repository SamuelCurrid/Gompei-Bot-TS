import { GuildAuditLogs, GuildAuditLogsEntry, Message, MessageEmbed, Permissions, TextChannel } from "discord.js";
import { Store } from "../storage";
import { textCommandPrefix } from "../shared";
import parseCommandArguments from "../util/parseCommandArguments";
import { isAdmin } from "../util/permsValidator";
import { Plugin } from "./Plugin";

interface LoggingStoreData {
    [guildId: string]: GuildStoreData;
}

interface GuildStoreData {
    loggingChannel: string | undefined;
    lastAudit: boolean;
}

class LoggingStore extends Store<LoggingStoreData> {
    configName = 'logging';
    protected defaultConfig = {};

    private cache: LoggingStoreData = this.defaultConfig;

    private async commit() {
        return this.save(this.cache);
    }

    override async init() {
        this.cache = await this.fetch();
    }

    private getOrInitGuild(guild: string) {
        return (this.cache[guild] ??= {
            loggingChannel: undefined,
            lastAudit: true
        });
    }

    for(guildId: string): GuildStoreData {
        const commit = this.commit.bind(this);
        const guildStoreCache = this.getOrInitGuild(guildId);
        return {
            get loggingChannel() {
                return guildStoreCache.loggingChannel;
            },
            set loggingChannel(val) {
                guildStoreCache.loggingChannel = val;
                commit();
            },

            get lastAudit() {
                return guildStoreCache.lastAudit;
            },
            set lastAudit(val) {
                guildStoreCache.lastAudit = val;
                commit();
            },
        };
    }
}

export default Plugin(client => {
    const [storage, latch] = client.storage.load(LoggingStore);

    return {
        name: 'Logging',
        latch,
        textCommands: [
            {
                commandName: 'logging',
                check: isAdmin,
                async callback(ctx) {
                    const [channel] = await Promise.all(ctx.parseArguments('textChannel'));

                    const guildStore = storage.for(channel.guildId);

                    if (guildStore.loggingChannel === channel.id) {
                        ctx.channel.send(`${channel} is already being used for logging.`);
                    }
                    else {
                        guildStore.loggingChannel = channel.id;
    
                        ctx.channel.send(`Successfully updated logging channel to ${channel}.`);
                    }
                }
            }
        ],
        eventListeners: {
            'messageDelete': async message => {
                if (message.channel.type === 'DM' || !message.guildId || !message.guild) return;
                const guildStore = storage.for(message.guildId);

                if (!guildStore.loggingChannel) return;

                if (!message.author?.bot) {
                    const embed = new MessageEmbed({
                        title: `Message deleted in #${message.channel.name}`,
                        color: 0xbe4041,
                        description: message.content!
                    });

                    const prevMessage = (await message.channel.messages.fetch({ before: message.id, limit: 1 })).first();
                    if (prevMessage) {
                        embed.description += `\n[Previous Message](${prevMessage.url})`
                    }

                    if (message.reference) {
                        try {
                            await message.channel.messages.fetch(message.reference.messageId!)
                            embed.addField(
                                'Reply to',
                                `https://discord.com/channels/${message.reference.guildId}/${message.reference.channelId}/${message.reference.messageId}`
                            );
                        }
                        catch (e) {
                            embed.description += '\nReplied to deleted message';
                        }
                    }

                    if (message.attachments.size > 0) {
                        embed.addFields(message.attachments.map(x => ({
                            name: "Attachment",
                            value: x.proxyURL
                        })));
                    }

                    if (guildStore.lastAudit) {
                        const auditLog = (await message.guild.fetchAuditLogs({ type: GuildAuditLogs.Actions.MESSAGE_DELETE, limit: 1 })).entries.first();
    
                        if (auditLog) {
                            embed.description += `\n\n**Deleted by ${auditLog.executor}**`;
                        }
                    }

                    embed.setAuthor(
                            `${message.author?.username}#${message.author?.discriminator}`,
                            message.author?.avatarURL()!)
                        .setFooter(`ID: ${message.author?.id}`)
                        .setTimestamp(Date.now());
                    
                    const loggingChannel = await message.guild?.channels.fetch(guildStore.loggingChannel) as TextChannel;
                    loggingChannel.send({ embeds: [embed] });
                }
            }
        }
    };
});