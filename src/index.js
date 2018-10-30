/* global DEBUG */
import { ajax } from 'tinyjx';

function request({ url, method, type, data, options = {}, beforeSend, afterResponse }) {
	if (data) {
		options.data = data;
		options.dataType = type;
	}
	options.url = url;
	options.method = method;
	return new Promise((rs, rj) => {
		ajax({
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
			(prev[cur] = (url, bodyOrOptions, type, isOptions) => request({
				url,
				type,
				method: cur.toUpperCase(),
				data: isOptions ? undefined : bodyOrOptions,
				options: isOptions ? bodyOrOptions : undefined,
				...opts
			}), prev), {})
	};
}
