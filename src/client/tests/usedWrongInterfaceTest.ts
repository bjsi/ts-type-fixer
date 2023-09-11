const startFile = "FocusableComponentContainer.ts";
export const usedWrongInterfaceTest = {
  startFile: startFile,
  files: {
    startFile: `
export interface FocusableComponentContainerProps {
  externalIsInFocus?: boolean;
}

export interface FocusableComponentContainerTrackerProps
  extends FocusableComponentContainerProps {
  isInFocus?: boolean;
}

type TrackerProps = FocusableComponentContainerProps;

function FocusableComponentContainer<
  ExternalProps extends FocusableComponentContainerProps,
  TrackerProps extends FocusableComponentContainerProps
>() {
  const componentWithBoxFocus = (props: TrackerProps) => {
    const outlineClassName =
      "outline outline-offset-2 outline-2 " + props.isInFocus
        ? "outline-blue"
        : "outline-black";
    // ... more code
  };
  // ... more code
}

export default FocusableComponentContainer;
`.trim(),
  },
};
