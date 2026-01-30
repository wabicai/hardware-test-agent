/**
 * Playground component types
 * Used by chain data files for SDK method demonstrations
 */

export type PlaygroundProps = {
  method: string;
  description: string;
  presupposes: {
    title: string;
    value: any;
  }[];
};
