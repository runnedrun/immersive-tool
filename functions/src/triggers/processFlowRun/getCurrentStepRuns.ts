import { Step } from "@/models/types/Step"
import { StepRun } from "@/models/types/StepRun"

export const getCurrentStepRuns = (steps: Step[], stepRuns: StepRun[]) => {
  const stepsCompletedBooleans = steps.map((step) => {
    return !!stepRuns.find(
      (_) => _.stepKey === step.uid && _.state.stepCompletedAt
    )
  })

  const currentStepIndex = stepsCompletedBooleans.indexOf(false)
  const curSteps = [] as Step[]

  if (currentStepIndex !== -1) {
    for (let i = 0; i < steps.length; i++) {
      const thisStep = steps[i]
      if (i >= currentStepIndex) {
        curSteps.push(thisStep)
        if (!thisStep.runInParallelWithNextStep) {
          break
        }
      }
    }
  }

  const curStepIds = curSteps.map((_) => _.uid)

  let currentStepRuns = stepRuns.filter((_) => curStepIds.includes(_.stepKey))

  return {
    currentSteps: curSteps,
    currentStepIndex,
    currentStepRuns,
    curStepIds,
  }
}
