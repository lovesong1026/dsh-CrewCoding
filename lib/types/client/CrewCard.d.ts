/**
 * Crew conversation card: the lightweight in-conversation summary for
 * one team — the captain's whale avatar and name, the member roster as
 * clickable whale avatars (opening the member's subagent transcript), and
 * an "activity panel" button that re-activates the top-right floater.
 *
 * The floater and this card share the `crew:open-panel` window event
 * so the card can summon the panel even after it was closed (or when an old
 * session is re-opened for review).
 * @module dsh-crew/client/card
 */
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
/** Window event name the floater listens for to open itself. */
export declare const OPEN_PANEL_EVENT = "crew:open-panel";
/** Navigation action injected from the plugin's own SessionsService access. */
export interface CrewCardInjected {
    readonly openMember: (parentId: SessionId, childId: SessionId) => void;
}
/** Complete keyed Chat renderer props. */
export type CrewCardProps = PropsRuntime<'conversation.chat.node', 'crew'> & PropsLocale<'crew'> & CrewCardInjected;
/** Render one durable team as a compact conversation card. */
export declare function CrewCard({ node, openMember, sessionId, t }: CrewCardProps): import("react").JSX.Element;
