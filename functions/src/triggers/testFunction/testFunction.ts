import { v4 } from "uuid"
import { readDoc } from "../../helpers/fbReaders"
import { ProcessStepParams } from "../processFlowRun/processStepRun"
import { availableToolGetters } from "../processFlowRun/tools/availableToolGetters"
import { Step } from "@/models/types/Step"
import { StepRun } from "@/models/types/StepRun"
import { ChatCompletionRunner } from "openai/lib/ChatCompletionRunner.mjs"
import { fbSet } from "../../helpers/fbWriters"
import { Timestamp } from "firebase-admin/firestore"

export const testFunction = async (testFunctionJobId: string) => {
  const testFunctionJob = await readDoc("testFunctionJob", testFunctionJobId)
  const fnName = testFunctionJob?.functionName
  const argsObj = testFunctionJob.args
  const functionSpecBuilder = availableToolGetters[fnName]
  const flowId = testFunctionJob?.flowId
  const testStepId = `testStep-${flowId}-${v4()}`
  const testStepRunKey = `testStep-${flowId}-${v4()}`
  const params: ProcessStepParams = {
    allVariablesFromPreviousSteps: {},
    currentStep: {
      uid: testStepId,
    } as Step,
    currentStepRun: {
      flowKey: flowId,
      uid: testStepRunKey,
    } as StepRun,
    messages: [],
    triggeredTime: 0,
  }
  const fakeRunner = {
    abort: () => {},
  } as ChatCompletionRunner
  const fn = functionSpecBuilder(params)
  const res = await fn.function(argsObj, fakeRunner)
  console.log("res", res)

  await fbSet("testFunctionJob", testFunctionJobId, {
    result: res as string,
    completedAt: Timestamp.now(),
  })

  return false
}
