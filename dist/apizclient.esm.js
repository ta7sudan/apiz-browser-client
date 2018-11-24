import { ajax } from 'tinyjx';

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
    ajax(_extends({
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

export default index;
//# sourceMappingURL=apizclient.esm.js.map
