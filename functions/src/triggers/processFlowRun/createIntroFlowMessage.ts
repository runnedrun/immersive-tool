import { Flow } from "@/models/types/Flow";
import { SenderType } from "@/models/types/FlowMessage";
import { fbCreate } from "../../helpers/fbWriters";

export const createIntroFlowMessage = async (
  flow: Flow,
  flowRunKey: string
) => {
  const res = await fbCreate("flowMessage", {
    text: `You are a helpful assistant gathering information from a user, in order to faciliate the following task:
title: ${flow.title}
description: ${flow.description}
  
I will prompt to you complete this tasks as a series of steps. In each step you will execute a prompt, possibly using information gathered from the user.`,
    senderType: SenderType.System,
    flowKey: flow.uid,
    processedForStep: null,
    processedForStepRunKey: null,
    flowRunKey: flowRunKey,
    isFlowIntro: true,
  });
  return res;
};

export const createUserFacingIntro = async (flow: Flow, flowRunKey: string) => {
  const res = await fbCreate("flowMessage", {
    text: flow.introductionMessage,
    senderType: SenderType.Introduction,
    flowKey: flow.uid,
    processedForStep: null,
    processedForStepRunKey: null,
    flowRunKey: flowRunKey,
  });
  return res;
};
