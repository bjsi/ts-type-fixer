import { FunctionEvent, FunctionObserver } from "modelfusion";

export const loggingObserver: FunctionObserver = {
  onFunctionEvent(event: FunctionEvent) {
    // you could also switch on e.g. event.functionType
    switch (event.eventType) {
      case "started": {
        console.log(
          `[${event.timestamp.toISOString()}] ${event.callId} - ${
            event.functionType
          } ${event.eventType}`
        );
        break;
      }
      case "finished": {
        console.log(
          `[${event.timestamp.toISOString()}] ${event.callId} - ${
            event.functionType
          } ${event.eventType} in ${event.durationInMs}ms`
        );
        break;
      }
    }
  },
};
