import { MIMEType, AsyncOptions } from 'tinyjx';
import { APIzClient, HTTPMethodLowerCase } from "apiz-ng";
export interface APIzClientOptions {
    beforeSend?(xhr: XMLHttpRequest): void | boolean;
    afterResponse?(resData: any, status: string, xhr: XMLHttpRequest, url: string, reqData: any): void;
    complete?(resData: any, xhr: XMLHttpRequest, url: string, reqData: any): void;
    retry?: number;
}
export declare type APIzClientType = keyof MIMEType;
export declare type APIzClientMeta = any;
export declare type APIzClientInstance = APIzClient<APIzClientType, APIzClientMeta, AsyncOptions, HTTPMethodLowerCase>;
/**
 * { beforeSend, afterResponse, retry }
 */
export default function (opts?: APIzClientOptions): APIzClientInstance;
//# sourceMappingURL=index.d.ts.map