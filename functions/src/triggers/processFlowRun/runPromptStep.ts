import {
  SenderType,
  getFlowMessageWithDefaults,
} from "@/models/types/FlowMessage"
import { isEmpty } from "lodash"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { fbCreate } from "../../helpers/fbWriters"
import { ProcessStepParams, StepRunProcessor } from "./processStepRun"
import { replaceTemplate } from "./replaceTemplate"
import { runTools } from "./runTools"
import { availableToolGetters } from "./tools/availableToolGetters"
import {
  getSaveOutputVariablesFnSpec,
  saveOutputVariablesSpecName,
} from "./tools/buildSaveOutputVariablesFn"

const getChatMessageForCompletedStepRun = ({
  currentStep,
  currentStepRun,
  allVariablesFromPreviousSteps,
}: ProcessStepParams): ChatCompletionMessageParam => {
  const startingTemplate = currentStep.template

  const allVariablesAvailable = {
    ...allVariablesFromPreviousSteps,
    ...currentStepRun.variableValues,
  }

  const replacedTemplate = replaceTemplate(
    startingTemplate || "",
    allVariablesAvailable
  )

  const saveVariableDirection = !isEmpty(currentStep.outputVariableDescriptions)
    ? `\n\nDo NOT return a message. Instead after executing the prompt you MUST call the ${saveOutputVariablesSpecName} function to save the output variables`
    : ``

  return {
    content: `Now please execute the following prompt from the user:

${replacedTemplate}${saveVariableDirection}`,
    role: "system",
  }
}

const getChatMessageForPreExecution = ({
  currentStep,
  currentStepRun,
  allVariablesFromPreviousSteps,
}: ProcessStepParams): string => {
  const startingTemplate = currentStep.preExecutionMessage!

  const allVariablesAvailable = {
    ...allVariablesFromPreviousSteps,
    ...currentStepRun.variableValues,
  }

  return replaceTemplate(startingTemplate, allVariablesAvailable)
}

export const sendPreExecutionMessage = async (params: ProcessStepParams) => {
  const preExecutionMessage = getChatMessageForPreExecution(params)
  await fbCreate(
    "flowMessage",
    getFlowMessageWithDefaults({
      flowKey: params.currentStep.flowKey,
      flowRunKey: params.currentStepRun.flowRunKey,
      processedForStepRunKey: params.currentStepRun.uid,
      processedForStep: params.currentStep.uid,
      senderType: SenderType.Bot,
      text: preExecutionMessage,
    })
  )
}

export const runPromptStep: StepRunProcessor = async (params) => {
  if (params.currentStep.isDirectFunctionCall) {
    return true
  }

  if (params.currentStep.preExecutionMessage) {
    sendPreExecutionMessage(params)
  }

  if (!params.currentStep.template) {
    return true
  }

  const tools = [
    ...Object.values(availableToolGetters).map((getter) => getter(params)),
    getSaveOutputVariablesFnSpec(params),
  ]
  const newMessage = getChatMessageForCompletedStepRun(params)

  await fbCreate(
    "flowMessage",
    getFlowMessageWithDefaults({
      flowKey: params.currentStep.flowKey,
      flowRunKey: params.currentStepRun.flowRunKey,
      processedForStepRunKey: params.currentStepRun.uid,
      processedForStep: params.currentStep.uid,
      senderType: SenderType.System,
      text: newMessage.content as string,
    })
  )

  params.messages = [...params.messages, newMessage]
  const hideMessages = true
  await runTools(tools, params, undefined, hideMessages)
  return true
}
