import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "@firebase/functions"
import { initFb } from "./initFb"
import { isDemoMode } from "./isDemoMode"
import { isServerside } from "@/lib/isServerSide"
import { jsonifyTimestamps } from "./jsonifyTimestamps"
import { hydrateTimestamps } from "./hydrateTimestampsFe"

const buildCallableFunction = <ArgType, OutputType>(
  backendFunctionName: string,
  functionToCallOnServer = (args: ArgType) =>
    Promise.resolve(null) as Promise<OutputType>
) => {
  initFb()
  const functions = getFunctions()
  isDemoMode() && connectFunctionsEmulator(functions, "localhost", 5002)
  const func = isServerside()
    ? functionToCallOnServer
    : (args: ArgType) =>
        httpsCallable(
          functions,
          backendFunctionName
        )(jsonifyTimestamps(args)).then((_: any) => {
          const data = _.data
          return hydrateTimestamps(data) as OutputType
        })

  return (args: ArgType) => {
    return func(args)
  }
}

export const setup = buildCallableFunction<{}, any>("setup")
