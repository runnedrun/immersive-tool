"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/16/solid";
import { Flow, GlobalVariableType } from "@/models/types/Flow";
import { Autocomplete, IconButton, TextField } from "@mui/material";
import { fbSet } from "@/firebase/settersFe";
import { UploadFileComponent } from "./UploadFileComponent";
import { useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { isNil } from "lodash";
import { VariableDisplay } from "./VariableDisplay";
import CopyToClipboard from "react-copy-to-clipboard";
import { CopyAll } from "@mui/icons-material";

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
        renderVariableValue={(variableName, value) => {
          console.log("Redneing with name", variableName);
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
                    [variableName]: {
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
              <div className="flex gap-2 w-full">
                <UploadFileComponent
                  file={value.file || null}
                  fileComponentId={value.createdAt?.toMillis().toString() || ""}
                  flowKey={flow.uid}
                  onFile={(file) => {
                    fbSet("flow", flow.uid, {
                      globalVariables: {
                        [variableName]: {
                          ...value,
                          file,
                        },
                      },
                    });
                  }}
                ></UploadFileComponent>
                {value?.file?.url && (
                  <div>
                    <CopyToClipboard text={value.file.url}>
                      <IconButton>
                        <CopyAll></CopyAll>
                      </IconButton>
                    </CopyToClipboard>
                  </div>
                )}
              </div>
            ),
            [GlobalVariableType.QueryParam]: (
              <TextField
                label="Default Value"
                value={value.defaultValue}
                onChange={(e) => {
                  fbSet("flow", flow.uid, {
                    globalVariables: {
                      [variableName]: {
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
