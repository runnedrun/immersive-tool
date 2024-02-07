import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { DebugMessageDisplay } from "./DebugMessageDisplay";
import { Flow } from "@/models/types/Flow";

export const MessageDisplay = ({
  message,
  flow,
}: {
  message: FlowMessage;
  flow: Flow;
}) => {
  const senderNameString =
    message.senderType === SenderType.User ? "You" : flow.aiName || "AI";
  return (
    <div className="flex flex-col">
      <div className="font-bold">{senderNameString}</div>
      <div>{message.text}</div>
    </div>
  );
};
