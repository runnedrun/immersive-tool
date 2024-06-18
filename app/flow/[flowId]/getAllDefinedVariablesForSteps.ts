import { Flow } from "@/models/types/Flow"
import { Step, VariableData } from "@/models/types/Step"
import { Timestamp } from "firebase/firestore"

export const getAllDefinedVariablesForSteps = (steps: Step[], flow: Flow) => {
  return steps.reduce(
    (acc, step) => {
      const outputVariableForDirectFnCall = step.functionInformation
        ?.responseVariableName
        ? {
            [step.functionInformation?.responseVariableName]: {
              createdAt: Timestamp.now(),
              description: "direct fn resp variable",
            } as VariableData,
          }
        : {}
      return {
        ...acc,
        ...step.variableDescriptions,
        ...step.outputVariableDescriptions,
        ...outputVariableForDirectFnCall,
      }
    },
    { ...flow.globalVariables } as Record<string, VariableData>
  )
}
