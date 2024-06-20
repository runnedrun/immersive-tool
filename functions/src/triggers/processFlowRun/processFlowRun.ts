import { GlobalVariableData, GlobalVariableType } from "@/models/types/Flow"
import { FlowRun } from "@/models/types/FlowRun"
import { Step } from "@/models/types/Step"
import { getStepRunId } from "@/models/types/StepRun"
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
    fbSet("flowRun", flowRunKey, {
      completedAt: Timestamp.now(),
    })
    return false
  }
  const currentStepIds = currentStepRuns.map((_) => _.uid)

  const stepRunsWithoutCurrentStep = stepRuns.filter((_) =>
    currentStepIds.includes(_.uid)
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

  const allVariablesWithGlobals = {
    ...allVariablesFromPreviousSteps,
    ...allGlobalVariableValueStrings,
  }

  const firstStepToRun = curSteps[0]

  if (!currentStepRuns.length) {
    await createSystemMessageForStepStart({
      allSteps: steps,
      completedSteps,
      flowRun,
      step: firstStepToRun,
      variableValuessFromPreviousSteps: allVariablesWithGlobals,
    })

    const id = getStepRunId(flowRunKey, firstStepToRun.uid)
    const ref = await fbCreate(
      "stepRun",
      {
        flowKey: flowRun.flowKey,
        flowRunKey,
        stepKey: firstStepToRun.uid,
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

    currentStepRuns.push(ref.data)
  }

  // todo Add UI lock here
  await fbSet("flowRun", flowRunKey, {
    allowInput: false,
  })

  await Promise.all(
    curSteps.map(async (step) => {
      const currStepRun = currentStepRuns.find((_) => _.stepKey === step.uid)
      let nReRuns = 0
      const runStep = async () => {
        if (nReRuns > reRunsAllowed) {
          return false
        }
        nReRuns++

        if (await checkForFlowRunCancelled(flowRun.uid, trigger)) {
          return false
        }

        const firstStepRun = currentStepRuns[0]

        const unprocessedMessages = await queryDocs("flowMessage", (q) => {
          return q
            .where("flowRunKey", "==", flowRunKey)
            .where("archived", "==", false)
            .orderBy("createdAt", "desc")
        })

        const messages = unprocessedMessages.length
          ? unprocessedMessages.reverse()
          : [
              (await createIntroFlowMessage(flow, flowRunKey)).data,
              (await createUserFacingIntro(flow, flowRunKey)).data,
            ].filter(Boolean)

        const updatedMessagesWithStepKeyInfo = await Promise.all(
          messages.map(async (message) => {
            if (!message.processedForStep) {
              message.processedForStepRunKey = firstStepRun!.uid
              message.processedForStep = firstStepToRun.uid

              await fbSet("flowMessage", message.uid, message)
            }
            return message
          })
        )

        const messagesForGPT = getMessagesForAi(
          updatedMessagesWithStepKeyInfo,
          step
        )

        return await processStepRun({
          messages: messagesForGPT,
          currentStep: step,
          currentStepRun: currStepRun!,
          allVariablesFromPreviousSteps: allVariablesWithGlobals,
          triggeredTime: trigger,
        })
      }

      const shouldReRun = await runStep()

      console.log("re-running?", shouldReRun, flowRunKey, step.uid)
      if (shouldReRun) {
        runStep()
      }
    })
  )
  await fbSet("flowRun", flowRunKey, {
    allowInput: true,
  })

  return false
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
