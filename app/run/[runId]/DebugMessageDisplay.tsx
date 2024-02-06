import { DataFnType } from "@/data/component";
import { withData } from "@/data/withData";
import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { Step } from "@/models/types/Step";
import { Observable, of } from "rxjs";
import { JsonView, allExpanded, defaultStyles } from "react-json-view-lite";

import { getObsForDoc, readDoc } from "@/firebase/readerFe";
import { JsonDisplay } from "./JsonDisplay";

export const dataFn: DataFnType<{}, {}, { message: FlowMessage }> = ({
  props,
}) => {
  // const stepObs = props.message.processedForStep
  //   ? getObsForDoc("step", props.message.processedForStep)
  //   : of(null as Step | null);
  return {};
};

export const SenderTypeNameMap: Record<SenderType, string> = {
  [SenderType.User]: "You",
  [SenderType.Introduction]: "Introduction",
  [SenderType.System]: "System",
  [SenderType.ToolResponse]: "Tool Response",
  [SenderType.ToolCall]: "Tool Call",
  [SenderType.Bot]: "AI message to user",
};

export const DebugMessageDisplay = withData(dataFn, ({ data: {}, message }) => {
  const fnResponseDisplay =
    message.senderType === SenderType.ToolResponse ? (
      <div>Response: {message.text}</div>
    ) : null;

  const fnCallDisplay =
    message.senderType === SenderType.ToolCall ? (
      <div>
        <div>Data</div>
        <div>
          <JsonDisplay
            data={JSON.parse(message.toolCallJSON || "{}")}
          ></JsonDisplay>
        </div>
      </div>
    ) : null;

  const textDisplay = message.text ? <div>{message.text}</div> : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold text-sm">
        {SenderTypeNameMap[message.senderType]}
      </div>
      {fnResponseDisplay}
      {fnCallDisplay}
      {textDisplay}
    </div>
  );
});
