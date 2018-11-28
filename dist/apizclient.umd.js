(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('tinyjx')) :
  typeof define === 'function' && define.amd ? define(['tinyjx'], factory) :
  (global.apizClient = factory(global.tinyjx));
}(this, (function (tinyjx) { 'use strict';

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  const retryMap = {};
  let reqId = Date.now();

  function request(opts) {
    let {
      url,
      method,
      type,
      data,
      beforeSend,
      afterResponse,
      retry = 0,
      options = {},
      id = ++reqId
    } = opts;
    retryMap[id] = -~retryMap[id];
    opts.id = id;

    if (data) {
      options.data = data;
      options.contentType = type;
    }

    options.url = url;
    options.method = method;
    return new Promise((rs, rj) => {
      tinyjx.ajax(_extends({
        beforeSend,

        success(data, xhr) {
          delete retryMap[id]; // 算了, 这个异常还是让它直接crash掉吧, 和后面保持一致

          typeof afterResponse === 'function' && afterResponse(data, xhr, url, options.data);
          rs(data);
        },

        error(err, xhr) {
          if (retryMap[id] < retry + 1) {
            rs(request(opts));
          } else {
            delete retryMap[id];
            typeof afterResponse === 'function' && afterResponse(null, xhr, url, options.data);
            rj(err);
          }
        }

      }, options));
    });
  }
  /**
   * { beforeSend, afterResponse, retry }
   */


  function index (opts = {}) {
    return _extends({}, ['get', 'head'].reduce((prev, cur) => (prev[cur] = ({
      name,
      meta,
      url,
      options
    }) => request(_extends({}, opts, {
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
    }) => request(_extends({}, opts, {
      url,
      type,
      options,
      method: cur.toUpperCase(),
      data: body
    })), prev), {}));
  }

  return index;

})));
//# sourceMappingURL=apizclient.umd.js.map
