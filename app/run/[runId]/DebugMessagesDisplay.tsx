"use client";
import { withData } from "@/data/withData";
import { FlowMessage } from "@/models/types/FlowMessage";
import { groupBy, isNull, sortBy } from "lodash";
import { DebugMessageDisplay } from "./DebugMessageDisplay";
import { DataFnType } from "@/data/component";
import { Observable, of } from "rxjs";
import { Step } from "@/models/types/Step";
import { getObsForDoc } from "@/firebase/readerFe";
import {
  StepRun,
  getNextStepRunState,
  getStepRunId,
  stepRunStateOrder,
  StepRunState,
} from "@/models/types/StepRun";
import { ColorRing } from "react-loader-spinner";
import { JsonView, defaultStyles } from "react-json-view-lite";
import { JsonDisplay } from "./JsonDisplay";

const groupDisplayDataFn: DataFnType<
  { step: Observable<Step | null>; stepRun: Observable<StepRun | null> },
  {},
  {
    flowRunId: string;
    stepId: string | null;
    messageGroup: FlowMessage[];
  }
> = ({ props: { stepId, flowRunId } }) => {
  return {
    step: isNull(stepId) ? of(null) : getObsForDoc("step", stepId),
    stepRun: isNull(stepId)
      ? of(null)
      : getObsForDoc("stepRun", getStepRunId(flowRunId, stepId)),
  };
};

const finishedText = "Step Completed";
const stepStatePrettyNameMap: Record<keyof StepRunState, string> = {
  dataCollectionCompletedAt: "Collecting Data From User",
  promptCompletedAt: "Executing Prompt",
  outputVariableSavingCompletedAt: "Saving Output Variables",
  finalResponseCompletedAt: "Sending Response back to User",
  stepCompletedAt: finishedText,
};

const StepDataDisplay = ({
  stepRun,
  step,
}: {
  stepRun: StepRun;
  step: Step;
}) => {
  const allInputVariables = Object.keys(
    step?.variableDescriptions || {}
  ).reduce((acc, key) => {
    return {
      ...acc,
      [key]: stepRun?.variableValues?.[key],
    };
  }, {} as Record<string, string | undefined>);

  const allOutputVariables = Object.keys(
    step?.outputVariableDescriptions || {}
  ).reduce((acc, key) => {
    return {
      ...acc,
      [key]: stepRun?.variableValues?.[key],
    };
  }, {} as Record<string, string | undefined>);

  const currentState = getNextStepRunState(stepRun.state || {});
  const prettyName = currentState
    ? stepStatePrettyNameMap[currentState]
    : finishedText;

  return (
    <div className="flex flex-col">
      <div className="flex gap-2">
        <div>Current State:</div>
        <div>{prettyName}</div>
      </div>
      <div>
        <div>Input Vars</div>
        <JsonDisplay data={allInputVariables}></JsonDisplay>
      </div>
      <div>
        <div>Output vars</div>
        <JsonDisplay data={allOutputVariables}></JsonDisplay>
      </div>
    </div>
  );
};

const DebugMessageGroupDisplay = withData(
  groupDisplayDataFn,
  ({ data: { step, stepRun }, messageGroup }) => {
    const stepTitle = step
      ? `Step ${step.index + 1}: ${step.title}`
      : "Pending";

    const stepRunDataDisplay =
      stepRun && step ? (
        <StepDataDisplay stepRun={stepRun} step={step}></StepDataDisplay>
      ) : (
        <ColorRing height={"1rem"}></ColorRing>
      );

    return (
      <div className="bg-gray-200 p-3 shadow-lg flex-col flex gap-3 flex-shrink-0">
        <div className="font-bold">{stepTitle}</div>
        <div className="mb-4">{stepRunDataDisplay}</div>
        <div className="flex flex-col-reverse">
          {messageGroup.map((message) => {
            return (
              <DebugMessageDisplay
                message={message}
                key={message.uid}
              ></DebugMessageDisplay>
            );
          })}
        </div>
      </div>
    );
  }
);

export const DebugMessagesDisplay = ({
  messages,
  flowRunId,
}: {
  messages: FlowMessage[];
  flowRunId: string;
}) => {
  const groupedByProcessedForStep = groupBy(messages, (_) => {
    return _.processedForStep || null;
  });
  const sortedEntries = sortBy(
    Object.entries(groupedByProcessedForStep),
    ([_, value]) => -1 * value[0].createdAt.toMillis()
  );

  return (
    <div className="flex flex-col-reverse pt-3 gap-3 overflow-auto">
      {sortedEntries.map(([stepId, messageGroup]) => {
        return (
          <DebugMessageGroupDisplay
            flowRunId={flowRunId}
            messageGroup={sortBy(
              messageGroup,
              (_) => -1 * _.createdAt.toMillis()
            )}
            stepId={stepId}
            key={stepId}
          ></DebugMessageGroupDisplay>
        );
      })}
    </div>
  );
};
