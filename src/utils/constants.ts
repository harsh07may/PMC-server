import dotenv from "dotenv";

dotenv.config();


export const getEnv = (key: string): number | string => {
    const value = process.env[key];

    if (value == undefined) {
        throw Error(`${key} not found in ENV`);
    }

    return value;
}

export const APP_VERSION = "beta";

export const enum MillisecondsIn {
  MILLISECOND = 1,
  SECOND = 1000 * MILLISECOND,
  MINUTE = 60 * SECOND,
  HOUR = 60 * MINUTE,
  DAY = 24 * HOUR,
}
