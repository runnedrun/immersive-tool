import path from "path";
import { ProcessStepParams } from "../processStepRun";
import { v4 } from "uuid";

export const getAudioPath = (params: ProcessStepParams, audioType: string) => {
  return path.join(
    "audio",
    params.currentStepRun.flowKey,
    params.currentStepRun.uid,
    audioType,
    `${v4()}.mp3`
  );
};
