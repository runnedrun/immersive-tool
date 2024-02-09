import { Step } from "@/models/types/Step";
import {
  StepRun,
  StepRunState,
  getNextStepRunState,
} from "@/models/types/StepRun";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { runTools } from "./runTools";
import { getSaveVariableFnSpec } from "./tools/buildSaveVariableFn";
import { fbSet } from "../../helpers/fbWriters";
import { isEmpty } from "lodash";
import { Timestamp } from "firebase-admin/firestore";
import { runPromptStep } from "./runPromptStep";
import { sendFinalResponseForStep } from "./sendFinalResponseForStep";
import { RunnableFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { saveOutputVariables } from "./saveOutputVariables";

export type StepProcessingToolBuilder<ToolParams extends object> = (
  params: ProcessStepParams
) => RunnableFunctionWithParse<ToolParams>["function"];

export type ProcessStepParams = {
  messages: ChatCompletionMessageParam[];
  currentStep: Step;
  currentStepRun: StepRun;
  allVariablesFromPreviousSteps: Record<string, string>;
};

export type StepRunProcessor = (params: ProcessStepParams) => Promise<boolean>; // boolean for whether or not the step is complete;

const collectDataStep = async (params: ProcessStepParams) => {
  const hasVariablesToCollect = !isEmpty(
    params.currentStep.variableDescriptions
  );

  if (hasVariablesToCollect) {
    fbSet("flowRun", params.currentStepRun.flowRunKey, {
      allowInput: true,
    });
    const tools = [getSaveVariableFnSpec(params)];
    const respSentToUser = await runTools(tools, params);

    if (!respSentToUser) {
      fbSet("flowRun", params.currentStepRun.flowRunKey, {
        allowInput: false,
      });
    }

    return !respSentToUser;
  } else {
    console.log("no variables to collect for", params.currentStepRun.uid);
  }

  return true;
};

const stepRunStateToProcessor: Record<keyof StepRunState, StepRunProcessor> = {
  dataCollectionCompletedAt: collectDataStep,
  promptCompletedAt: runPromptStep,
  outputVariableSavingCompletedAt: saveOutputVariables,
  finalResponseCompletedAt: sendFinalResponseForStep,
  stepCompletedAt: async (_) => true,
};

const runStepRunStateProcessor = async (
  stepStateName: keyof StepRunState,
  params: ProcessStepParams
) => {
  const currentProcessor = stepRunStateToProcessor[stepStateName];
  console.log(
    "running processor for",
    stepStateName,
    params.currentStepRun.uid
  );
  const isComplete = await currentProcessor(params);
  console.log(
    "processor run finished. Is completed?",
    stepStateName,
    isComplete
  );
  if (isComplete) {
    await fbSet("stepRun", params.currentStepRun.uid, {
      state: {
        [stepStateName]: Timestamp.now(),
      },
    });
  }
  return isComplete;
};

export const processStepRun = async (params: ProcessStepParams) => {
  const currentStepRunState = getNextStepRunState(params.currentStepRun.state)!;
  return runStepRunStateProcessor(currentStepRunState, params);
};
