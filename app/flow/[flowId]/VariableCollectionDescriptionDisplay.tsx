"use client";
import { fbSet } from "@/firebase/settersFe";
import { Step, VariableData } from "@/models/types/Step";
import { PromptDisplayWithVariables } from "./PromptDisplayWithVariables";

export const VariableCollectionDescriptionDisplay = ({
  step,
  variablesFromPreviousSteps,
}: {
  step: Step;
  variablesFromPreviousSteps: Record<string, VariableData>;
}) => {
  const allVariablesAvailable = {
    ...step.variableDescriptions,
    ...variablesFromPreviousSteps,
  };
  return (
    <div className="p-2 flex-col flex gap-2">
      <div className="">
        Extra instructions for how variables should be collected (optional)
      </div>
      <div>
        <PromptDisplayWithVariables
          variables={allVariablesAvailable}
          template={step.variableCollectionInstructions || ""}
          onChange={(text) => {
            fbSet("step", step.uid, { variableCollectionInstructions: text });
          }}
          placeholder={
            "e.g. Use {{previousStepVariable}} when collectin the user's name."
          }
        ></PromptDisplayWithVariables>
      </div>
    </div>
  );
};
