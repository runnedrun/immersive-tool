import { JsonView, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

export const JsonDisplay = ({ data }: { data: Record<string, string> }) => {
  return (
    <JsonView
      shouldExpandNode={(a) => a < 1}
      data={data}
      style={defaultStyles}
    ></JsonView>
  );
};
