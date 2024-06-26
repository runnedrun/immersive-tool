import { Step } from "@/models/types/Step"
import {
  StepRun,
  StepRunState,
  getNextStepRunState,
} from "@/models/types/StepRun"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { runTools } from "./runTools"
import { getSaveVariableFnSpec } from "./tools/buildSaveVariableFn"
import { fbCreate, fbSet } from "../../helpers/fbWriters"
import { isEmpty } from "lodash"
import { Timestamp } from "firebase-admin/firestore"
import { runPromptStep, sendPreExecutionMessage } from "./runPromptStep"
import { sendFinalResponseForStep } from "./sendFinalResponseForStep"
import { RunnableFunctionWithParse } from "openai/lib/RunnableFunction.mjs"
import { saveOutputVariables } from "./saveOutputVariables"
import { availableToolSpecsByName } from "./tools/availableTools"
import { availableToolGetters } from "./tools/availableToolGetters"
import { ChatCompletionRunner } from "openai/lib/ChatCompletionRunner.mjs"
import { deepMapObj } from "@/lib/helpers/deepMapObj"
import { replaceTemplate } from "./replaceTemplate"
import { checkForFlowRunCancelled } from "./processFlowRun"
import { SenderType } from "@/models/types/FlowMessage"
import { ConnectWithoutContactOutlined } from "@mui/icons-material"

export type StepProcessingToolBuilder<ToolParams extends object> = (
  params: ProcessStepParams
) => RunnableFunctionWithParse<ToolParams>["function"]

export type ProcessStepParams = {
  messages: ChatCompletionMessageParam[]
  currentStep: Step
  currentStepRun: StepRun
  allVariablesFromPreviousSteps: Record<string, string>
  triggeredTime: number
}

export type StepRunProcessor = (params: ProcessStepParams) => Promise<boolean> // boolean for whether or not the step is complete;

const collectDataStep = async (params: ProcessStepParams) => {
  const hasVariablesToCollect = !isEmpty(
    params.currentStep.variableDescriptions
  )

  if (hasVariablesToCollect) {
    const tools = [getSaveVariableFnSpec(params)]
    const respSentToUser = await runTools(tools, params)

    return !respSentToUser
  } else {
    console.log("no variables to collect for", params.currentStepRun.uid)
  }

  return true
}

const directlyRunFunction = async (params: ProcessStepParams) => {
  if (
    !params.currentStep.isDirectFunctionCall ||
    !params.currentStep.functionInformation?.name
  ) {
    await fbSet("stepRun", params.currentStepRun.uid, {
      state: {
        directFunctionRunCompletedAt: Timestamp.now(),
      },
    })
    return true
  }

  await sendPreExecutionMessage(params)

  const functionBuilder =
    availableToolGetters[params.currentStep.functionInformation?.name!]

  const functionToRun = functionBuilder(params)
  const fakeRunner = {
    abort: () => {},
  } as ChatCompletionRunner

  const args = params.currentStep.functionInformation?.args || {}

  const allVariablesAvailable = {
    ...params.allVariablesFromPreviousSteps,
    ...params.currentStepRun.variableValues,
  }

  const argsWithReplacement = deepMapObj(args, (value) => {
    if (typeof value === "string") {
      return replaceTemplate(value, allVariablesAvailable)
    }
  })

  await fbCreate("flowMessage", {
    flowRunKey: params.currentStepRun.flowRunKey,
    text: `I am running this function: 
    function title: ${params.currentStep.functionInformation?.name}
    args: ${JSON.stringify(argsWithReplacement, null, 2)}`,
    senderType: SenderType.DirectFunctionCall,
    flowKey: params.currentStepRun.flowKey,
    processedForStepRunKey: params.currentStepRun.uid,
    processedForStep: params.currentStep.uid,
  })

  const resp = await functionToRun.function(argsWithReplacement, fakeRunner)

  if (
    await checkForFlowRunCancelled(
      params.currentStepRun.flowRunKey,
      params.triggeredTime
    )
  ) {
    return false
  }

  await fbCreate("flowMessage", {
    flowRunKey: params.currentStepRun.flowRunKey,
    text: `I got this function response: 
    function title: ${params.currentStep.functionInformation?.name}
    response: ${JSON.stringify(resp, null, 2)}`,
    senderType: SenderType.DirectFunctionResponse,
    flowKey: params.currentStepRun.flowKey,
    processedForStepRunKey: params.currentStepRun.uid,
    processedForStep: params.currentStep.uid,
  })

  if (params.currentStep.functionInformation?.responseVariableName) {
    await fbSet("stepRun", params.currentStepRun.uid, {
      variableValues: {
        [params.currentStep.functionInformation?.responseVariableName]:
          resp as string,
      },
    })
  }

  await fbSet("stepRun", params.currentStepRun.uid, {
    state: {
      directFunctionRunCompletedAt: Timestamp.now(),
      outputVariableSavingCompletedAt: Timestamp.now(),
      promptCompletedAt: Timestamp.now(),
    },
  })

  return true
}

const stepRunStateToProcessor: Record<keyof StepRunState, StepRunProcessor> = {
  dataCollectionCompletedAt: collectDataStep,
  directFunctionRunCompletedAt: directlyRunFunction,
  promptCompletedAt: runPromptStep,
  outputVariableSavingCompletedAt: saveOutputVariables,
  finalResponseCompletedAt: sendFinalResponseForStep,
  stepCompletedAt: async (_) => true,
}

const runStepRunStateProcessor = async (
  stepStateName: keyof StepRunState,
  params: ProcessStepParams
) => {
  const currentProcessor = stepRunStateToProcessor[stepStateName]
  console.log("running processor for", stepStateName, params.currentStepRun.uid)
  const isComplete = await currentProcessor(params)
  console.log(
    "processor run finished. Is completed?",
    stepStateName,
    isComplete
  )
  if (isComplete) {
    await fbSet("stepRun", params.currentStepRun.uid, {
      state: {
        [stepStateName]: Timestamp.now(),
      },
    })
  }
  return isComplete
}

export const processStepRun = async (params: ProcessStepParams) => {
  const currentStepRunState = getNextStepRunState(params.currentStepRun.state)!
  return currentStepRunState
    ? runStepRunStateProcessor(currentStepRunState, params)
    : null
}
