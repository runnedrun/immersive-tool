"use client";
import { fbSet } from "@/firebase/settersFe";
import { Step, VariableData } from "@/models/types/Step";
import { PromptDisplayWithVariables } from "./PromptDisplayWithVariables";

export const PreExecutionMessageDisplay = ({
  step,
  variablesFromPreviousSteps,
}: {
  step: Step;
  variablesFromPreviousSteps: Record<string, VariableData>;
}) => {
  const allVariablesAvailable = {
    ...step.variableDescriptions,
    ...variablesFromPreviousSteps,
    ...step.outputVariableDescriptions,
  };
  return (
    <div className="p-2 flex-col flex gap-2">
      <div className="">
        Exactt Message to send before starting execution (optional)
      </div>
      <div>
        <PromptDisplayWithVariables
          variables={allVariablesAvailable}
          template={step.preExecutionMessage || ""}
          onChange={(text) => {
            fbSet("step", step.uid, { preExecutionMessage: text });
          }}
          placeholder={`Thank you {{name}}, processing.`}
        ></PromptDisplayWithVariables>
      </div>
    </div>
  );
};
