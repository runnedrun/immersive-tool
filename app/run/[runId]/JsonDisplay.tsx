import { JsonView, defaultStyles } from "react-json-view-lite";

export const JsonDisplay = ({
  data,
}: {
  data: Record<string, string | undefined>;
}) => {
  return (
    <JsonView
      shouldExpandNode={(a) => a < 1}
      data={data}
      style={defaultStyles}
    ></JsonView>
  );
};
