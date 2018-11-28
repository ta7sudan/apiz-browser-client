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

const retryMap = {},
      isFn = f => typeof f === 'function';

let reqId = Date.now();

function request(opts) {
  let {
    url,
    method,
    type,
    data,
    beforeSend,
    afterResponse,
    onError,
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
        delete retryMap[id]; // 算了, 这个异常还是让它直接crash掉吧, 和后面保持一致

        isFn(afterResponse) && afterResponse(data, xhr, url, options.data);
        rs(data);
      },

      error(err, xhr) {
        if (retryMap[id] < retry + 1) {
          rs(request(opts));
        } else {
          delete retryMap[id];
          isFn(afterResponse) && afterResponse(null, xhr, url, options.data); // 受限于Promise, 没办法知道最后一个Promise什么时候结束,
          // 只能通过传入一个next, 由用户自己决定要不要触发全局异常处理,
          // 但是这增加了使用者的心智负担, 如果不记得调用next, 则全局异常处理
          // 不会被调用, 理想情况应当是不记得自行处理异常则默认fallback到全局
          // 异常, 但是没办法做到, 只能以这样一种蹩脚的形式处理了, 有好过没有

          rj({
            err,

            next() {
              isFn(onError) && onError(err, xhr, url, options.data);
            }

          });
        }
      }

    }, options));
  });
}
/**
 * { beforeSend, afterResponse, onError, retry }
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
