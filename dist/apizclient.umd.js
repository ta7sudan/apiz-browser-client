(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('tinyjx')) :
  typeof define === 'function' && define.amd ? define(['tinyjx'], factory) :
  (global = global || self, global.ApizClient = factory(global.tinyjx));
}(this, function (tinyjx) { 'use strict';

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

  const isFn = f => typeof f === 'function';

  function isPromise(p) {
    return !!(p && typeof p.then === 'function');
  }

  async function pRetry(fn, {
    retry,
    beforeRetry
  }, alreadyTried = 1) {
    let rst = null;

    if (retry < 0 || retry > Number.MAX_SAFE_INTEGER && retry !== Infinity) {
      throw new Error('retry must be between 0 to Number.MAX_SAFE_INTEGER or be Infinity');
    }

    try {
      rst = fn.call(this);

      if (isPromise(rst)) {
        rst = await rst;
      }
    } catch (e) {
      if (beforeRetry) {
        beforeRetry(alreadyTried, e);
      }

      if (retry) {
        return pRetry(fn, {
          // tslint:disable-next-line
          retry: --retry,
          beforeRetry
        }, // tslint:disable-next-line
        ++alreadyTried);
      } else {
        throw e;
      }
    }

    return rst;
  }

  function createRequest({
    method,
    beforeSend,
    afterResponse,
    error,
    retry = 0
  }) {
    return async function request({
      url,
      options,
      body,
      headers,
      type,
      handleError = true
    }) {
      let $options;

      if (options) {
        $options = _extends({}, options, {
          url,
          method
        });
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

      let result, e;

      try {
        // tslint:disable-next-line
        result = await pRetry(() => new Promise((rs, rj) => {
          tinyjx.ajax(_extends({}, $options, {
            success(data, xhr) {
              rs({
                data,
                xhr
              });
            },

            recoverableError(err, data, xhr) {
              rj({
                status: 'recoverableError',
                data,
                xhr,
                err
              });
            },

            unrecoverableError(err, xhr) {
              rj({
                status: 'unrecoverableError',
                data: undefined,
                xhr,
                err
              });
            }

          }));
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
        await afterResponse(resData, status, $xhr, url, body);
      }

      if (e) {
        let recoverable = false;

        if (isFn(error) && handleError) {
          recoverable = await error(e.status, e.err, e.data, e.xhr);
        } // 返回false, 不可恢复


        if (recoverable === false || recoverable === undefined) {
          throw new Error(`Error: ${e.err.message}, URL: ${url}, Method: ${method}`); // 有非undefined的返回值, 可以恢复, 返回值作为结果
        } else {
          return recoverable;
        }
      } else {
        return result;
      }
    };
  }
  /**
   * { beforeSend, afterResponse, retry }
   */


  function index (opts = {}) {
    return ['get', 'head', 'post', 'put', 'patch', 'delete', 'options'].reduce((prev, cur) => (prev[cur] = createRequest(_extends({}, opts, {
      method: cur.toUpperCase()
    })), prev), {});
  }

  return index;

}));
//# sourceMappingURL=apizclient.umd.js.map
