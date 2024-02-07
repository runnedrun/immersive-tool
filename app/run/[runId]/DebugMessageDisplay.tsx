import { DataFnType } from "@/data/component";
import { withData } from "@/data/withData";
import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { JsonDisplay } from "./JsonDisplay";
import classnames from "classnames";
import { isVisibleMessage } from "./isVisibleMessage";

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
  const textDisplay = message.text ? (
    <div
      className={classnames(
        { "text-gray-500": !isVisibleMessage(message) },
        "whitespace-pre-wrap"
      )}
    >
      {message.text}
    </div>
  ) : null;

  const fnCallDisplay =
    message.senderType === SenderType.ToolCall ? (
      <div>
        <div>Data</div>
        <div>
          <JsonDisplay
            data={JSON.parse(message.toolCallsJSON || "{}")}
          ></JsonDisplay>
        </div>
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="font-bold text-sm">
        {SenderTypeNameMap[message.senderType]}
      </div>
      {fnCallDisplay}
      {textDisplay}
    </div>
  );
});
