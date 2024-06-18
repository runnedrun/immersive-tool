"use client";
import { withData } from "@/data/withData";
import { FlowMessage } from "@/models/types/FlowMessage";
import { groupBy, isNull, sortBy } from "lodash";
import { DebugMessageDisplay } from "./DebugMessageDisplay";
import { DataFnType } from "@/data/component";
import { Observable, of } from "rxjs";
import { Step } from "@/models/types/Step";
import { getObsForDoc, readDoc } from "@/firebase/readerFe";
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
import { PopupMenu } from "@/components/mine/PopupMenu";
import { fbCreate, fbSet } from "@/firebase/settersFe";
import { FlowRun } from "@/models/types/FlowRun";
import { Timestamp } from "firebase/firestore";
import {
  triggerProcessForJobNameAndId,
  triggerProcessOnWrite,
} from "@/data/helpers/triggerProcessOnWrite";
import { useRouter } from "next/navigation";

const groupDisplayDataFn: DataFnType<
  { step: Observable<Step | null>; stepRun: Observable<StepRun | null> },
  {},
  {
    flowRunId: string;
    stepId: string;
    messageGroup: FlowMessage[];
    isLatestStep: boolean;
    duplicateFromHere: () => Promise<void>;
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
  directFunctionRunCompletedAt: "Directly running function",
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
  ({
    data: { step, stepRun },
    messageGroup,
    isLatestStep,
    stepId,
    duplicateFromHere,
  }) => {
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
        const firstChild = messageListRef.current.firstElementChild;
        if (firstChild) {
          setTimeout(() => {
            firstChild.scrollIntoView({ behavior: "smooth", block: "end" });
          });
        }
      }
    }, [isLatestStep, messageGroup.length, stepRunDisplayReady, isPendingStep]);

    return (
      <div
        className="bg-gray-200 shadow-lg flex gap-3 flex-shrink-0 flex-col-reverse"
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
        <div className="sticky top-0 bg-slate-100 shadow-lg p-3 text-xs">
          <div className="font-bold flex items-center gap-2">
            <div>{stepTitle}</div>
            <div>
              <PopupMenu
                options={[
                  {
                    label: "Duplicate run from here",
                    action: () => {
                      return duplicateFromHere();
                    },
                  },
                ]}
              ></PopupMenu>
            </div>
          </div>
          <div className="mb-4">{stepRunDataDisplay}</div>
        </div>
      </div>
    );
  }
);

const pendingKey = "PENDING";

export const DebugMessagesDisplay = ({
  messages,
  flowRun,
}: {
  messages: FlowMessage[];
  flowRun: FlowRun;
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

  const router = useRouter();
  return (
    <div className="flex flex-col-reverse gap-3 overflow-auto justify-start min-h-0 grow">
      {sortedEntries.map(([stepId, messageGroup], i) => {
        const duplicateFromHere = async () => {
          const newRun = await fbCreate("flowRun", {
            flowKey: flowRun.flowKey,
            allowInput: true,
            completedAt: null,
            queryParams: flowRun.queryParams || null,
            isDebug: true,
          });

          const now = Date.now();
          let count = 0;
          await Promise.all(
            [...sortedEntries]
              .reverse()
              .slice(0, sortedEntries.length - 1 - i)
              .map(async ([stepId, messages]) => {
                const stepRun = await readDoc(
                  "stepRun",
                  getStepRunId(flowRun.uid, stepId)
                );
                const newStepRun = await fbCreate(
                  "stepRun",
                  {
                    ...stepRun,
                    flowRunKey: newRun.id,
                  },
                  { id: getStepRunId(newRun.id, stepId) }
                );
                return messages.map((message) => {
                  count++;
                  fbCreate(
                    "flowMessage",
                    {
                      ...message,
                      flowRunKey: newRun.id,
                      processedForStepRunKey: newStepRun.id,
                    },
                    { createdAt: Timestamp.fromMillis(now + count) }
                  );
                });
              })
          );
          await triggerProcessForJobNameAndId("flowRun", newRun.id);
          window.open(`/run/${newRun.id}?debug=true`, "_blank");
        };
        return (
          <DebugMessageGroupDisplay
            isLatestStep={i === 0}
            flowRunId={flowRun.uid}
            messageGroup={sortBy(
              messageGroup,
              (_) => -1 * _.createdAt.toMillis()
            )}
            duplicateFromHere={duplicateFromHere}
            stepId={stepId}
            key={stepId}
          ></DebugMessageGroupDisplay>
        );
      })}
    </div>
  );
};
