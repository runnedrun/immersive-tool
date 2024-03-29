"use client";
import { fbSet } from "@/firebase/settersFe";
import { Step, VariableData } from "@/models/types/Step";
import { PromptDisplayWithVariables } from "./PromptDisplayWithVariables";

export const ResponseDescriptionTemplateDisplay = ({
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
        Exact post execution message to send to the user (optional)
      </div>
      <div>
        <PromptDisplayWithVariables
          variables={allVariablesAvailable}
          template={step.responseDescription || ""}
          onChange={(text) => {
            fbSet("step", step.uid, { responseDescription: text });
          }}
          placeholder={"Thank you {{name}}, your request has been processed."}
        ></PromptDisplayWithVariables>
      </div>
    </div>
  );
};
