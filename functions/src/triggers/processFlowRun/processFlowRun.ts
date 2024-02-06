import { isUndefined } from "lodash";
import { queryDocs, readDoc } from "../../helpers/fbReaders";
import { fbCreate, fbSet } from "../../helpers/fbWriters";
import { getMessagesForAi } from "./getMessagesForAi";
import { processStepRun } from "./processStepRun";
import { getStepRunId } from "@/models/types/StepRun";
import { Timestamp } from "firebase-admin/firestore";

let reRunsAllowed = 30;

export const processFlowRun = async (flowRunKey: string) => {
  const flowRun = await readDoc("flowRun", flowRunKey);

  console.log("flow run", flowRun);

  const [steps, stepRuns, flow, messages] = await Promise.all([
    queryDocs("step", (q) => {
      return q
        .where("flowKey", "==", "1")
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

  const stepsCompletedBooleans = steps.map((step) => {
    return !!stepRuns.find(
      (_) => _.stepKey === step.uid && _.state.stepCompletedAt
    );
  });

  const currentStepIndex = stepsCompletedBooleans.indexOf(false);
  const curStep = steps[currentStepIndex];

  if (!curStep) {
    fbSet("flowRun", flowRunKey, {
      completedAt: Timestamp.now(),
    });
    return false;
  }

  let currentStepRun = stepRuns.find((_) => _.stepKey === curStep.uid);

  if (isUndefined(currentStepRun)) {
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

  const stepRunsWithoutCurrentStep = stepRuns.filter(
    (_) => _.uid !== currentStepRun!.uid
  );

  const completedSteps = steps.slice(0, currentStepIndex);

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

  const allVariablesFromPreviousSteps = completedSteps.reduce((acc, step) => {
    const stepRun = stepRunsWithoutCurrentStep.find(
      (_) => _.stepKey === step.uid
    );
    return {
      ...acc,
      ...(stepRun?.variableValues || {}),
    };
  }, {} as Record<string, string>);

  const messagesForGPT = getMessagesForAi({
    flow,
    completedSteps,
    allSteps: steps,
    messages: updatedMessagesWithStepKeyInfo,
    variableValuessFromPreviousSteps: allVariablesFromPreviousSteps,
  });

  let reRuns = 0;
  const reRun = async () => {
    console.log("re-running flowKey", flowRunKey, "reRuns", reRuns);
    if (reRuns > reRunsAllowed) {
      console.error("Too many reRuns for flowRun:", flowRunKey);
      return;
    }
    reRuns++;
    return processFlowRun(flowRunKey);
  };

  await processStepRun({
    messages: messagesForGPT,
    currentStep: curStep,
    currentStepRun,
    allVariablesFromPreviousSteps,
    reRunFlowRunProcessor: reRun,
  });

  console.log("processFlowRun finished", flowRunKey);

  return false;
};
