import { FlowMessage, SenderType } from "@/models/types/FlowMessage";
import { Flow } from "@/models/types/Flow";
import Markdown from "react-markdown";

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
      <Markdown>{message.text}</Markdown>
    </div>
  );
};
