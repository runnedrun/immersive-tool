"use client";
import { Input } from "@/components/ui/input";
import { VariableData } from "@/models/types/Step";
import { Button } from "@/components/ui/button";
import { PlusIcon, XCircleIcon } from "@heroicons/react/16/solid";
import { getVariableNamesSorted } from "@/functions/src/triggers/processFlowRun/getVariableNamesSorted";
import { Flow, GlobalVariableType } from "@/models/types/Flow";
import { Autocomplete, TextField } from "@mui/material";
import { fbSet } from "@/firebase/settersFe";
import { UploadFileComponent } from "./UploadFileComponent";
import { useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { isNil } from "lodash";

const DropdownLabels: { label: string; id: GlobalVariableType }[] = [
  { label: "File", id: GlobalVariableType.File },
  { label: "Query", id: GlobalVariableType.QueryParam },
];

export const GlobalVariableDisplay = ({ flow }: { flow: Flow }) => {
  const onNameChange = useCallback(
    (variableName: string, oldVariableName: string, value: any) => {
      const newGlobalVariables = {
        ...flow.globalVariables,
      };
      delete newGlobalVariables[oldVariableName];
      newGlobalVariables[variableName] = value;

      fbSet(
        "flow",
        flow.uid,
        {
          ...flow,
          globalVariables: newGlobalVariables,
        },
        { merge: false }
      );
    },
    [flow]
  );

  return (
    <div>
      <VariableDisplay
        variableNamesAndValues={flow.globalVariables || {}}
        renderVariableValue={(name, value) => {
          const variableTypeDropdown = (
            <Autocomplete
              className="w-32"
              disablePortal
              id="combo-box-demo"
              options={DropdownLabels}
              value={
                DropdownLabels.find((option) => option.id === value.type) ||
                null
              }
              sx={{ width: 300 }}
              renderInput={(params) => <TextField {...params} label="Type" />}
              onChange={(e, newValue) => {
                fbSet("flow", flow.uid, {
                  globalVariables: {
                    [name]: {
                      ...value,
                      type: newValue?.id ?? null,
                    },
                  },
                });
              }}
            />
          );

          const variableInputs: Record<GlobalVariableType, JSX.Element> = {
            [GlobalVariableType.File]: (
              <UploadFileComponent
                file={value.file || null}
                flowKey={flow.uid}
                onFile={(file) => {
                  fbSet("flow", flow.uid, {
                    globalVariables: {
                      [name]: {
                        ...value,
                        file,
                      },
                    },
                  });
                }}
              ></UploadFileComponent>
            ),
            [GlobalVariableType.QueryParam]: (
              <TextField
                label="Default Value"
                value={value.defaultValue}
                onChange={(e) => {
                  fbSet("flow", flow.uid, {
                    globalVariables: {
                      [name]: {
                        ...value,
                        defaultValue: e.target.value,
                      },
                    },
                  });
                }}
              ></TextField>
            ),
          };
          const input = !isNil(value.type) ? (
            variableInputs[value.type]
          ) : (
            <div className="text-gray-400 w-full">Select a type</div>
          );

          return (
            <div className="w-full flex items-center gap-2">
              <div className="grow">{input}</div>
              <div>{variableTypeDropdown}</div>
            </div>
          );
        }}
        onNameChange={onNameChange}
        onDelete={(variableName) => {
          const newGlobalVariables = {
            ...flow.globalVariables,
          };
          delete newGlobalVariables[variableName];
          fbSet(
            "flow",
            flow.uid,
            {
              ...flow,
              globalVariables: newGlobalVariables,
            },
            { merge: false }
          );
        }}
      ></VariableDisplay>
      <div className="flex gap-2 mt-2">
        <Button
          onClick={() => {
            fbSet("flow", flow.uid, {
              globalVariables: {
                ...flow.globalVariables,
                ["Unitled Variable"]: {
                  description: "Untitled description",
                  createdAt: Timestamp.now(),
                },
              },
            });
          }}
        >
          <PlusIcon></PlusIcon> Add Global Variable
        </Button>
      </div>
    </div>
  );
};

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
