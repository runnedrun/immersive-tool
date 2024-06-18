import { RunnableFunction } from "openai/lib/RunnableFunction.mjs";
import { HitApiEndpointProps, hitApiEndpoint } from "./hitApiEndPoint";
import { ProcessStepParams } from "../../processStepRun";
import { hitApiEndpointBaseSpec } from "./hitApiAndEndpointBaseSpec";

export const getHitApiEndpointSpec = (
  params: ProcessStepParams
): RunnableFunction<HitApiEndpointProps> => {
  return {
    function: hitApiEndpoint,
    parse: JSON.parse,
    ...hitApiEndpointBaseSpec,
  };
};

