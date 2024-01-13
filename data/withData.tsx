"use client";

import { omit } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { Observable } from "rxjs";
import {
  ComponentWithInitialValues,
  DataFnType,
  PassFromServerToClientProp,
} from "./component";
import {
  DataWithStatics,
  DataWithoutStatics,
  splitDataAndStatics,
} from "./DataWithStatics";
import { hydrateTimestamps } from "@/firebase/hydrateTimestampsFe";

type a = DataWithStatics<{ a: Observable<string> }>;

export const withData = <
  DataType extends Record<string, Observable<any>>,
  StaticProps extends Record<string, any>,
  ParamsType extends Record<string, any>
>(
  dataFn: DataFnType<DataType, ParamsType, StaticProps>,
  Component: (
    props: { data: DataWithStatics<DataType>; params: ParamsType } & StaticProps
  ) => JSX.Element
): ComponentWithInitialValues<
  DataWithoutStatics<DataType>,
  ParamsType,
  StaticProps
> => {
  const UnderlyingComponent = (
    props: PassFromServerToClientProp<DataWithoutStatics<DataType>> &
      StaticProps & { params: ParamsType }
  ) => {
    const withoutInitialData = useMemo(
      () => omit(props, "_initialValues") as unknown as StaticProps,
      [props]
    );

    const { dataObs, statics } = useMemo(() => {
      const dataObj = dataFn({
        params: props.params,
        props: withoutInitialData,
      });

      return splitDataAndStatics(dataObj);
    }, [props.params, withoutInitialData]);

    const [resolvedData, setResolvedData] = useState(
      hydrateTimestamps(
        props._initialValues || {}
      ) as DataWithoutStatics<DataType>
    );

    useEffect(() => {
      const sub = dataObs.subscribe((data) => {
        setResolvedData(data as DataWithoutStatics<DataType>);
      });
      return () => sub.unsubscribe();
    }, [dataObs]);

    return (
      <Component
        params={props.params}
        data={{ ...resolvedData, ...statics }}
        {...withoutInitialData}
      />
    );
  };
  return UnderlyingComponent;
};
