"use client";
import { withData } from "@/data/withData";
import { historyDataFn } from "./historyDataFn";
import { replaceTemplate } from "@/functions/src/triggers/processFlowRun/replaceTemplate";
import { DataFnType } from "@/data/component";
import { Observable } from "rxjs";
import { StepRun } from "@/models/types/StepRun";
import { queryObs } from "@/firebase/getters";
import { orderBy, query, where } from "firebase/firestore";
import { FlowRun } from "@/models/types/FlowRun";
import { Flow } from "@/models/types/Flow";
import Link from "next/link";
import classNames from "classnames";

const stepRunsDataFn: DataFnType<
  {
    stepRuns: Observable<StepRun[]>;
  },
  {},
  {
    flowRun: FlowRun;
    flow: Flow;
  }
> = ({ props: { flowRun } }) => {
  return {
    stepRuns: queryObs("stepRun", (collection) => {
      return query(collection, where("flowRunKey", "==", flowRun.uid));
    }),
  };
};

const HistoryRunDisplay = withData(
  stepRunsDataFn,
  ({ data: { stepRuns }, flow, flowRun }) => {
    const idTemplate = flow.runIdentifier;
    let identifier = flowRun.createdAt.toDate().toLocaleString();
    if (idTemplate) {
      const variables = (stepRuns || []).reduce((acc, stepRun) => {
        return {
          ...acc,
          ...stepRun.variableValues,
        };
      }, {} as Record<string, string>);
      identifier = `${identifier}: ${replaceTemplate(idTemplate, variables)}`;
    }

    return (
      <div
        className={classNames("text-sm", { "text-gray-400": flowRun.isDebug })}
      >
        <Link
          href={`/run/${flowRun.uid}?debug=true`}
          className="underline cursor-pointer"
        >
          <div>{identifier}</div>
        </Link>
      </div>
    );
  }
);

export const HistoryDisplay = withData(
  historyDataFn,
  ({ data: { flowRunHistory, flow } }) => {
    return (
      <div className="flex w-full justify-center mt-20 relative pt-10">
        <div className="w-[40rem] flex flex-col gap-3 p-3">
          <div className="text-lg">History</div>
          <div className="flex flex-col gap-2">
            {flowRunHistory.map((flowRun) => {
              return (
                <HistoryRunDisplay
                  flowRun={flowRun}
                  key={flowRun.uid}
                  flow={flow}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);
