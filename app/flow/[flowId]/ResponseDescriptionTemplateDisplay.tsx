"use client"
import { fbSet } from "@/firebase/settersFe"
import { Step, VariableData } from "@/models/types/Step"
import { PromptDisplayWithVariables } from "./PromptDisplayWithVariables"
import { Timestamp } from "@firebase/firestore"

export const ResponseDescriptionTemplateDisplay = ({
  step,
  variablesFromPreviousSteps,
}: {
  step: Step
  variablesFromPreviousSteps: Record<string, VariableData>
}) => {
  const responseVariableObj = step.functionInformation?.responseVariableName
    ? {
        [step.functionInformation?.responseVariableName]: {
          createdAt: Timestamp.now(),
          description: "direct fn resp variable",
        } as VariableData,
      }
    : {}
  const allVariablesAvailable = {
    ...step.variableDescriptions,
    ...variablesFromPreviousSteps,
    ...step.outputVariableDescriptions,
    ...responseVariableObj,
  }
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="">
        Exact post execution message to send to the user (optional)
      </div>
      <div>
        <PromptDisplayWithVariables
          variables={allVariablesAvailable}
          template={step.responseDescription || ""}
          onChange={(text) => {
            fbSet("step", step.uid, { responseDescription: text })
          }}
          placeholder={"Thank you {{name}}, your request has been processed."}
        ></PromptDisplayWithVariables>
      </div>
    </div>
  )
}
