import { Flow } from "@/models/types/Flow";
import { Step, VariableData } from "@/models/types/Step";

export const getAllDefinedVariablesForSteps = (steps: Step[], flow: Flow) => {
  return steps.reduce(
    (acc, step) => {
      return {
        ...acc,
        ...step.variableDescriptions,
        ...step.outputVariableDescriptions,
      };
    },
    { ...flow.globalVariables } as Record<string, VariableData>
  );
};
