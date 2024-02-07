import { Step } from "@/models/types/Step";
import {
  StepRun,
  StepRunState,
  getNextStepRunState,
} from "@/models/types/StepRun";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { runTools } from "./runTools";
import { getSaveVariableFnSpec } from "./tools/buildSaveVariableFn";
import { getSaveOutputVariablesFnSpec } from "./tools/buildSaveOutputVariablesFn";
import { fbSet } from "../../helpers/fbWriters";
import { isEmpty } from "lodash";
import { Timestamp } from "firebase-admin/firestore";
import { runPromptStep } from "./runPromptStep";
import { sendFinalResponseForStep } from "./sendFinalResponseForStep";

export type StepProcessingToolBuilder<ToolParams extends object> = (
  params: ProcessStepParams
) => (params: ToolParams) => Promise<string | null>;

export type ProcessStepParams = {
  messages: ChatCompletionMessageParam[];
  currentStep: Step;
  currentStepRun: StepRun;
  allVariablesFromPreviousSteps: Record<string, string>;
  reRunFlowRunProcessor: () => Promise<any>;
};

export type StepRunProcessor = (params: ProcessStepParams) => Promise<boolean>; // boolean for whether or not the step is complete;

const collectDataStep = async (params: ProcessStepParams) => {
  const hasVariablesToCollect = !isEmpty(
    params.currentStep.variableDescriptions
  );

  if (hasVariablesToCollect) {
    const tools = [getSaveVariableFnSpec(params)];
    const respSentToUser = await runTools(tools, params);

    return !respSentToUser;
  }

  return true;
};

const saveOutputVariables: StepRunProcessor = async (params) => {
  const tools = [getSaveOutputVariablesFnSpec(params)];
  await runTools(tools, params, tools[0].name);
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
    await params.reRunFlowRunProcessor();
  }
};

export const processStepRun = async (params: ProcessStepParams) => {
  const currentStepRunState = getNextStepRunState(params.currentStepRun.state)!;
  return runStepRunStateProcessor(currentStepRunState, params);
};
