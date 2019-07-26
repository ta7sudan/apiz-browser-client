/* global DEBUG */
// tslint:disable-next-line
import { MIMEType, ajax, AjaxOptions } from 'tinyjx';
// tslint:disable-next-line
import { APIzClient, HTTPMethodLowerCase, ClientRequestOptions, APIzClientRequest, HTTPMethodUpperCase } from 'apiz-ng';

export type APIzClientType = keyof MIMEType;

export type APIzClientMeta = any;

export type APIzClientInstance = APIzClient<AjaxOptions, APIzClientType, any, HTTPMethodLowerCase>;

export { AjaxOptions as APIzRawRequestOptions };

export interface APIzClientConstructorOptions {
	beforeSend?: (xhr: XMLHttpRequest) => void | boolean,
	afterResponse?: (resData: any, status: string, xhr: XMLHttpRequest, url: string, reqData: any) => void,
	error?: (errType: string, err: Error, data: any, xhr: XMLHttpRequest) => void,
	retry?: number
}

interface APIzClientConstructorOptionsWithMethod extends APIzClientConstructorOptions {
	method: HTTPMethodUpperCase;
}

type Callable = (...args: Array<any>) => any;

const isFn = (f: any): f is Callable => typeof f === 'function';

function isPromise<T = any>(p: any): p is Promise<T> {
	return !!(p && typeof p.then === 'function');
}

async function pRetry<Result = any>(
	this: any,
	fn: (...args: any[]) => any,
	{
		retry,
		beforeRetry
	}: {
		retry: number;
		beforeRetry?: (retryCount: number, e: Error) => any;
	},
	alreadyTried: number = 1
): Promise<Result> {
	let rst: Result | Promise<Result> | null = null;
	if (retry < 0 || (retry > Number.MAX_SAFE_INTEGER && retry !== Infinity)) {
		throw new Error('retry must be between 0 to Number.MAX_SAFE_INTEGER or be Infinity');
	}

	try {
		rst = fn.call(this);
		if (isPromise<Result>(rst)) {
			rst = await rst;
		}
	} catch (e) {
		if (beforeRetry) {
			beforeRetry(alreadyTried, e);
		}
		if (retry) {
			return pRetry<Result>(
				fn,
				{
					// tslint:disable-next-line
					retry: --retry,
					beforeRetry
				},
				// tslint:disable-next-line
				++alreadyTried
			);
		} else {
			throw e;
		}
	}
	return rst!;
}


function createRequest({
		method,
		beforeSend,
		afterResponse,
		error,
		retry = 0
	}: APIzClientConstructorOptionsWithMethod
): APIzClientRequest<AjaxOptions, APIzClientType, APIzClientMeta> {
	return function request({
		url,
		options,
		body,
		headers,
		type,
		handleError = true
	}: ClientRequestOptions<AjaxOptions, APIzClientType, APIzClientMeta>): Promise<any> {
		let $options: AjaxOptions | undefined, count = 0;
		if (options) {
			$options = {
				...options,
				url,
				method
			};
		} else {
			$options = {
				url,
				method,
				processData: false,
				data: body,
				contentType: type,
				headers
			};
		}
		return pRetry(() => {
			// tslint:disable-next-line
			return new Promise((rs, rj) => {
				ajax({
					...$options,
					beforeSend(xhr: XMLHttpRequest): any {
						if (!count && isFn(beforeSend)) {
							return beforeSend(xhr);
						}
					},
					success(data: any, xhr: XMLHttpRequest): void {
						isFn(afterResponse) && count === retry && afterResponse(data, 'success', xhr, url, body);
						rs({
							data,
							xhr
						});
					},
					recoverableError(err: Error, data: any, xhr: XMLHttpRequest): void {
						isFn(afterResponse) && count === retry && afterResponse(data, 'error', xhr, url, body);
						isFn(error) && count === retry && handleError && error('recoverableError', err, data, xhr);
						rj({
							err,
							data
						});
					},
					unrecoverableError(err: Error, xhr: XMLHttpRequest): void {
						isFn(error) && count === retry && handleError && error('unrecoverableError', err, undefined, xhr);
						rj({
							err,
							data: undefined
						});
					}
				});
			});
		}, {
			retry,
			beforeRetry(): void {
				++count;
			}
		});
	};
}


/**
 * { beforeSend, afterResponse, retry }
 */
export default function (opts: APIzClientConstructorOptions = {}): APIzClientInstance {
	return (['get', 'head', 'post', 'put', 'patch', 'delete', 'options'] as Array<HTTPMethodLowerCase>)
		.reduce(
			(prev: APIzClientInstance, cur: HTTPMethodLowerCase) => (prev[cur] = createRequest({
				...opts,
				method: cur.toUpperCase() as HTTPMethodUpperCase
			}), prev),
			{} as APIzClientInstance
		);
}
