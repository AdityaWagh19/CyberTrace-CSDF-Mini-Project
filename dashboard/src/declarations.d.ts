declare module 'plotly.js/dist/plotly.js' {
  const content: any;
  export default content;
}

declare module 'plotly.js/dist/plotly.min.js' {
  const content: any;
  export default content;
}

declare module 'react-plotly.js/factory' {
  import * as React from 'react';
  export default function createPlotlyComponent(plotly: any): React.ComponentType<any>;
}

declare module 'react-plotly.js' {
  import * as React from 'react';
  const Plot: React.ComponentType<any>;
  export default Plot;
}
