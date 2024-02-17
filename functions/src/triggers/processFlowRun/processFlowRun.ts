import { getStepRunId } from "@/models/types/StepRun";
import { Timestamp } from "firebase-admin/firestore";
import { isNil, isUndefined } from "lodash";
import { queryDocs, readDoc } from "../../helpers/fbReaders";
import { fbCreate, fbSet } from "../../helpers/fbWriters";
import {
  createIntroFlowMessage,
  createUserFacingIntro,
} from "./createIntroFlowMessage";
import { processStepRun } from "./processStepRun";
import { createSystemMessageForStepStart } from "./getSystemMessageForStep";
import { getMessagesForAi } from "./getMessagesForAi";
import { FlowMessage } from "@/models/types/FlowMessage";
import { getVariableNamesSorted } from "./getVariableNamesSorted";
import { GlobalVariableData, GlobalVariableType } from "@/models/types/Flow";
import { FlowRun } from "@/models/types/FlowRun";

let reRunsAllowed = 30;

const globalVariableValueGetters: Record<
  GlobalVariableType,
  (name: string, value: GlobalVariableData, flowRun: FlowRun) => string
> = {
  [GlobalVariableType.File]: (name, value) => value.file?.url || "",
  [GlobalVariableType.QueryParam]: (name, value, flowRun) =>
    flowRun.queryParams[name] || value.defaultValue || "",
};

export const processFlowRun = async (flowRunKey: string) => {
  const flowRun = await readDoc("flowRun", flowRunKey);

  const [steps, stepRuns, flow, unprocessedMessages] = await Promise.all([
    queryDocs("step", (q) => {
      return q
        .where("flowKey", "==", flowRun.flowKey)
        .where("archived", "==", false)
        .orderBy("index", "asc");
    }),
    await queryDocs("stepRun", (q) => {
      return q.where("flowRunKey", "==", flowRunKey);
    }),
    readDoc("flow", flowRun.flowKey),
    queryDocs("flowMessage", (q) => {
      return q
        .where("flowRunKey", "==", flowRunKey)
        .where("archived", "==", false)
        .orderBy("createdAt", "desc");
    }),
  ]);

  let messages = unprocessedMessages.length
    ? unprocessedMessages.reverse()
    : [(await createIntroFlowMessage(flow, flowRunKey)).data];

  const stepsCompletedBooleans = steps.map((step) => {
    return !!stepRuns.find(
      (_) => _.stepKey === step.uid && _.state.stepCompletedAt
    );
  });

  const currentStepIndex = stepsCompletedBooleans.indexOf(false);
  const curStep = steps[currentStepIndex];
  const completedSteps = steps.slice(0, currentStepIndex);

  if (!curStep) {
    fbSet("flowRun", flowRunKey, {
      completedAt: Timestamp.now(),
    });
    return false;
  }

  let currentStepRun = stepRuns.find((_) => _.stepKey === curStep.uid);

  const stepRunsWithoutCurrentStep = stepRuns.filter(
    (_) => _.uid !== currentStepRun?.uid
  );

  const allVariablesFromPreviousSteps = completedSteps.reduce((acc, step) => {
    const stepRun = stepRunsWithoutCurrentStep.find(
      (_) => _.stepKey === step.uid
    );
    return {
      ...acc,
      ...(stepRun?.variableValues || {}),
    };
  }, {} as Record<string, string>);

  const globalVariableValues = flow.globalVariables || {};
  const globalVariableNames = getVariableNamesSorted(globalVariableValues);

  const allGlobalVariableValueStrings = globalVariableNames.reduce(
    (acc, name) => {
      const value = globalVariableValues[name];

      if (isNil(value.type)) {
        return acc;
      }
      const stringValue = globalVariableValueGetters[value.type](
        name,
        value,
        flowRun
      );
      return {
        ...acc,
        [name]: stringValue,
      };
    },
    {} as Record<string, string>
  );

  const allVariablesWithGlobals = {
    ...allVariablesFromPreviousSteps,
    ...allGlobalVariableValueStrings,
  };

  if (isUndefined(currentStepRun)) {
    messages = [
      ...messages,
      await createSystemMessageForStepStart({
        allSteps: steps,
        completedSteps,
        flowRun,
        step: curStep,
        variableValuessFromPreviousSteps: allVariablesWithGlobals,
      }),
    ];

    messages =
      messages.length === 2
        ? [...messages, (await createUserFacingIntro(flow, flowRunKey)).data]
        : messages;

    const id = getStepRunId(flowRunKey, curStep.uid);
    const ref = await fbCreate(
      "stepRun",
      {
        flowKey: flowRun.flowKey,
        flowRunKey,
        stepKey: curStep.uid,
        state: {
          dataCollectionCompletedAt: null,
          promptCompletedAt: null,
          outputVariableSavingCompletedAt: null,
          finalResponseCompletedAt: null,
          stepCompletedAt: null,
        },
        variableValues: {},
      },
      { id }
    );

    currentStepRun = ref.data;
  }

  const updatedMessagesWithStepKeyInfo = await Promise.all(
    messages.map(async (message) => {
      if (!message.processedForStep) {
        message.processedForStepRunKey = currentStepRun!.uid;
        message.processedForStep = curStep.uid;

        await fbSet("flowMessage", message.uid, message);
      }
      return message;
    })
  );

  const messagesForGPT = getMessagesForAi(
    updatedMessagesWithStepKeyInfo,
    curStep
  );

  const shouldReRun = await processStepRun({
    messages: messagesForGPT,
    currentStep: curStep,
    currentStepRun,
    allVariablesFromPreviousSteps: allVariablesWithGlobals,
  });

  console.log("re-running?", shouldReRun, flowRunKey);

  return shouldReRun;
};
