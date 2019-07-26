import { MIMEType, AjaxOptions } from 'tinyjx';
import { APIzClient, HTTPMethodLowerCase } from 'apiz-ng';
export declare type APIzClientType = keyof MIMEType;
export declare type APIzClientMeta = any;
export declare type APIzClientInstance = APIzClient<AjaxOptions, APIzClientType, any, HTTPMethodLowerCase>;
export { AjaxOptions as APIzRawRequestOptions };
export interface APIzClientConstructorOptions {
    beforeSend?: (xhr: XMLHttpRequest) => void | boolean;
    afterResponse?: (resData: any, status: string, xhr: XMLHttpRequest, url: string, reqData: any) => void;
    error?: (errType: string, err: Error, data: any, xhr: XMLHttpRequest) => void;
    retry?: number;
}
/**
 * { beforeSend, afterResponse, retry }
 */
export default function (opts?: APIzClientConstructorOptions): APIzClientInstance;
//# sourceMappingURL=index.d.ts.map