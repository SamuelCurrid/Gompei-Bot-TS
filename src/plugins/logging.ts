import { makePlugin } from "./Plugin";

export default makePlugin({
    name: 'Logging',
    init: (client) => ({
        client,
        statuses: []
    }),
    textCommands: [
        {
            commandName: 'logging',
            callback: (state, msg) => {
                console.log(msg.content);
            }
        }
    ]
});