import type { Context } from '@deepseek-ai/cordis'
import type { PreStepDecision } from '@deepseek-ai/dsh-agent'
import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import { createUserMessage, type UserMessage } from '@deepseek-ai/dsh-llm'
import { parseProfileInvocation, resolveProfileTaskPlanning, type TeamProfileConfig, type CrewInvocation } from './profiles.ts'

export const CREW_COMMAND = 'crew'
const PROFILE_COMMAND_PREFIX = `${CREW_COMMAND}-`

declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'crew-command': { readonly kind: 'crew-command'; readonly goal?: string; readonly profile?: string }
  }
}

/**
 * Convert a configured profile key into a stable, closed-namespace command
 * suffix. Only lowercase ASCII letters, digits and dashes are representable;
 * this deliberately prevents accidental command aliases for ambiguous profile
 * names such as `foo bar`, `foo_bar`, or non-ASCII keys.
 */
export function profileCommandName(profileName: string): string | undefined {
  const normalized = profileName.trim().toLowerCase()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(normalized)) return undefined
  return `${PROFILE_COMMAND_PREFIX}${normalized}`
}

/** Resolve a profile command only when it maps uniquely to a live profile. */
function profileForCommand(commandName: string, profiles: Record<string, TeamProfileConfig>): string | undefined {
  const matches = Object.keys(profiles).filter((profileName) => profileCommandName(profileName) === commandName)
  return matches.length === 1 ? matches[0] : undefined
}

/** Parse either the generic command or one generated profile alias. */
function parseCommandText(text: string, profiles: Record<string, TeamProfileConfig>): CrewInvocation | undefined {
  const trimmed = text.trimStart()
  if (!trimmed.startsWith(`/${PROFILE_COMMAND_PREFIX}`)) return undefined
  const tokenEnd = trimmed.search(/[\t\n\r ]/u)
  const commandName = trimmed.slice(1, tokenEnd === -1 ? undefined : tokenEnd)
  const profile = profileForCommand(commandName, profiles)
  if (profile === undefined) return undefined
  return { profile, goal: (tokenEnd === -1 ? '' : trimmed.slice(tokenEnd)).trim() }
}

export function invokedCrewInvocation(messages: readonly UserMessage[], getProfiles: () => Record<string, TeamProfileConfig> = () => ({})): CrewInvocation | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message === undefined || message.source.kind !== 'user') continue
    for (const block of message.content) {
      if (block.type !== 'text') continue
      const invocation = parseCommandText(block.text, getProfiles())
      if (invocation !== undefined) return invocation
    }
  }
  return undefined
}

export function invokedCrewGoal(messages: readonly UserMessage[]): string | undefined {
  return invokedCrewInvocation(messages)?.goal
}

export function buildActivationDirective(goal: string, profile?: string, taskPlanning: 'captain' | 'seed' = 'seed'): string {
  const lines = [
    'The user invoked an explicit CrewCoding profile command. Activate the coding-team protocol now: you are the captain.',
    'Call crew_create with approval="required". Build the complete staged roster and DAG, then stop and ask the user to review the Web plan. Do not approve or start it in this same turn.',
  ]
  if (profile !== undefined) {
    lines.push(`Use configured Crew profile "${profile}" when calling crew_create.`)
    if (taskPlanning === 'captain') {
      lines.push(
        'This profile supplies the roster and guardrails. After create, do not recreate members.',
        'Derive the smallest useful task graph from the goal while the team is staged; do not ask the user whether to split, merge, serialize, or parallelize.',
        'Independent supplemental work must become separate ready tasks so idle members can run in parallel. Add dependencies only for genuine prerequisites and later synthesis.',
      )
    } else {
      lines.push('Do not recreate the same members or seed tasks manually.')
    }
  }
  lines.push(goal === '' ? 'The goal was not given — ask the user what the team should accomplish.' : `Goal: ${goal}`)
  return lines.join('\n')
}

export function registerCrewCommand(ctx: Context, getProfiles: () => Record<string, TeamProfileConfig> = () => ({})): void {
  ctx.effect(() => {
    const dispose: Array<() => void> = []
    for (const profileName of Object.keys(getProfiles())) {
      const commandName = profileCommandName(profileName)
      if (commandName === undefined) continue
      dispose.push(ctx.commands.register({
        name: commandName,
        description: `run a goal with the Crew ${profileName} profile`,
        input: { hint: '<goal>' },
        handler(invocation: CommandInvocation): CommandResult {
          const profile = profileForCommand(commandName, getProfiles())
          if (profile === undefined) return { kind: 'error', text: `Crew profile command "/${commandName}" is unavailable` }
          invocation.agent.followup(createUserMessage({ content: [{ type: 'text', text: `/${commandName}${invocation.rawInput}` }], source: { kind: 'user' } }))
          return { kind: 'success', text: `Crew activated with profile ${profile} — the captain will assemble the team.` }
        },
      }))
    }
    return () => {
      for (const unregister of dispose.reverse()) unregister()
    }
  }, 'crew: slash commands')
}

export function installCrewGestureBoundary(ctx: Context, getProfiles: () => Record<string, TeamProfileConfig> = () => ({})): void {
  ctx.on('agent/pre-step', async ({ messages, signal }, next): Promise<PreStepDecision> => {
    const decision = await next()
    if (decision.kind === 'reject') return decision
    let invocation: CrewInvocation | undefined
    try { invocation = invokedCrewInvocation(messages, getProfiles) } catch (error: unknown) { return { kind: 'enter', messages: [...decision.messages, createUserMessage({ content: [{ type: 'text', text: `Crew profile parsing failed: ${String(error)}` }], source: { kind: 'crew-command' } })] } }
    if (invocation === undefined) return decision
    signal.throwIfAborted()
    const profiles = getProfiles()
    const matched = invocation.profile === undefined
      ? undefined
      : Object.entries(profiles).find(([key]) => key.trim() === invocation.profile)
    const known = invocation.profile === undefined || matched !== undefined
    const text = !known
      ? `Crew profile "${invocation.profile}" does not exist. Available profiles: ${Object.keys(profiles).join(', ') || '(none)'}. Do not create a team.`
      : buildActivationDirective(invocation.goal, invocation.profile, resolveProfileTaskPlanning(matched?.[1]))
    return { kind: 'enter', messages: [...decision.messages, createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'crew-command', ...invocation.goal === '' ? {} : { goal: invocation.goal }, ...invocation.profile === undefined ? {} : { profile: invocation.profile } } })] }
  })
}
