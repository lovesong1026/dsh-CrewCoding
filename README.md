# dsh-CrewCoding

> Controlled multi-agent coding for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

dsh-CrewCoding keeps ordinary work with DSH’s primary agent. It starts a small team only when code needs parallel review or a controlled implementation-and-verification loop.

## Two commands, two jobs

| Command | Use it for | What runs |
| --- | --- | --- |
| `/crew-check <goal>` | Security and performance review | Two read-only reviewers run in parallel. |
| `/crew-build <goal>` | Features, refactors, cross-module changes | One implementer writes; one verifier independently reviews and tests. |

There is deliberately no generic `/crew` command and no natural-language auto-routing. A small coding request should stay with the primary DSH agent.

## Why it is safe to use in one workspace

- **One writer at a time.** Implementation and repair tasks acquire a durable write lease. Read, review, and test tasks can still run concurrently.
- **Explicit plan approval.** A command creates a staged roster and task graph first. Nothing is spawned until you choose **Approve & Run**.
- **Scoped delivery.** Writing tasks record their expected paths, acceptance criteria, verification commands, changed paths, and evidence.
- **Independent verification.** The implementer does not approve its own change. The verifier reviews the resulting diff and runs relevant checks.
- **Durable coordination.** Team state is stored under `<workspace>/.crew-coding/`; task attempts reject stale updates after a handoff or retry.

> The write lease prevents plugin-scheduled writers from overlapping. It is not a host-level sandbox that can physically stop an arbitrary shell command issued by a model.

## What happens when you run a command

```text
/crew-check authentication middleware
  → staged plan
  → approve
  → security + performance reviewers run in parallel
  → one evidence-based report

/crew-build add rate limiting to the API
  → staged plan
  → approve
  → implementer writes
  → verifier reviews diff and runs checks
  → repair only if verification finds a real issue
```

The Web UI keeps the right-top activity monitor: current task, active member, write status, and progress are visible without taking over the conversation.

## Install

### From npm

```sh
dsh plugin --profile web add @nanmicoder/dsh-crew-coding
```

### From a local checkout

```sh
pnpm install
pnpm build
dsh plugin --profile web add /absolute/path/to/dsh-CrewCoding
```

Validate the composed profile, then restart DSH:

```sh
dsh --profile web --dump-config
dsh web --no-open
```

## Default profiles

The distributed bundle provides the following minimal profiles:

```yaml
profiles:
  check:
    # security + performance, both read-only
  build:
    # implementer writes, verifier stays read-only
```

A profile override replaces the complete plugin config row, so repeat every setting you need:

```yaml
- id: crew-coding
  config:
    stateDir: .crew-coding
    memberProvider: spawn
    memberMaxDepth: 1
    maxMembers: 3
    profiles:
      # your check/build profile definitions
```

`memberMaxDepth: 1` allows the Captain to create direct members while preventing those members from delegating again.

## Development

```sh
pnpm install
pnpm build
pnpm verify
```

After host, package, or profile changes, restart DSH. After a normal client rebuild, refresh the current Web page.

## Boundaries

- This plugin is for coding collaboration, not general-purpose research routing.
- One Captain owns one active team at a time.
- It never deploys or performs external side effects without an explicit user request.
- Multiple DSH processes must not operate on the same `.crew-coding` team state.

## License

[MIT](./LICENSE)
