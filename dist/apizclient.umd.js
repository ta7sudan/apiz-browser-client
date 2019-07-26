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
    return function request({
      url,
      options,
      body,
      headers,
      type,
      handleError = true
    }) {
      let $options,
          count = 0;

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

      return pRetry(() => {
        // tslint:disable-next-line
        return new Promise((rs, rj) => {
          tinyjx.ajax(_extends({}, $options, {
            beforeSend(xhr) {
              if (!count && isFn(beforeSend)) {
                return beforeSend(xhr);
              }
            },

            success(data, xhr) {
              isFn(afterResponse) && count === retry && afterResponse(data, 'success', xhr, url, body);
              rs({
                data,
                xhr
              });
            },

            recoverableError(err, data, xhr) {
              isFn(afterResponse) && count === retry && afterResponse(data, 'error', xhr, url, body);
              isFn(error) && count === retry && handleError && error('recoverableError', err, data, xhr);
              rj({
                err,
                data
              });
            },

            unrecoverableError(err, xhr) {
              isFn(error) && count === retry && handleError && error('unrecoverableError', err, undefined, xhr);
              rj({
                err,
                data: undefined
              });
            }

          }));
        });
      }, {
        retry,

        beforeRetry() {
          ++count;
        }

      });
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
