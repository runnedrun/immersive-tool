"use client";
import { withData } from "@/data/withData";
import { FlowMessage } from "@/models/types/FlowMessage";
import { groupBy, isNull } from "lodash";
import { DebugMessageDisplay } from "./DebugMessageDisplay";
import { DataFnType } from "@/data/component";
import { Observable, of } from "rxjs";
import { Step } from "@/models/types/Step";
import { getObsForDoc } from "@/firebase/readerFe";
import { StepRun, getStepRunId } from "@/models/types/StepRun";
import { ColorRing } from "react-loader-spinner";
import { JsonView, defaultStyles } from "react-json-view-lite";
import { JsonDisplay } from "./JsonDisplay";

const groupDisplayDataFn: DataFnType<
  { step: Observable<Step | null>; stepRun: Observable<StepRun> },
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

const DebugMessageGroupDisplay = withData(
  groupDisplayDataFn,
  ({ data: { step, stepRun }, messageGroup }) => {
    const stepTitle = step
      ? `Step ${step.index + 1}: ${step.title}`
      : "Pending";

    const allInputVariables = Object.keys(
      step?.variableDescriptions || {}
    ).reduce((acc, key) => {
      return {
        ...acc,
        [key]: stepRun?.variableValues?.[key],
      };
    }, {} as Record<string, string>);

    const allOutputVariables = Object.keys(
      step?.outputVariableDescriptions || {}
    ).reduce((acc, key) => {
      return {
        ...acc,
        [key]: stepRun?.variableValues?.[key],
      };
    }, {} as Record<string, string>);

    const stepRunDataDisplay = stepRun ? (
      <div className="flex flex-col">
        <div>
          <div>Input Vars</div>
          <JsonDisplay data={allInputVariables}></JsonDisplay>
        </div>
        <div>
          <div>Output vars</div>
          <JsonDisplay data={allOutputVariables}></JsonDisplay>
        </div>
      </div>
    ) : (
      <ColorRing height={"1rem"}></ColorRing>
    );

    return (
      <div className="bg-gray-200 p-3 shadow-lg flex-col flex gap-3">
        <div className="font-bold">{stepTitle}</div>
        <div>{stepRunDataDisplay}</div>
        {messageGroup.map((message) => {
          return (
            <DebugMessageDisplay
              message={message}
              key={message.uid}
            ></DebugMessageDisplay>
          );
        })}
      </div>
    );
  }
);

export const DebugMessagesDisplay = ({
  messages,
}: {
  messages: FlowMessage[];
}) => {
  const groupedByProcessedForStep = groupBy(messages, (_) => {
    return _.processedForStep || null;
  });

  return (
    <div className="flex flex-col-reverse">
      {Object.entries(groupedByProcessedForStep).map(
        ([stepId, messageGroup]) => {
          return (
            <DebugMessageGroupDisplay
              messageGroup={messageGroup}
              stepId={stepId}
              key={stepId}
            ></DebugMessageGroupDisplay>
          );
        }
      )}
    </div>
  );
};
