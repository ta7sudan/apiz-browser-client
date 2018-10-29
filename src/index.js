/* global DEBUG */
import { ajax } from 'tinyjx';

// 这东西会定义两次, tinyjx中已经有了, 不知道有没有办法去掉, 虽然只有一行就是了
const ArrayBufferView = Object.getPrototypeOf(Object.getPrototypeOf(new Uint8Array())).constructor;

function request({ url, method, type, options, beforeSend, afterResponse }) {
	let data;
	if (
		options instanceof Document ||
		options instanceof Blob ||
		options instanceof FormData ||
		options instanceof ArrayBuffer ||
		options instanceof ArrayBufferView ||
		typeof options === 'string'
	) {
		data = options;
		options = {
			url,
			method,
			data
		};
	} else if (Object.prototype.toString.call(options) === '[object Object]') {
		Object.assign(options, {
			url,
			method
		});
	} else {
		throw new TypeError('Options for tinyjx must be an object.');
	}
	return new Promise((rs, rj) => {
		ajax({
			dataType: type,
			beforeSend,
			success(data, xhr) {
				try {
					afterResponse(data, xhr);
				} catch (e) {
					rj(e);
					return;
				}
				rs(data);
			},
			error: rj,
			...options
		});
	});
}

/**
 * { beforeSend, afterResponse }
 */
export default function (opts = {}) {
	return {
		...['get', 'head'].reduce((prev, cur) =>
			(prev[cur] = (url, options) => request({
				url,
				method: cur.toUpperCase(),
				options,
				...opts
			}), prev), {}),
		...['post', 'put', 'patch', 'delete', 'options'].reduce((prev, cur) => 
			(prev[cur] = (url, bodyOrOptions, type) => request({
				url,
				type,
				method: cur.toUpperCase(),
				options: bodyOrOptions,
				...opts
			}), prev), {})
	};
}
