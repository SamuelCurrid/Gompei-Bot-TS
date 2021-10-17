import { PermissionResolvable, Permissions } from "discord.js";
import { TextCommandContext } from "../plugins/Plugin";

export class AuthorizationError extends Error {}

export function permsFactory(permissions: PermissionResolvable) {
    return function(ctx: TextCommandContext) {
        return ctx.member?.permissions.has(permissions, true) ?? false;
    };
}

export const isAdmin = permsFactory(Permissions.FLAGS.ADMINISTRATOR); 