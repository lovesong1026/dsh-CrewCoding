/**
 * Editable pre-run roster and DAG review for staged Crew plans.
 *
 * This leaf owns only transient form/disclosure state. Durable truth remains
 * on the host and returns through the ordinary activity polling snapshot.
 * @module dsh-crew/client/staging-plan
 */
import type { ModelDirectory } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type { ActivityTeam } from './activity-monitor.ts';
import type { CrewTranslate } from './locales.ts';
export declare function StagingPlanEditor({ team, modelDirectory, onContinuePlanning, onDiscarded, t }: {
    readonly team: ActivityTeam;
    readonly modelDirectory: ModelDirectory;
    readonly onContinuePlanning: () => void;
    readonly onDiscarded: () => void;
    readonly t: CrewTranslate;
}): import("react").JSX.Element;
