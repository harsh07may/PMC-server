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
