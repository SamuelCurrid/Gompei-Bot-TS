declare module NodeJS {
    interface ProcessEnv {
        BOT_TOKEN?: string;
        PREFIX?: string;
        COMMAND_SHADOWING?: boolean;
    }
}