"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fbSet } from "@/firebase/settersFe";
import { Field, Label } from "@/components/ui/fieldset";
import { Step, VariableData } from "@/models/types/Step";
import { StepTemplateDisplay } from "./StepTemplateDisplay";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { isEmpty, sortBy } from "lodash";
import { Timestamp } from "firebase/firestore";
import { ResponseDescriptionTemplateDisplay } from "./ResponseDescriptionTemplateDisplay";
import { VariableDisplay } from "./VariableDisplay";
import { VariableCollectionDescriptionDisplay } from "./VariableCollectionDescriptionDisplay";
import { PreExecutionMessageDisplay } from "./PreExecutionMessageDisplay";
import { useCallback } from "react";
import { getVariableNamesSorted } from "@/functions/src/triggers/processFlowRun/getVariableNamesSorted";

export const StepDisplay = ({
  step,
  variablesFromPreviousSteps,
  onStepDelete,
}: {
  step: Step;
  onStepDelete: (uid: string) => void;
  variablesFromPreviousSteps: Record<string, VariableData>;
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
        });
      }}
      variableNamesAndValues={step.variableDescriptions}
    ></VariableDisplay>
  ) : (
    <div className="text-sm text-gray-600">No variables defined</div>
  );

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
      });
    },
    [step.outputVariableDescriptions, step.uid]
  );

  const onNameChange = useCallback(
    (variableName: string, oldVariableName: string, value: any) => {
      const newOutputVariableDescriptions = {
        ...step.outputVariableDescriptions,
      };
      delete newOutputVariableDescriptions[oldVariableName];
      newOutputVariableDescriptions[variableName] = value;

      fbSet(
        "step",
        step.uid,
        {
          ...step,
          outputVariableDescriptions: newOutputVariableDescriptions,
        },
        { merge: false }
      );
    },
    [step]
  );

  const outputVariableDisplay = (
    <div>
      <VariableDisplay
        onVariableChange={onVariableChange}
        onDelete={(variableName) => {
          const newOutputVariableDescriptions = {
            ...step.outputVariableDescriptions,
          };
          delete newOutputVariableDescriptions[variableName];
          fbSet(
            "step",
            step.uid,
            {
              ...step,
              outputVariableDescriptions: newOutputVariableDescriptions,
            },
            { merge: false }
          );
        }}
        onNameChange={onNameChange}
        variableNamesAndValues={step.outputVariableDescriptions || {}}
      ></VariableDisplay>
      <div className="flex gap-2 mt-2">
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
            });
          }}
        >
          <PlusIcon></PlusIcon> Add output variable
        </Button>
      </div>
    </div>
  );

  return (
    <div className=" border-zinc-300 flex flex-col gap-2 p-2 bg-zinc-100 shadow-lg rounded-md">
      <div className="text-lg">Step {(step.index || 0) + 1}</div>
      <div>
        <Field>
          <Label>Title</Label>
          <div className="flex items-center gap-2">
            <Input
              className={"border-none"}
              value={step.title || ""}
              onChange={(e) => {
                fbSet("step", step.uid, { title: e.target.value });
              }}
            ></Input>
            <Button
              color="red"
              onClick={() => {
                fbSet("step", step.uid, { archived: true });
                onStepDelete(step.uid);
              }}
            >
              <TrashIcon></TrashIcon>
            </Button>
          </div>
        </Field>
      </div>
      <div className="bg-slate-100 p-2">
        <div className="text-lg font-bold mb-3">Information Collection</div>
        <Field>
          <VariableCollectionDescriptionDisplay
            step={step}
            variablesFromPreviousSteps={variablesFromPreviousSteps}
          ></VariableCollectionDescriptionDisplay>
        </Field>
        <div className="border-gray-300 p-2 border">
          <div className="mb-2">Variables:</div>
          <div className="flex-col flex gap-2">{inputVariableDisplay}</div>
        </div>
      </div>
      <div className="bg-slate-100 p-2">
        <div className="text-lg font-bold mb-3">Execution</div>
        <div>
          <PreExecutionMessageDisplay
            step={step}
            variablesFromPreviousSteps={variablesFromPreviousSteps}
          ></PreExecutionMessageDisplay>
        </div>
        <StepTemplateDisplay
          variablesFromPreviousSteps={variablesFromPreviousSteps}
          step={step}
        ></StepTemplateDisplay>
        <div className="border-gray-300 p-2 border">
          <div className="mb-2">Output variables for the next step:</div>
          <div className="flex-col flex gap-2">{outputVariableDisplay}</div>
        </div>
      </div>
      <div className="bg-slate-100 p-2">
        <div className="text-lg font-bold mb-3">Response</div>
        <ResponseDescriptionTemplateDisplay
          step={step}
          variablesFromPreviousSteps={variablesFromPreviousSteps}
        ></ResponseDescriptionTemplateDisplay>
      </div>
    </div>
  );
};
