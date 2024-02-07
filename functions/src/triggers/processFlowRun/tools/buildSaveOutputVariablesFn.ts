import { isEmpty } from "lodash";
import { fbSet } from "../../../helpers/fbWriters";

import {
  RunnableFunction,
  RunnableFunctionWithParse,
} from "openai/lib/RunnableFunction.mjs";
import { ProcessStepParams } from "../processStepRun";

export type SaveMultipleVariablesParams = Record<string, string>;

// export type ToolFn = (
//   args: string,
//   runner: ChatCompletionRunner | ChatCompletionStreamingRunner
// ) => PromiseOrValue<unknown>;

export const getSaveOutputVariablesFnSpec = (
  params: ProcessStepParams
): RunnableFunction<SaveMultipleVariablesParams> => {
  const variableNames = Object.keys(
    params.currentStep.outputVariableDescriptions || {}
  );
  const propertiesForFn = variableNames.reduce((acc, variableName) => {
    return {
      ...acc,
      [variableName]: { type: "string", description: "The variable value" },
    };
  }, {});

  return {
    function: buildSaveOutputVariableFn(params),
    name: "saveOutputVariables",
    description:
      "Save variables to the database based on the output of the most recent step",
    parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
    parameters: {
      type: "object",
      properties: propertiesForFn,
    },
  };
};

export const buildSaveOutputVariableFn = ({
  currentStepRun,
}: ProcessStepParams): RunnableFunctionWithParse<SaveMultipleVariablesParams>["function"] => {
  return async (params: SaveMultipleVariablesParams, runner) => {
    const currentVariableValues = currentStepRun.variableValues;

    await fbSet("stepRun", currentStepRun.uid, {
      variableValues: {
        ...currentVariableValues,
        ...params,
      },
    });

    runner.abort();
    return null;
  };
};
