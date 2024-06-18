import {
  RunnableFunction,
  RunnableFunctionWithParse,
} from "openai/lib/RunnableFunction.mjs"
import { fbSet } from "../../../helpers/fbWriters"
import { getVariableNamesSorted } from "../getVariableNamesSorted"
import { ProcessStepParams, StepProcessingToolBuilder } from "../processStepRun"
import { checkForFlowRunCancelled } from "../processFlowRun"

export type SaveVariableParams = {
  variableName: string
  value: string
}

export const getSaveVariableFnSpec = (
  params: ProcessStepParams
): RunnableFunction<SaveVariableParams> => ({
  function: buildSaveVariableFn(params),
  description:
    "Save a variable to the database after retrieving it from the user",
  parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
  parameters: {
    type: "object",
    properties: {
      variableName: {
        type: "string",
        description: "The variable name",
      },
      value: { type: "string", description: "The variable value" },
    },
    required: ["variableName", "value"],
  },
  name: "saveVariable",
})

type SaveVariableFnParams = { variableName: string; value: string }

export const buildSaveVariableFn: StepProcessingToolBuilder<
  SaveVariableFnParams
> = ({
  currentStepRun,
  currentStep,
  triggeredTime,
  allVariablesFromPreviousSteps,
}: ProcessStepParams) => {
  return async (params, runner) => {
    if (
      await checkForFlowRunCancelled(currentStepRun.flowRunKey, triggeredTime)
    ) {
      runner.abort()
    }
    await fbSet("stepRun", currentStepRun.uid, {
      variableValues: {
        [params.variableName]: params.value,
      },
    })

    const allVariables = {
      ...currentStepRun.variableValues,
      ...allVariablesFromPreviousSteps,
      [params.variableName]: params.value,
    }

    const allSavedVariableNames = Object.keys(allVariables)

    const allPossibleVariableNames = getVariableNamesSorted(
      currentStep.variableDescriptions || {}
    )

    const allIncompleteVariables = allPossibleVariableNames.filter(
      (_) => !allSavedVariableNames.includes(_)
    )

    const nextVariableToCollect = allIncompleteVariables[0]

    if (nextVariableToCollect) {
      const returnMessage = `Successfully saved ${params.variableName} to ${params.value}. Your next variable to collect is: 
    name: ${nextVariableToCollect}
    description: ${currentStep.variableDescriptions?.[nextVariableToCollect].description}`
      return returnMessage
    } else {
      runner.abort()
      return "All variables have been collected"
    }
  }
}
