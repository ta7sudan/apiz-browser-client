/* global DEBUG */
import { ajax } from 'tinyjx';

const retryMap = {};
let reqId = Date.now();

function request(opts) {
	let { url, method, type, data, beforeSend, afterResponse, retry = 0, options = {}, id = ++reqId } = opts;
	retryMap[id] = -~retryMap[id];
	opts.id = id;
	if (data) {
		options.data = data;
		options.contentType = type;
	}
	options.url = url;
	options.method = method;
	return new Promise((rs, rj) => {
		ajax({
			beforeSend,
			success(data, xhr) {
				delete retryMap[id];
				try {
					typeof afterResponse === 'function' && afterResponse(data, xhr, url, options.data);
				} catch (e) {
					rj(e);
					return;
				}
				rs(data);
			},
			error(err) {
				if (retryMap[id] < retry + 1) {
					rs(request(opts));
				} else {
					delete retryMap[id];
					rj(err);
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
