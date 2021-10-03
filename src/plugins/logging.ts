import parseCommandArguments from "../util/parseCommandArguments";
import { Plugin } from "./Plugin";

export default Plugin(client => {
    let commandsFired = 0;

    return {
        name: 'Logging',
        textCommands: [
            {
                commandName: 'logging',
                callback: async (ctx) => {
                    commandsFired++;
                    try {
                        await parseCommandArguments(ctx, 'exact:number');
                        ctx.channel.send(`Commands have been fired ${commandsFired} times.`)
                    }
                    catch (_) {
                        console.log(ctx.content);
                    }
                }
            },
            {
                commandName: 'channel',
                callback: async (ctx) => {
                    const [channel, rest] = await parseCommandArguments(ctx, 'textChannel', 'rest');
                    commandsFired++;
                    ctx.channel.send(`Sent "${rest}" in ${channel}`);
                }
            }
        ]
    };   
});