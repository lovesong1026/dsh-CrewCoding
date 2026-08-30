import { jsx as _jsx } from "react/jsx-runtime";
import { ActivityPanel } from "./ActivityPanel.js";
import { CrewCard } from "./CrewCard.js";
import { crewCardDefinition } from "./crew-card-definition.js";
import { CREW_LOCALE_NAMESPACE, en, zh, } from "./locales.js";
import { openAgentTeamMember } from "./session-navigation.js";
/** Required services: conversation UI, slots, sessions navigation, locale, and model catalog. */
export const inject = [
    'uiConversation',
    'slots',
    'sessions',
    'locale',
    'modelDirectories',
];
/** The replayed user message is the canonical transcript entry. */
function HiddenCrewCommand() {
    return null;
}
/**
 * Register the activity monitor in the shell's additive overlay and the
 * in-conversation team card. The card's activity button re-opens a folded
 * monitor via a window event — the recovery path for an old session.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(CREW_LOCALE_NAMESPACE, { zh, en }), 'crew: dictionaries');
    const openMember = (parentId, childId) => {
        void openAgentTeamMember(ctx.sessions, parentId, childId).catch((error) => {
            console.warn(`crew: failed to open member transcript ${childId}: ${String(error)}`);
        });
    };
    const Panel = ({ t }) => (_jsx(ActivityPanel, { sessionsList: ctx.sessions.list, modelDirectories: ctx.modelDirectories, openMember: openMember, t: t }));
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'crew-activity',
        order: 80,
        label: 'Crew activity',
        locale: CREW_LOCALE_NAMESPACE,
    }, Panel));
    // The host command is only the slash-menu/admission surface. Its input is
    // replayed as the visible user message, so the generic result row would be
    // a duplicate placed before that message by command lifecycle ordering.
    ctx.slots.inject('conversation.chat.commandview', () => ctx.slots.register({
        name: 'conversation.chat.commandview',
        key: 'crew',
    }, HiddenCrewCommand));
    ctx.uiConversation.events.register(crewCardDefinition);
    ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
        name: 'conversation.chat.node',
        key: 'crew',
        locale: CREW_LOCALE_NAMESPACE,
        inject: () => ({
            openMember,
        }),
    }, CrewCard));
}
