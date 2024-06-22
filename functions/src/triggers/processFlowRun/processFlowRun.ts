import {
  Flow,
  GlobalVariableData,
  GlobalVariableType,
} from "@/models/types/Flow"
import { FlowRun } from "@/models/types/FlowRun"
import { Step } from "@/models/types/Step"
import { StepRun, getStepRunId } from "@/models/types/StepRun"
import { Timestamp } from "firebase-admin/firestore"
import { isNil } from "lodash"
import { queryDocs, readDoc } from "../../helpers/fbReaders"
import { fbCreate, fbSet } from "../../helpers/fbWriters"
import {
  createIntroFlowMessage,
  createUserFacingIntro,
} from "./createIntroFlowMessage"
import { getMessagesForAi } from "./getMessagesForAi"
import { createSystemMessageForStepStart } from "./getSystemMessageForStep"
import { getVariableNamesSorted } from "./getVariableNamesSorted"
import { processStepRun } from "./processStepRun"
import { getCurrentStepRuns } from "./getCurrentStepRuns"

let reRunsAllowed = 30

export const checkForFlowRunCancelled = async (
  flowRunKey: string,
  originalTriggerTime: number
) => {
  const flowRun = await readDoc("flowRun", flowRunKey)
  if ((flowRun.cancelledAt || 0) > originalTriggerTime) {
    console.log("flow cancelled", flowRunKey)
    return true
  }
  return false
}

const globalVariableValueGetters: Record<
  GlobalVariableType,
  (name: string, value: GlobalVariableData, flowRun: FlowRun) => string
> = {
  [GlobalVariableType.File]: (name, value) => value.file?.url || "",
  [GlobalVariableType.QueryParam]: (name, value, flowRun) =>
    flowRun.queryParams?.[name] || value.defaultValue || "",
}

const getAllVariablesWithGlobals = async (
  currentStepRuns: StepRun[],
  stepRuns: StepRun[],
  completedSteps: Step[],
  flow: Flow,
  flowRun: FlowRun
) => {
  const currentStepIds = currentStepRuns.map((_) => _.uid)

  const stepRunsWithoutCurrentStep = stepRuns.filter(
    (_) => !currentStepIds.includes(_.uid)
  )

  const allVariablesFromPreviousSteps = completedSteps.reduce(
    (acc, step) => {
      const stepRun = stepRunsWithoutCurrentStep.find(
        (_) => _.stepKey === step.uid
      )
      return {
        ...acc,
        ...(stepRun?.variableValues || {}),
      }
    },
    {} as Record<string, string>
  )

  const globalVariableValues = flow.globalVariables || {}
  const globalVariableNames = getVariableNamesSorted(globalVariableValues)

  const allGlobalVariableValueStrings = globalVariableNames.reduce(
    (acc, name) => {
      const value = globalVariableValues[name]

      if (isNil(value.type)) {
        return acc
      }
      const stringValue = globalVariableValueGetters[value.type](
        name,
        value,
        flowRun
      )
      return {
        ...acc,
        [name]: stringValue,
      }
    },
    {} as Record<string, string>
  )

  return {
    ...allVariablesFromPreviousSteps,
    ...allGlobalVariableValueStrings,
  }
}

const createStepStartSystemMessageAndStepRun = async (
  stepToRun: Step,
  currentStepRuns: StepRun[],
  stepRuns: StepRun[],
  completedSteps: Step[],
  allSteps: Step[],
  flow: Flow,
  flowRun: FlowRun
) => {
  const allVariablesWithGlobalsBeforeProcessing =
    await getAllVariablesWithGlobals(
      currentStepRuns,
      stepRuns,
      completedSteps,
      flow,
      flowRun
    )
  const stepMessage = await createSystemMessageForStepStart({
    allSteps,
    completedSteps,
    flowRun,
    step: stepToRun,
    variableValuessFromPreviousSteps: allVariablesWithGlobalsBeforeProcessing,
  })

  const id = getStepRunId(flowRun.uid, stepToRun.uid)
  const ref = await fbCreate(
    "stepRun",
    {
      flowKey: flowRun.flowKey,
      flowRunKey: flowRun.uid,
      stepKey: stepToRun.uid,
      state: {
        directFunctionRunCompletedAt: null,
        dataCollectionCompletedAt: null,
        promptCompletedAt: null,
        outputVariableSavingCompletedAt: null,
        finalResponseCompletedAt: null,
        stepCompletedAt: null,
      },
      variableValues: {},
    },
    { id }
  )
  return { stepRun: ref.data, stepMessage: stepMessage }
}

