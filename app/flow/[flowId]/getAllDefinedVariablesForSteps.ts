import { Step } from "@/models/types/Step";

export const getAllDefinedVariablesForSteps = (steps: Step[]) => {
  return steps.reduce((acc, step) => {
    return {
      ...acc,
      ...step.variableDescriptions,
      ...step.outputVariableDescriptions,
    };
  }, {});
};
