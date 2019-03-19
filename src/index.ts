/* global DEBUG */
// tslint:disable-next-line
import { MIMEType, ajax, AsyncOptions } from 'tinyjx';
// tslint:disable-next-line
import { APIzClient, HTTPMethodLowerCase, ClientRequestOptions, HTTPMethodUpperCase } from "apiz-ng";

const retryMap: {
	[k: number]: number;
	// tslint:disable-next-line
} = {}, isFn = (f: any): f is Function => typeof f === 'function';
let reqId = Date.now();

function request(opts: RequestOptions): Promise<any> {
	// tslint:disable-next-line
	let { url, method, type, data, beforeSend, afterResponse, complete, retry = 0, options = {}, id = ++reqId } = opts, reqData: any;
	retryMap[id] = -~retryMap[id];
	opts.id = id;
	if (data) {
		reqData = options.data = data;
		options.contentType = type;
	}
	options.url = url;
	options.method = method;
	return new Promise((rs, rj) => {
		ajax({
			beforeSend,
			// $防止遮蔽
			success($data, xhr) {
				delete retryMap[id];
				// 算了, 这个异常还是让它直接crash掉吧, 和后面保持一致
				isFn(afterResponse) && afterResponse($data, 'success', xhr, url, reqData);
				rs({
					$data,
					next() {
						isFn(complete) && complete($data, xhr, url, reqData);
					}
				});
			},
			// $防止遮蔽
			error(err, $data, xhr) {
				if (retryMap[id] < retry + 1) {
					rs(request(opts));
				} else {
					delete retryMap[id];
					isFn(afterResponse) && afterResponse($data, 'error', xhr, url, reqData);
					rj({
						err,
						next() {
							isFn(complete) && complete(undefined, xhr, url, reqData);
						}
					});
				}
			},
			...options
		});
	});
}

export interface APIzClientOptions {
	beforeSend?(xhr: XMLHttpRequest): void | boolean,
	afterResponse?(resData: any, status: string, xhr: XMLHttpRequest, url: string, reqData: any): void,
	complete?(resData: any, xhr: XMLHttpRequest, url: string, reqData: any): void,
	retry?: number
}

interface RequestOptions extends APIzClientOptions {
	id?: number;
	url: string;
	type?: APIzClientType;
	options?: AsyncOptions;
	method: HTTPMethodUpperCase;
	data?: any;
}

export type APIzClientType = keyof MIMEType;

export type APIzClientMeta = any;

export type APIzClientInstance = APIzClient<APIzClientType, APIzClientMeta, AsyncOptions, HTTPMethodLowerCase>;

export { AsyncOptions as APIzRequestOptions };

/**
 * { beforeSend, afterResponse, retry }
 */
export default function (opts: APIzClientOptions = {}): APIzClientInstance {
	return {
		...['get', 'head'].reduce((prev, cur) =>
			(prev[cur as HTTPMethodLowerCase] = ({ name, meta, url, options }: ClientRequestOptions<APIzClientType, APIzClientMeta, AsyncOptions>) => request({
				...opts,
				url,
				method: cur.toUpperCase() as HTTPMethodUpperCase,
				options
			}), prev), {} as APIzClient<APIzClientType, APIzClientMeta, AsyncOptions, HTTPMethodLowerCase>),
		...['post', 'put', 'patch', 'delete', 'options'].reduce((prev, cur) =>
			(prev[cur as HTTPMethodLowerCase] = ({ name, meta, url, body, options, type }: ClientRequestOptions<APIzClientType, APIzClientMeta, AsyncOptions>) => request({
				...opts,
				url,
				type,
				options,
				method: cur.toUpperCase() as HTTPMethodUpperCase,
				data: body
			}), prev), {} as APIzClient<APIzClientType, APIzClientMeta, AsyncOptions, HTTPMethodLowerCase>)
	};
}
