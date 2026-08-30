/**
 * Crew session event types — pure types only, zero imports.
 *
 * This file intentionally imports nothing: both the host program (the
 * emitter in `events.ts`) and the browser program (the Conversation Node
 * definition) must be able to load these types and the `SessionEventMap`
 * declaration merge without pulling in host-side `Context` augmentations
 * (dsh-session's index declares `Context.sessions: SessionStore`, which
 * collides with the browser runtime's `ISessions` under the same name).
 * @module dsh-crew/event-types
 */
/** Opens one team record: the captain created the team. */
export interface CrewTeamCreatedData {
    readonly teamId: string;
    /** The captain session that owns this team (UI follows it). */
    readonly captainSessionId: string;
    readonly name: string;
    readonly description?: string;
    readonly profile?: string;
}
/** Records one member after its continuable subagent is spawned. */
export interface CrewMemberAddedData {
    readonly teamId: string;
    readonly memberId: string;
    readonly name: string;
    readonly role?: string;
}
/** Marks one member removed. */
export interface CrewMemberRemovedData {
    readonly teamId: string;
    readonly memberId: string;
}
/** Records one task in the team's task list. */
export interface CrewTaskCreatedData {
    readonly teamId: string;
    readonly taskId: string;
    readonly subject: string;
    readonly dependencies: readonly string[];
    readonly assignee?: string;
    readonly kind?: string;
    readonly round?: number;
}
/** Records one task status/assignee/output transition. */
export interface CrewTaskUpdatedData {
    readonly teamId: string;
    readonly taskId: string;
    readonly status: string;
    readonly assignee?: string;
    readonly output?: string;
    readonly attempt?: number;
    readonly attemptId?: string;
    readonly verdict?: string;
    readonly round?: number;
}
/** Records a human halt from the captain chat. */
export interface CrewTeamHaltedData {
    readonly teamId: string;
    readonly cancelledTasks: number;
}
/** Records an explicit captain resume of a halted team. */
export interface CrewTeamResumedData {
    readonly teamId: string;
    readonly reason: string;
}
/** Closes one team record: the team was deleted. */
export interface CrewTeamDeletedData {
    readonly teamId: string;
}
/** Records a staged plan that the user rejected before any member was spawned. */
export interface CrewPlanDiscardedData {
    readonly teamId: string;
}
/** Records one mailbox message sent between team agents. */
export interface CrewMessageSentData {
    readonly teamId: string;
    readonly messageId: string;
    /** `captain` or a member name. */
    readonly from: string;
    /** `captain` or a member name. */
    readonly to: string;
    readonly content: string;
    readonly ts: number;
}
declare module '@deepseek-ai/dsh-session/types' {
    interface SessionEventMap {
        /**
         * Opens one team record.
         * @param data - stable team identity and display name.
         */
        'crew/team-created': CrewTeamCreatedData;
        /**
         * Records one team member.
         * @param data - team identity, member child session, and display identity.
         */
        'crew/member-added': CrewMemberAddedData;
        /**
         * Records one member removal.
         * @param data - team identity and the member's child session id.
         */
        'crew/member-removed': CrewMemberRemovedData;
        /**
         * Records one task creation.
         * @param data - team identity, task id, subject, dependencies, assignee.
         */
        'crew/task-created': CrewTaskCreatedData;
        /**
         * Records one task transition.
         * @param data - team identity, task id, and the new status/assignee/output.
         */
        'crew/task-updated': CrewTaskUpdatedData;
        /**
         * Records one mailbox message.
         * @param data - team identity, sender, recipient, and content.
         */
        'crew/message-sent': CrewMessageSentData;
        /**
         * Records a human halt from the captain chat.
         * @param data - team identity and how many unfinished tasks were cancelled.
         */
        'crew/team-halted': CrewTeamHaltedData;
        /**
         * Records an explicit captain resume.
         * @param data - team identity and the resume reason.
         */
        'crew/team-resumed': CrewTeamResumedData;
        /**
         * Closes one team record after deletion.
         * @param data - stable team identity.
         */
        'crew/team-deleted': CrewTeamDeletedData;
        /**
         * Closes a staged plan rejected during pre-run review.
         * @param data - stable team identity.
         */
        'crew/plan-discarded': CrewPlanDiscardedData;
    }
}
/** The full set of `crew/*` event names. */
export type CrewEventType = 'crew/team-created' | 'crew/member-added' | 'crew/member-removed' | 'crew/task-created' | 'crew/task-updated' | 'crew/message-sent' | 'crew/team-halted' | 'crew/team-resumed' | 'crew/team-deleted' | 'crew/plan-discarded';
