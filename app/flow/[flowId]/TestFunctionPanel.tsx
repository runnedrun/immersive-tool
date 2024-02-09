"use client";
import { DataFnType } from "@/data/component";
import {
  triggerProcessForJobNameAndId,
  triggerProcessOnWrite,
} from "@/data/helpers/triggerProcessOnWrite";
import { withData } from "@/data/withData";
import { getObsForDoc } from "@/firebase/readerFe";
import { fbSet } from "@/firebase/settersFe";
import {
  PossibleFnNames,
  availableToolSpecsByName,
} from "@/functions/src/triggers/processFlowRun/tools/availableTools";
import { testFunction } from "@/functions/src/triggers/testFunction/testFunction";
import { objKeys } from "@/lib/helpers/objKeys";
import {
  TestFunctionJob,
  getTestFunctionJobId,
} from "@/models/types/TestFunctionJob";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import Form from "@rjsf/mui";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import { Observable } from "rxjs";

const dataFn: DataFnType<
  {
    testFunctionJob: Observable<TestFunctionJob>;
  },
  {},
  {
    flowId: string;
    functionName: string;
  }
> = ({ props: { flowId, functionName } }) => {
  const testFunctionJob = getObsForDoc(
    "testFunctionJob",
    getTestFunctionJobId(flowId, functionName)
  );
  return {
    testFunctionJob,
  };
};

export const TestFunctionView = withData(
  dataFn,
  ({ functionName, flowId, data: { testFunctionJob } }) => {
    const functionSpec =
      availableToolSpecsByName[functionName as PossibleFnNames];

    const formData = testFunctionJob?.args || {};

    if (!functionSpec || !testFunctionJob) {
      return <CircularProgress></CircularProgress>;
    }
    const startedAt = testFunctionJob?.startedAt || 0;
    const endedAt = testFunctionJob?.completedAt || 0;

    const loadingDisplay =
      startedAt > endedAt ? (
        <div>
          <CircularProgress></CircularProgress>
        </div>
      ) : testFunctionJob?.result ? (
        <div className="bg-gray-200 p-3">
          <div className="font-bold">Result</div>
          <div className="whitespace-pre-wrap">{testFunctionJob.result}</div>
        </div>
      ) : (
        <div></div>
      );

    return (
      <div className="pb-10">
        <div>{functionSpec.description}</div>

        <Form
          className="mb-4"
          schema={functionSpec.parameters as RJSFSchema}
          validator={validator}
          formData={formData}
          onChange={(a) => {
            fbSet("testFunctionJob", testFunctionJob.uid, { args: a.formData });
          }}
          onSubmit={(a) => {
            triggerProcessOnWrite(
              fbSet("testFunctionJob", testFunctionJob.uid, {
                functionName: functionName as PossibleFnNames,
                flowId: flowId,
                result: null,
                startedAt: Timestamp.now(),
              })
            );
          }}
        />
        {loadingDisplay}
      </div>
    );
  }
);

export const TestFunctionPanel = ({ flowId }: { flowId: string }) => {
  const [selectedFunctionName, setSelectedFunctionName] = useState<
    string | null
  >("");
  const functionNames = objKeys(availableToolSpecsByName);
  return (
    <div className="w-full overflow-auto h-full">
      <div className="h-full p-5 flex flex-col gap-4">
        <div className="font-bold text-lg">Test Functions</div>
        <Autocomplete
          disablePortal
          className="w-full"
          options={functionNames}
          renderInput={(params) => <TextField {...params} label="Function" />}
          onChange={(e, value) => {
            setSelectedFunctionName(value);
          }}
        ></Autocomplete>
        <div>
          {selectedFunctionName && (
            <TestFunctionView
              flowId={flowId}
              functionName={selectedFunctionName}
            ></TestFunctionView>
          )}
        </div>
      </div>
    </div>
  );
};
