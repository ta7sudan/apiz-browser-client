import { MIMEType, AjaxOptions } from 'tinyjx';
import { APIzClient, HTTPMethodLowerCase } from 'apiz-ng';
export declare type APIzClientType = keyof MIMEType;
export declare type APIzClientMeta = any;
export declare type APIzClientInstance = APIzClient<AjaxOptions, APIzClientType, any, HTTPMethodLowerCase>;
export { AjaxOptions as APIzRawRequestOptions };
export interface APIzClientConstructorOptions {
    beforeSend?: (options: AjaxOptions) => void | boolean;
    afterResponse?: (resData: any, status: 'success' | 'error', xhr: XMLHttpRequest, url: string, reqData: any) => void;
    error?: (errType: 'recoverableError' | 'unrecoverableError', err: Error, data: any, xhr: XMLHttpRequest) => PromiseResult | boolean | undefined;
    retry?: number;
}
interface PromiseResult {
    data?: any;
    status?: 'recoverableError' | 'unrecoverableError';
    xhr: XMLHttpRequest;
    err?: Error;
}
/**
 * { beforeSend, afterResponse, retry }
 */
export default function (opts?: APIzClientConstructorOptions): APIzClientInstance;
//# sourceMappingURL=index.d.ts.map