"use client";

import { isUndefined, omit } from "lodash";
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
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";

type a = DataWithStatics<{ a: Observable<string> }>;

export const withData = <
  DataType extends Record<string, any>,
  StaticProps extends Record<string, any>,
  ParamsType extends Record<string, any>
>(
  dataFn: DataFnType<DataType, ParamsType, StaticProps>,
  Component: (
    props: {
      data: DataWithStatics<DataType>;
    } & StaticProps
  ) => JSX.Element
): ComponentWithInitialValues<
  DataWithoutStatics<DataType>,
  ParamsType,
  StaticProps
> => {
  const UnderlyingComponent = (
    props: PassFromServerToClientProp<
      DataWithoutStatics<DataType>,
      ParamsType
    > &
      StaticProps
  ) => {
    const withoutInitialData = useMemo(
      () => omit(props, "_initialValues") as unknown as StaticProps,
      [props]
    );

    const params = useParams();
    const searchParams = useSearchParams();

    const { dataObs, statics } = useMemo(() => {
      const allSearchParams = {} as Record<string, string>;
      searchParams.forEach((value, key) => {
        allSearchParams[key] = value;
      });
      const allParams = {
        ...params,
        ...allSearchParams,
      } as unknown as ParamsType;

      const dataObj = dataFn({
        params: allParams,
        props: withoutInitialData,
      });

      return splitDataAndStatics(dataObj);
    }, [params, searchParams, withoutInitialData]);

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
