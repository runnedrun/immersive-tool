"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fbSet } from "@/firebase/settersFe";
import { Field, Label } from "@/components/ui/fieldset";
import { Step, VariableData } from "@/models/types/Step";
import { StepTemplateDisplay } from "./StepTemplateDisplay";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon, XCircleIcon } from "@heroicons/react/16/solid";
import { isEmpty, sortBy } from "lodash";
import { Timestamp } from "firebase/firestore";
import { getVariableNamesSorted } from "@/functions/src/triggers/processFlowRun/getVariableNamesSorted";

export const VariableDisplay = ({
  variableNamesAndDescription,
  onVariableChange,
  onDelete,
  onNameChange,
}: {
  onVariableChange: (
    variableName: string,
    value: string,
    oldValue: VariableData
  ) => void;
  variableNamesAndDescription: Record<string, VariableData>;
  onNameChange?: (
    variableName: string,
    oldVariableName: string,
    value: VariableData
  ) => void;
  onDelete?: (variableName: string) => void;
}) => {
  const variableNames = getVariableNamesSorted(variableNamesAndDescription);

  return (
    <div className="flex flex-col gap-2">
      {variableNames.map((variableName) => {
        const nameDisplay = onNameChange ? (
          <Input
            className={"w-48"}
            onChange={(e) => {
              onNameChange(
                e.target.value,
                variableName,
                variableNamesAndDescription[variableName]
              );
            }}
            value={variableName}
          ></Input>
        ) : (
          <div className="w-32 truncate">{variableName}</div>
        );

        const variableData = variableNamesAndDescription[variableName];
        const variableDescription =
          variableNamesAndDescription[variableName].description;

        return (
          <div key={variableName} className="flex gap-2 items-center">
            {onDelete && (
              <Button
                color="red"
                onClick={() => {
                  onDelete(variableName);
                }}
              >
                <XCircleIcon></XCircleIcon>
              </Button>
            )}
            <div className="text-bold text-blue-400 w-fit">{nameDisplay}</div>
            <Input
              placeholder="description"
              className={"border-none"}
              value={variableDescription || ""}
              onChange={(e) => {
                e.stopPropagation();
                onVariableChange(variableName, e.target.value, variableData);
                return false;
              }}
            ></Input>
          </div>
        );
      })}
    </div>
  );
};

export const StepDisplay = ({ step }: { step: Step }) => {
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
      variableNamesAndDescription={step.variableDescriptions}
    ></VariableDisplay>
  ) : (
    <div className="text-sm text-gray-600">No variables defined</div>
  );

  console.log(
    "step.outputVariableDescriptions",
    step.outputVariableDescriptions
  );

  const outputVariableDisplay = (
    <div>
      <VariableDisplay
        onVariableChange={(variableName, description, oldValue) => {
          fbSet("step", step.uid, {
            outputVariableDescriptions: {
              ...step.variableDescriptions,
              [variableName]: {
                ...oldValue,
                description,
              },
            },
          });
        }}
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
        onNameChange={(variableName, oldVariableName, value) => {
          const newOutputVariableDescriptions = {
            ...step.outputVariableDescriptions,
          };
          delete newOutputVariableDescriptions[oldVariableName];
          newOutputVariableDescriptions[variableName] = value;
          fbSet("step", step.uid, {
            outputVariableDescriptions: newOutputVariableDescriptions,
          });
        }}
        variableNamesAndDescription={step.outputVariableDescriptions || {}}
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
    <div className=" border-zinc-300 flex flex-col gap-2 p-2">
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
              }}
            >
              <TrashIcon></TrashIcon>
            </Button>
          </div>
        </Field>
      </div>
      <Field>
        <Label>Extra Instructions for data collection (optional)</Label>
        <Textarea
          className={"border-none"}
          value={step.aiIntro || ""}
          rows={2}
          onChange={(e) => {
            fbSet("step", step.uid, { aiIntro: e.target.value });
          }}
        ></Textarea>
      </Field>
      <div className="border-gray-300 p-2 border">
        <div className="mb-2">Variables:</div>
        <div className="flex-col flex gap-2">{inputVariableDisplay}</div>
      </div>
      <div>
        <StepTemplateDisplay step={step}></StepTemplateDisplay>
      </div>
      <div className="border-gray-300 p-2 border">
        <div className="mb-2">Output variables for the next step:</div>
        <div className="flex-col flex gap-2">{outputVariableDisplay}</div>
      </div>
    </div>
  );
};
