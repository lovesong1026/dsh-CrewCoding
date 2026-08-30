/** Browser plugin for the Crew activity floater and conversation card. */

import type {
  ClientContext,
  ConversationEventRegistry,
  SessionId,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the official browser locale service into ClientContext.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Module-loading import: the card registers into the conversation chat-node
// slot, whose keyed renderer map lives in the ui-conversation contract.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// The frame-level overlay is declared by ui-layout. This import is type-only;
// ctx.slots.inject below owns the runtime wait for the declaration.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Official model catalog/directory service. The staged roster reads its
// provider/model/effort metadata without mutating the captain's own selection.
import type {} from '@deepseek-ai/dsh-client-ui-model-selection/client'
import { ActivityPanel } from './ActivityPanel.tsx'
import { CrewCard, type CrewCardInjected } from './CrewCard.tsx'
import { crewCardDefinition } from './crew-card-definition.ts'
import {
  CREW_LOCALE_NAMESPACE, en, zh, type CrewLocaleKey,
} from './locales.ts'
import { openAgentTeamMember } from './session-navigation.ts'

// The target Harness exposes the conversation event registry through the
// ui-conversation service. Keep this structural augmentation until the locked
// client package publishes the same service declaration.
declare module '@deepseek-ai/cordis' {
  interface Context {
    uiConversation: {
      readonly events: ConversationEventRegistry
    }
  }
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Crew conversation card and activity monitor copy. */
    crew: CrewLocaleKey
  }
}

/** Required services: conversation UI, slots, sessions navigation, locale, and model catalog. */
export const inject = [
  'uiConversation',
  'slots',
  'sessions',
  'locale',
  'modelDirectories',
]

/** The replayed user message is the canonical transcript entry. */
function HiddenCrewCommand(): null {
  return null
}

/**
 * Register the activity monitor in the shell's additive overlay and the
 * in-conversation team card. The card's activity button re-opens a folded
 * monitor via a window event — the recovery path for an old session.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(
    () => ctx.locale.register(CREW_LOCALE_NAMESPACE, { zh, en }),
    'crew: dictionaries',
  )
  const openMember = (parentId: SessionId, childId: SessionId): void => {
    void openAgentTeamMember(ctx.sessions, parentId, childId).catch((error: unknown) => {
      console.warn(`crew: failed to open member transcript ${childId}: ${String(error)}`)
    })
  }
  const Panel = ({ t }: PropsLocale<'crew'>) => (
    <ActivityPanel
      sessionsList={ctx.sessions.list}
      modelDirectories={ctx.modelDirectories}
      openMember={openMember}
      t={t}
    />
  )
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'crew-activity',
    order: 80,
    label: 'Crew activity',
    locale: CREW_LOCALE_NAMESPACE,
  }, Panel))

  // The host command is only the slash-menu/admission surface. Its input is
  // replayed as the visible user message, so the generic result row would be
  // a duplicate placed before that message by command lifecycle ordering.
  ctx.slots.inject('conversation.chat.commandview', () => ctx.slots.register({
    name: 'conversation.chat.commandview',
    key: 'crew',
  }, HiddenCrewCommand))

  ctx.uiConversation.events.register(crewCardDefinition)
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'crew',
    locale: CREW_LOCALE_NAMESPACE,
    inject: (): CrewCardInjected => ({
      openMember,
    }),
  }, CrewCard))
}
