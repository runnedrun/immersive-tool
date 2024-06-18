"use client"

import { Button } from "@/components/ui/button"
import { triggerProcessForJobNameAndId } from "@/data/helpers/triggerProcessOnWrite"
import { withData } from "@/data/withData"
import { fbCreate } from "@/firebase/settersFe"
import { Flow } from "@/models/types/Flow"
import { FlowMessage, SenderType } from "@/models/types/FlowMessage"
import { FlowRun } from "@/models/types/FlowRun"
import { useEffect, useRef, useState } from "react"
import { BeatLoader } from "react-spinners"
import TextareaAutosize from "react-textarea-autosize"
import { DebugMessagesDisplay } from "./DebugMessagesDisplay"
import { MessageDisplay } from "./MessageDisplay"
import { flowRunDataFn } from "./flowRunDataFn"
import { isVisibleMessage } from "./isVisibleMessage"

const NewFlowMessageTextBox = ({
  flowRunKey,
  flowKey,
  disabled,
}: {
  flowRunKey: string
  flowKey: string
  disabled?: boolean
}) => {
  const [messageText, setMessageText] = useState("")
  const sendMessage = async () => {
    fbCreate("flowMessage", {
      flowRunKey,
      text: messageText,
      senderType: SenderType.User,
      flowKey,
      processedForStepRunKey: null,
      processedForStep: null,
      toolCallsJSON: null,
    })
    triggerProcessForJobNameAndId("flowRun", flowRunKey)
    setMessageText("")
  }
  return (
    <div className="mr-2 flex w-full flex-col items-end gap-2">
      <TextareaAutosize
        disabled={disabled}
        className="w-full rounded-md border-2 border-gray-300 p-2"
        onChange={(e) => {
          setMessageText(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            sendMessage()
            e.preventDefault()

            return false
          }
        }}
        value={messageText}
        minRows={2}
      ></TextareaAutosize>
      <Button
        className={"grow-0"}
        type="submit"
        onClick={() => {
          sendMessage()
        }}
      >
        Send
      </Button>
    </div>
  )
}

const MessagesDisplay = ({
  messages,
  flow,
}: {
  messages: FlowMessage[]
  flowRun: FlowRun
  flow: Flow
}) => {
  const messagesToDisplay = messages.filter((message) => {
    return isVisibleMessage(message)
  })
  const messageListRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (messageListRef.current) {
      const firstChild = messageListRef.current.firstElementChild
      if (firstChild) {
        firstChild.scrollIntoView({ behavior: "smooth", block: "end" })
      }
    }
  }, [messagesToDisplay.length])

  return (
    <div
      className="flex min-h-0 grow flex-col-reverse justify-start overflow-auto"
      ref={messageListRef}
    >
      {messagesToDisplay.map((message) => {
        return (
          <MessageDisplay
            message={message}
            flow={flow}
            key={message.uid}
          ></MessageDisplay>
        )
      })}
    </div>
  )
}

export const FlowRunDisplay = withData(
  flowRunDataFn,
  ({ data: { messages, flowRun, flow, debugMode, runId } }) => {
    const firstMessage = messages[0]
    const isLoading =
      firstMessage?.senderType !== SenderType.Bot && !flowRun.completedAt

    return (
      <div className="flow-run-display flex h-screen w-full justify-center pb-5">
        <div className="flex h-full w-full flex-col justify-end gap-4 p-4 md:w-[32rem]">
          {flowRun.isDebug && (
            <div className="min-h-0 text-center text-lg text-red-400">
              This is a DEBUG run
            </div>
          )}
          <div className="flex min-h-0 grow flex-col gap-2">
            {debugMode ? (
              <DebugMessagesDisplay
                flowRun={flowRun}
                messages={messages}
              ></DebugMessagesDisplay>
            ) : (
              <MessagesDisplay
                flowRun={flowRun}
                flow={flow}
                messages={messages}
              ></MessagesDisplay>
            )}

            {isLoading && (
              <div className="my-2">
                <BeatLoader></BeatLoader>
              </div>
            )}

            <NewFlowMessageTextBox
              disabled={!flowRun.allowInput || isLoading}
              flowRunKey={runId}
              flowKey={flowRun.flowKey}
            ></NewFlowMessageTextBox>
          </div>
        </div>
      </div>
    )
  }
)
