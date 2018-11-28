/* global DEBUG */
import { ajax } from 'tinyjx';

const retryMap = {}, isFn = f => typeof f === 'function';
let reqId = Date.now();

function request(opts) {
	let { url, method, type, data, beforeSend, afterResponse, complete, retry = 0, options = {}, id = ++reqId } = opts, reqData;
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
			success(data, xhr) {
				delete retryMap[id];
				// 算了, 这个异常还是让它直接crash掉吧, 和后面保持一致
				isFn(afterResponse) && afterResponse(data, xhr, url, reqData);
				rs({
					data,
					next() {
						isFn(complete) && complete(data, xhr, url, reqData);
					}
				});
			},
			error(err, xhr) {
				if (retryMap[id] < retry + 1) {
					rs(request(opts));
				} else {
					delete retryMap[id];
					isFn(afterResponse) && afterResponse(undefined, xhr, url, reqData);
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

/**
 * { beforeSend, afterResponse, retry }
 */
export default function (opts = {}) {
	return {
		...['get', 'head'].reduce((prev, cur) =>
			(prev[cur] = ({ name, meta, url, options }) => request({
				...opts,
				url,
				method: cur.toUpperCase(),
				options
			}), prev), {}),
		...['post', 'put', 'patch', 'delete', 'options'].reduce((prev, cur) =>
			(prev[cur] = ({ name, meta, url, body, options, type }) => request({
				...opts,
				url,
				type,
				options,
				method: cur.toUpperCase(),
				data: body
			}), prev), {})
	};
}
