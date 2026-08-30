/** Browser plugin for the Crew activity floater and conversation card. */
import type { ClientContext, ConversationEventRegistry } from '@deepseek-ai/dsh-client-runtime/client';
import { type CrewLocaleKey } from './locales.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        uiConversation: {
            readonly events: ConversationEventRegistry;
        };
    }
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Crew conversation card and activity monitor copy. */
        crew: CrewLocaleKey;
    }
}
/** Required services: conversation UI, slots, sessions navigation, locale, and model catalog. */
export declare const inject: string[];
/**
 * Register the activity monitor in the shell's additive overlay and the
 * in-conversation team card. The card's activity button re-opens a folded
 * monitor via a window event — the recovery path for an old session.
 */
export declare function apply(ctx: ClientContext): void;