export const processFlowRun = async (flowRunKey: string, trigger: number) => {
  await fbSet("flowRun", flowRunKey, {
    triggeredAt: trigger,
  })
  const flowRun = await readDoc("flowRun", flowRunKey)

  const [steps, stepRuns, flow] = await Promise.all([
    queryDocs("step", (q) => {
      return q
        .where("flowKey", "==", flowRun.flowKey)
        .where("archived", "==", false)
        .orderBy("index", "asc")
    }),
    await queryDocs("stepRun", (q) => {
      return q.where("flowRunKey", "==", flowRunKey)
    }),
    readDoc("flow", flowRun.flowKey),
  ])

  const {
    currentSteps: curSteps,
    currentStepIndex,
    currentStepRuns,
    curStepIds,
  } = getCurrentStepRuns(steps, stepRuns)

  const completedSteps = steps.slice(0, currentStepIndex)

  console.log(
    "running flow run processing",
    flowRunKey,
    flowRun.flowKey,
    curStepIds
  )

  if (!curSteps.length) {
    await fbSet("flowRun", flowRunKey, {
      completedAt: Timestamp.now(),
    })
    return false
  }

  const getFlowMesssages = () =>
    queryDocs("flowMessage", (q) => {
      return q
        .where("flowRunKey", "==", flowRunKey)
        .where("archived", "==", false)
        .orderBy("createdAt", "desc")
    })

  const flowMessagesBeforeStep = await getFlowMesssages()

  if (!flowMessagesBeforeStep.length) {
    const newMessages = [
      (await createIntroFlowMessage(flow, flowRunKey)).data,
      (await createUserFacingIntro(flow, flowRunKey)).data,
    ]
    flowMessagesBeforeStep.push(...newMessages)
  }

  for (const step of curSteps) {
    const currStepRun = currentStepRuns.find((_) => _.stepKey === step.uid)

    if (!currStepRun) {
      console.log("creating setp run start for", step.index, step.uid)
      const { stepRun, stepMessage } =
        await createStepStartSystemMessageAndStepRun(
          step,
          currentStepRuns,
          stepRuns,
          completedSteps,
          steps,
          flow,
          flowRun
        )
      currentStepRuns.push(stepRun)
      flowMessagesBeforeStep.push(stepMessage)
    }
  }

  const firstStepRun = currentStepRuns[0]

  await Promise.all(
    flowMessagesBeforeStep.map(async (message) => {
      if (!message.processedForStep) {
        message.processedForStepRunKey = firstStepRun!.uid
        message.processedForStep = firstStepRun!.stepKey

        await fbSet("flowMessage", message.uid, message)
      }
      return message
    })
  )

  await fbSet("flowRun", flowRunKey, {
    allowInput: false,
  })

  const shouldReRuns = await Promise.all(
    curSteps.map(async (step) => {
      const currentStepRun = currentStepRuns.find((_) => _.stepKey === step.uid)
      let nReRuns = 0
      const runStep = async (): Promise<boolean> => {
        const allVariablesAvailable = await getAllVariablesWithGlobals(
          currentStepRuns,
          stepRuns,
          completedSteps,
          flow,
          flowRun
        )

        if (nReRuns > reRunsAllowed) {
          console.log("max step re-runs exceeded", step.uid)
          return false
        }
        nReRuns++

        if (await checkForFlowRunCancelled(flowRun.uid, trigger)) {
          return false
        }

        const messages = await getFlowMesssages()

        messages.reverse()

        const messagesForGPT = getMessagesForAi(messages, step)

        const upToDateStepRun = await readDoc("stepRun", currentStepRun!.uid)
        console.log("running step run again", currentStepRun!.uid)

        const shouldReRun = await processStepRun({
          messages: messagesForGPT,
          currentStep: step,
          currentStepRun: upToDateStepRun!,
          allVariablesFromPreviousSteps: allVariablesAvailable,
          triggeredTime: trigger,
        })

        console.log("should re run step?", step.uid, shouldReRun)

        if (shouldReRun) {
          return runStep()
        } else if (shouldReRun === false) {
          return false
        } else {
          return true
        }
      }

      const shouldReRun = await runStep()

      console.log("re-triggering whole function", shouldReRun, step.uid)
      return shouldReRun
    })
  )
  await fbSet("flowRun", flowRunKey, {
    allowInput: true,
  })

  const shouldReRun = shouldReRuns.some((_) => _ === true)

  return shouldReRun
}

export const processFlowRunWithErrorHandling = async (
  flowRunKey: string,
  trigger: number
) => {
  try {
    const res = await processFlowRun(flowRunKey, trigger)
    return res
  } catch (e: any) {
    await fbSet("flowRun", flowRunKey, {
      errorMessage: e.message || e,
    })
    throw e
  }
}
