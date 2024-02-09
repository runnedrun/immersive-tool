import { JsonView, defaultStyles } from "react-json-view-lite";

export const JsonDisplay = ({
  data,
}: {
  data: Record<string, string | undefined>;
}) => {
  return (
    <div className="json-view">
      <JsonView
        shouldExpandNode={(a) => a < 4}
        data={data}
        style={defaultStyles}
      ></JsonView>
    </div>
  );
};
