import { config as defaultConfig } from "@react-spring/web";

const springConfig = {
  ...defaultConfig,
  brisk: {
    tension: 400,
    friction: 30,
  },
  snappy: {
    tension: 1000,
    friction: 40,
  },
};

export default springConfig;

export type SpringConfig = typeof springConfig;
