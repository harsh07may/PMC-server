declare namespace Express {
    export interface Request {
       User?: {
        userId?: number
       } | JwtPayload
    }
 }