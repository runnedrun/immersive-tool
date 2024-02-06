"use client";
import { Input } from "@/components/ui/input";
import { VariableData } from "@/models/types/Step";
import { Button } from "@/components/ui/button";
import { XCircleIcon } from "@heroicons/react/16/solid";
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
      {variableNames.map((variableName, i) => {
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
            defaultValue={variableName}
          ></Input>
        ) : (
          <div className="w-32 truncate">{variableName}</div>
        );

        const variableData = variableNamesAndDescription[variableName];
        const variableDescription =
          variableNamesAndDescription[variableName].description;

        return (
          <div key={i} className="flex gap-2 items-center">
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
              defaultValue={variableDescription || ""}
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
