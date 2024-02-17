"use client";
import { fbSet } from "@/firebase/settersFe";
import { Step, VariableData } from "@/models/types/Step";
import { PromptDisplayWithVariables } from "./PromptDisplayWithVariables";
import { Flow } from "@/models/types/Flow";

export const FlowIdentifierDisplay = ({
  steps,
  flow,
}: {
  steps: Step[];
  flow: Flow;
}) => {
  const allVariablesAvailable = steps.reduce((acc, step) => {
    return {
      ...acc,
      ...step.variableDescriptions,
      ...step.outputVariableDescriptions,
      ...flow.globalVariables,
    };
  }, {} as Record<string, VariableData>);

  return (
    <div className="p-2 flex-col flex gap-2">
      <PromptDisplayWithVariables
        variables={allVariablesAvailable}
        template={flow.runIdentifier || ""}
        onChange={(text) => {
          fbSet("flow", flow.uid, { runIdentifier: text });
        }}
        placeholder={"{{name}} who has {{interest}}"}
      ></PromptDisplayWithVariables>
    </div>
  );
};
