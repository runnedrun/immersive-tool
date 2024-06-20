import { queryObs, readDoc } from "@/firebase/readerFe"
import { fbDelete, fbSet } from "@/firebase/settersFe"
import { getCurrentStepRuns } from "@/functions/src/triggers/processFlowRun/getCurrentStepRuns"
import { StepRun, getStepRunId } from "@/models/types/StepRun"
import { where } from "@firebase/firestore"
import { firstValueFrom } from "rxjs"

export const resetFlowRunToStepRunStart = async (
  flowKey: string,
  flowRunKey: string,
  stepKey: string
) => {
  const allStepsForFlow = await firstValueFrom(
    queryObs("step", ({ where }) => {
      return [where("flowKey", "==", flowKey), where("archived", "==", false)]
    })
  )

  const thisStep = allStepsForFlow.find((s) => s.uid === stepKey)
  const allStepsBeyondThisOne = allStepsForFlow.filter(
    (s) => s.index >= thisStep!.index
  )

  const stepRunIdsToReset = allStepsBeyondThisOne.map((s) =>
    getStepRunId(flowRunKey, s.uid)
  )

  await Promise.all(
    stepRunIdsToReset.map(async (stepRunId) => {
      const messagesToDelete = await firstValueFrom(
        queryObs("flowMessage", ({ where }) => {
          return [where("processedForStepRunKey", "==", stepRunId)]
        })
      )

      return Promise.all([
        fbDelete("stepRun", stepRunId),
        ...messagesToDelete.map((m) => fbDelete("flowMessage", m.uid)),
      ])
    })
  )
}

export const resetLatestStepInFlowRun = async (
  flowKey: string,
  flowRunKey: string
) => {
  const stepRuns = await firstValueFrom(
    queryObs("stepRun", ({ where }) => {
      return [where("flowRunKey", "==", flowRunKey)]
    })
  )

  const steps = await firstValueFrom(
    queryObs("step", ({ where }) => {
      return [where("flowKey", "==", flowRunKey)]
    })
  )

  const { curStepIds } = getCurrentStepRuns(steps, stepRuns)

  await resetFlowRunToStepRunStart(flowKey, flowRunKey, curStepIds[0])
}
