(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('tinyjx')) :
	typeof define === 'function' && define.amd ? define(['tinyjx'], factory) :
	(global = global || self, global.ApizClient = factory(global.tinyjx));
}(this, function (tinyjx) { 'use strict';

	/* global false */

	const retryMap = {},
	      isFn = f => typeof f === 'function';

	let reqId = Date.now();

	function request(opts) {
	  // tslint:disable-next-line
	  let {
	    url,
	    method,
	    type,
	    data,
	    beforeSend,
	    afterResponse,
	    complete,
	    retry = 0,
	    options = {},
	    id = ++reqId
	  } = opts,
	      reqData;
	  retryMap[id] = -~retryMap[id];
	  opts.id = id;

	  if (data) {
	    reqData = options.data = data;
	    options.contentType = type;
	  }

	  options.url = url;
	  options.method = method;
	  return new Promise((rs, rj) => {
	    tinyjx.ajax(Object.assign({
	      beforeSend,

	      // $防止遮蔽
	      success($data, xhr) {
	        delete retryMap[id]; // 算了, 这个异常还是让它直接crash掉吧, 和后面保持一致

	        isFn(afterResponse) && afterResponse($data, 'success', xhr, url, reqData);
	        rs({
	          data: $data,

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
	      }

	    }, options));
	  });
	}
	/**
	 * { beforeSend, afterResponse, retry }
	 */


	function index (opts = {}) {
	  return Object.assign({}, ['get', 'head'].reduce((prev, cur) => (prev[cur] = ({
	    name,
	    meta,
	    url,
	    options
	  }) => request(Object.assign({}, opts, {
	    url,
	    method: cur.toUpperCase(),
	    options
	  })), prev), {}), ['post', 'put', 'patch', 'delete', 'options'].reduce((prev, cur) => (prev[cur] = ({
	    name,
	    meta,
	    url,
	    body,
	    options,
	    type
	  }) => request(Object.assign({}, opts, {
	    url,
	    type,
	    options,
	    method: cur.toUpperCase(),
	    data: body
	  })), prev), {}));
	}

	return index;

}));
//# sourceMappingURL=apizclient.umd.js.map
