"use client";
import { Input } from "@/components/ui/input";
import { VariableData } from "@/models/types/Step";
import { Button } from "@/components/ui/button";
import { XCircleIcon } from "@heroicons/react/16/solid";
import { getVariableNamesSorted } from "@/functions/src/triggers/processFlowRun/getVariableNamesSorted";

export const VariableDisplay = <VariableDataType extends VariableData>({
  variableNamesAndValues,
  onVariableChange,
  onDelete,
  renderVariableValue,
  onNameChange,
}: {
  onVariableChange?: (
    variableName: string,
    value: string,
    oldValue: VariableDataType
  ) => void;
  variableNamesAndValues: Record<string, VariableDataType>;
  renderVariableValue?: (name: string, value: VariableDataType) => JSX.Element;
  onNameChange?: (
    variableName: string,
    oldVariableName: string,
    value: VariableDataType
  ) => void;
  onDelete?: (variableName: string) => void;
}) => {
  const variableNames = getVariableNamesSorted(variableNamesAndValues);

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
                variableNamesAndValues[variableName]
              );
            }}
            defaultValue={variableName}
          ></Input>
        ) : (
          <div className="w-32 truncate">{variableName}</div>
        );

        const variableData = variableNamesAndValues[variableName];
        const variableValue = variableNamesAndValues[variableName];

        const variableValueDisplay = renderVariableValue ? (
          renderVariableValue(variableName, variableValue)
        ) : (
          <Input
            placeholder="description"
            className={"border-none"}
            defaultValue={variableValue.description || ""}
            onChange={(e) => {
              e.stopPropagation();
              onVariableChange?.(variableName, e.target.value, variableData);
              return false;
            }}
          ></Input>
        );

        return (
          <div
            key={variableData.createdAt.toMillis()}
            className="flex gap-2 items-center"
          >
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
            {variableValueDisplay}
          </div>
        );
      })}
    </div>
  );
};
