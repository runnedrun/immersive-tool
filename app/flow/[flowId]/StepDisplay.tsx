"use client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { fbSet } from "@/firebase/settersFe"
import { Field, Label } from "@/components/ui/fieldset"
import { Step, VariableData } from "@/models/types/Step"
import { StepTemplateDisplay } from "./StepTemplateDisplay"
import { Button } from "@/components/ui/button"
import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid"
import { isEmpty, sortBy } from "lodash"
import { Timestamp } from "firebase/firestore"
import { ResponseDescriptionTemplateDisplay } from "./ResponseDescriptionTemplateDisplay"
import { VariableDisplay } from "./VariableDisplay"
import { VariableCollectionDescriptionDisplay } from "./VariableCollectionDescriptionDisplay"
import { PreExecutionMessageDisplay } from "./PreExecutionMessageDisplay"
import { useCallback } from "react"
import { getVariableNamesSorted } from "@/functions/src/triggers/processFlowRun/getVariableNamesSorted"
import { objKeys } from "@/lib/helpers/objKeys"
import { availableToolSpecsByName } from "@/functions/src/triggers/processFlowRun/tools/availableTools"
import {
  Autocomplete,
  InputLabel,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material"
import { Form } from "@rjsf/mui"
import { RJSFSchema } from "@rjsf/utils"
import validator from "@rjsf/validator-ajv8"

export const StepDisplay = ({
  step,
  variablesFromPreviousSteps,
  onStepDelete,
}: {
  step: Step
  onStepDelete: (uid: string) => void
  variablesFromPreviousSteps: Record<string, VariableData>
}) => {
  const inputVariableDisplay = !isEmpty(step.variableDescriptions) ? (
    <VariableDisplay
      onVariableChange={(variableName, description, oldValue) => {
        fbSet("step", step.uid, {
          variableDescriptions: {
            ...step.variableDescriptions,
            [variableName]: {
              ...oldValue,
              description,
            },
          },
        })
      }}
      variableNamesAndValues={step.variableDescriptions}
    ></VariableDisplay>
  ) : (
    <div className="text-sm text-gray-600">No variables defined</div>
  )

  const onVariableChange = useCallback(
    (variableName: string, description: string, oldValue: any) => {
      fbSet("step", step.uid, {
        outputVariableDescriptions: {
          ...step.outputVariableDescriptions,
          [variableName]: {
            ...oldValue,
            description,
          },
        },
      })
    },
    [step.outputVariableDescriptions, step.uid]
  )

  const onNameChange = useCallback(
    (variableName: string, oldVariableName: string, value: any) => {
      const newOutputVariableDescriptions = {
        ...step.outputVariableDescriptions,
      }
      delete newOutputVariableDescriptions[oldVariableName]
      newOutputVariableDescriptions[variableName] = value

      fbSet(
        "step",
        step.uid,
        {
          ...step,
          outputVariableDescriptions: newOutputVariableDescriptions,
        },
        { merge: false }
      )
    },
    [step]
  )

  const outputVariableDisplay = (
    <div>
      <VariableDisplay
        onVariableChange={onVariableChange}
        onDelete={(variableName) => {
          const newOutputVariableDescriptions = {
            ...step.outputVariableDescriptions,
          }
          delete newOutputVariableDescriptions[variableName]
          fbSet(
            "step",
            step.uid,
            {
              ...step,
              outputVariableDescriptions: newOutputVariableDescriptions,
            },
            { merge: false }
          )
        }}
        onNameChange={onNameChange}
        variableNamesAndValues={step.outputVariableDescriptions || {}}
      ></VariableDisplay>
      <div className="mt-2 flex gap-2">
        <Button
          onClick={() => {
            fbSet("step", step.uid, {
              outputVariableDescriptions: {
                ...step.outputVariableDescriptions,
                ["Unitled Variable"]: {
                  description: "Untitled description",
                  createdAt: Timestamp.now(),
                },
              },
            })
          }}
        >
          <PlusIcon></PlusIcon> Add output variable
        </Button>
      </div>
    </div>
  )

  let mainExecutionDisplay = null
  if (step.isDirectFunctionCall) {
    const functionNames = objKeys(availableToolSpecsByName)
    const functionSpec = step.functionInformation?.name
      ? availableToolSpecsByName[step.functionInformation?.name]
      : null
    mainExecutionDisplay = (
      <div className="flex flex-col gap-2">
        <Autocomplete
          disablePortal
          className="w-full"
          options={functionNames}
          renderInput={(params) => <TextField {...params} label="Function" />}
          onChange={(e, value) => {
            fbSet("step", step.uid, {
              functionInformation: {
                name: value,
              },
            })
          }}
          value={step.functionInformation?.name || null}
        ></Autocomplete>
        {functionSpec && (
          <div>
            <div>Arguments:</div>
            <div>
              <Form
                className="mb-4"
                schema={functionSpec.parameters as RJSFSchema}
                validator={validator}
                formData={step.functionInformation?.args || {}}
                onChange={(a) => {
                  fbSet("step", step.uid, {
                    functionInformation: {
                      args: a.formData,
                    },
                  })
                }}
              />
            </div>
          </div>
        )}
        <div>
          <TextField
            label="Save to variable name"
            value={step.functionInformation?.responseVariableName || ""}
            placeholder="ex: functionResponse1"
            onChange={(e) => {
              fbSet("step", step.uid, {
                functionInformation: {
                  responseVariableName: e.target.value,
                },
              })
            }}
          ></TextField>
        </div>
      </div>
    )
  } else {
    mainExecutionDisplay = (
      <div>
        <StepTemplateDisplay
          variablesFromPreviousSteps={variablesFromPreviousSteps}
          step={step}
        ></StepTemplateDisplay>
        <div className="border border-gray-300 p-2">
          <div className="mb-2">Output variables for the next step:</div>
          <div className="flex flex-col gap-2">{outputVariableDisplay}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border-zinc-300 bg-zinc-100 p-2 shadow-lg">
      <div className="text-lg">Step {(step.index || 0) + 1}</div>
      <div>
        <Field>
          <Label>Title</Label>
          <div className="flex items-center gap-2">
            <Input
              className={"border-none"}
              value={step.title || ""}
              onChange={(e) => {
                fbSet("step", step.uid, { title: e.target.value })
              }}
            ></Input>
            <Button
              color="red"
              onClick={() => {
                fbSet("step", step.uid, { archived: true })
                onStepDelete(step.uid)
              }}
            >
              <TrashIcon></TrashIcon>
            </Button>
          </div>
        </Field>
      </div>
      <div className="bg-slate-100 p-2">
        <div className="mb-3 text-lg font-bold">Information Collection</div>
        <Field>
          <VariableCollectionDescriptionDisplay
            step={step}
            variablesFromPreviousSteps={variablesFromPreviousSteps}
          ></VariableCollectionDescriptionDisplay>
        </Field>
        <div className="border border-gray-300 p-2">
          <div className="mb-2">Variables:</div>
          <div className="flex flex-col gap-2">{inputVariableDisplay}</div>
        </div>
      </div>
      <div className="bg-slate-100 p-2">
        <div className="mb-3 text-lg font-bold">Execution</div>
        <div>
          <PreExecutionMessageDisplay
            step={step}
            variablesFromPreviousSteps={variablesFromPreviousSteps}
          ></PreExecutionMessageDisplay>
        </div>
        <Field>
          <Label>Direct Function Call?</Label>
          <Switch
            onChange={(e, value) => {
              fbSet("step", step.uid, {
                isDirectFunctionCall: value,
              })
            }}
            checked={step.isDirectFunctionCall || false}
          ></Switch>
        </Field>
        {mainExecutionDisplay}
      </div>
      <div className="bg-slate-100 p-2">
        <div className="mb-3 text-lg font-bold">Response</div>
        <ResponseDescriptionTemplateDisplay
          step={step}
          variablesFromPreviousSteps={variablesFromPreviousSteps}
        ></ResponseDescriptionTemplateDisplay>
      </div>
    </div>
  )
}
