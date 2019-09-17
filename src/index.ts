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
	beforeSend?: (options: AjaxOptions) => void | boolean,
	afterResponse?: (resData: any, status: 'success' | 'error', xhr: XMLHttpRequest, url: string, reqData: any) => void,
	error?: (errType: 'recoverableError' | 'unrecoverableError', err: Error, data: any, xhr: XMLHttpRequest) => PromiseResult | boolean | undefined,
	retry?: number
}

interface APIzClientConstructorOptionsWithMethod extends APIzClientConstructorOptions {
	method: HTTPMethodUpperCase;
}

type Callable = (...args: Array<any>) => any;

interface PromiseResult {
	data?: any;
	status?: 'recoverableError' | 'unrecoverableError';
	xhr: XMLHttpRequest;
	err?: Error;
}

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
	return async function request({
		url,
		options,
		body,
		headers = {},
		type,
		handleError = true
	}: ClientRequestOptions<AjaxOptions, APIzClientType, APIzClientMeta>): Promise<PromiseResult> {
		let $options: AjaxOptions | undefined;
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

		if (isFn(beforeSend)) {
			const rst = await beforeSend($options);
			if (rst === false) {
				throw new Error('apiz: cancel');
			}
		}

		let result: PromiseResult | undefined, e: PromiseResult | undefined;
		try {
			// tslint:disable-next-line
			result = await pRetry<PromiseResult>(() => new Promise((rs, rj) => {
				ajax({
					...$options,
					success(data: any, xhr: XMLHttpRequest): void {
						rs({
							data,
							xhr
						});
					},
					recoverableError(err: Error, data: any, xhr: XMLHttpRequest): void {
						rj({
							status: 'recoverableError',
							data,
							xhr,
							err
						});
					},
					unrecoverableError(err: Error, xhr: XMLHttpRequest): void {
						rj({
							status: 'unrecoverableError',
							data: undefined,
							xhr,
							err
						});
					}
				});
			}), {
				retry
			});
		} catch ($err) {
			e = $err;
		}

		const resData = result && result.data || e && e.data,
			status = result && !e ? 'success' : 'error',
			$xhr = result && result.xhr || e && e.xhr;
		if ((result || e && e.status === 'recoverableError') && isFn(afterResponse)) {
			await afterResponse(resData, status, $xhr!, url, body);
		}

		if (e) {
			let recoverable: PromiseResult | boolean | undefined = false;
			if (isFn(error) && handleError) {
				recoverable = await error(e.status!, e.err!, e.data, e.xhr);
			}
			// 返回false, 不可恢复
			if (recoverable === false || recoverable === undefined) {
				throw new Error(`Error: ${e.err!.message}, URL: ${url}, Method: ${method}`);
			// 有非undefined的返回值, 可以恢复, 返回值作为结果
			} else {
				return recoverable as PromiseResult;
			}
		} else {
			return result!;
		}
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
