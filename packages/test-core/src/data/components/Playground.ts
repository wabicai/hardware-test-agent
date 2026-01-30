/**
 * Playground component types
 * Used by chain data files for SDK method demonstrations
 */

export type PlaygroundProps = {
  method: string;
  description?: string;
  presupposes?: {
    title: string;
    value: any;
  }[];
  // Optional flags
  noDeviceIdReq?: boolean;
  noConnIdReq?: boolean;
  deprecated?: boolean;
};
