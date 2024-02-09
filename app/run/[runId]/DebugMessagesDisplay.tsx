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
import { JsonView, defaultStyles } from "react-json-view-lite";
import { JsonDisplay } from "./JsonDisplay";
import { useEffect, useRef } from "react";
import { ClipLoader } from "react-spinners";

const groupDisplayDataFn: DataFnType<
  { step: Observable<Step | null>; stepRun: Observable<StepRun | null> },
  {},
  {
    flowRunId: string;
    stepId: string;
    messageGroup: FlowMessage[];
    isLatestStep: boolean;
  }
> = ({ props: { stepId, flowRunId } }) => {
  return {
    step: stepId === pendingKey ? of(null) : getObsForDoc("step", stepId),
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
  ({ data: { step, stepRun }, messageGroup, isLatestStep, stepId }) => {
    const stepTitle = step
      ? `Step ${step.index + 1}: ${step.title}`
      : "Pending";

    const stepRunDisplayReady = stepRun && step;

    const isPendingStep = stepId === pendingKey;

    const stepRunDataDisplay = stepRunDisplayReady ? (
      <StepDataDisplay stepRun={stepRun} step={step}></StepDataDisplay>
    ) : isPendingStep ? null : (
      <ClipLoader size={"1rem"}></ClipLoader>
    );

    const messageListRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (messageListRef.current && (stepRunDisplayReady || isPendingStep)) {
        console.log(
          "nessage lsirt ref",
          messageListRef.current.firstElementChild
        );
        const firstChild = messageListRef.current.firstElementChild;
        if (firstChild) {
          setTimeout(() => {
            console.log("SCROLLING");
            firstChild.scrollIntoView({ behavior: "smooth", block: "end" });
          });
        }
      }
    }, [isLatestStep, messageGroup.length, stepRunDisplayReady, isPendingStep]);

    return (
      <div
        className="bg-gray-200 p-3 shadow-lg flex gap-3 flex-shrink-0 flex-col-reverse"
        ref={messageListRef}
      >
        {messageGroup.map((message) => {
          return (
            <DebugMessageDisplay
              message={message}
              key={message.uid}
            ></DebugMessageDisplay>
          );
        })}
        <div className="sticky top-0 bg-slate-200">
          <div className="font-bold">{stepTitle}</div>
          <div className="mb-4">{stepRunDataDisplay}</div>
        </div>
      </div>
    );
  }
);

const pendingKey = "PENDING";

export const DebugMessagesDisplay = ({
  messages,
  flowRunId,
}: {
  messages: FlowMessage[];
  flowRunId: string;
}) => {
  const groupedByProcessedForStep = groupBy(messages, (_) => {
    return _.processedForStep || pendingKey;
  });
  const sortedEntries = sortBy(
    Object.entries(groupedByProcessedForStep),
    ([_, value]) =>
      _ === pendingKey
        ? -1 * Number.MAX_SAFE_INTEGER
        : -1 * value[0].createdAt.toMillis()
  );

  return (
    <div className="flex flex-col-reverse gap-3 overflow-auto justify-start">
      {sortedEntries.map(([stepId, messageGroup], i) => {
        return (
          <DebugMessageGroupDisplay
            isLatestStep={i === 0}
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
