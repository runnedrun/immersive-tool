import { FlowMessage, SenderType } from "@/models/types/FlowMessage"
import { Step } from "@/models/types/Step"
import { getVariableNamesSorted } from "./getVariableNamesSorted"
import { getStepRunId } from "@/models/types/StepRun"
import { replaceTemplate } from "./replaceTemplate"
import { fbCreate } from "../../helpers/fbWriters"
import { FlowRun } from "@/models/types/FlowRun"

export const createSystemMessageForStepStart = async ({
  step,
  flowRun,
  completedSteps,
  allSteps,
  variableValuessFromPreviousSteps,
}: {
  step: Step
  flowRun: FlowRun
  completedSteps: Step[]
  allSteps: Step[]
  variableValuessFromPreviousSteps: Record<string, string>
}): Promise<FlowMessage> => {
  const variarblesToCollect = getVariableNamesSorted(
    step.variableDescriptions || {}
  )
  const aiIntroString = step.variableCollectionInstructions
    ? `\nHere are some additional details on how to collect the information:
  ${replaceTemplate(
    step.variableCollectionInstructions,
    variableValuessFromPreviousSteps
  )}`
    : ""

  const requiredInfoMsg = Object.entries(step.variableDescriptions || {})
    .map(([variable, desc]) => `${variable}: ${desc.description}`)
    .join("\n")

  const variablesToCollectMessage = variarblesToCollect.length
    ? `\n\nThe information you need to gather for this step is the following: 
${requiredInfoMsg}.`
    : ""

  const stepTitleMessage = step.title
    ? `\nThe title of this step is: ${step.title}`
    : ""

  const startPrompt = variarblesToCollect.length
    ? `\nStart off by prompting the user for the first piece of information: 
    ${variarblesToCollect[0]}`
    : ``

  const res = await fbCreate("flowMessage", {
    text: `
  You have completed ${completedSteps.length} steps out of ${
    allSteps.length
  }. The next step is step #${
    completedSteps.length + 1
  }.${stepTitleMessage}${variablesToCollectMessage}
    If the user provides information that does not meet the requirements for the variable being collected, you may prompt them again, until they give an appropriate answer.
    As soon as the appropriate information for each variable is collected, please immediately save the variable before collecting the next one.
    ${aiIntroString}${startPrompt}`,
    senderType: SenderType.StepIntroducion,
    flowKey: step.flowKey,
    processedForStep: step.uid,
    processedForStepRunKey: getStepRunId(flowRun.uid, step.uid),
    flowRunKey: flowRun.uid,
  })

  return res.data
}
