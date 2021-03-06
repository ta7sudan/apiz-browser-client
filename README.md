# apiz-browser-client
apiz-browser-client implements the `APIzClient` interface for browser, based on [tinyjx](https://github.com/ta7sudan/tinyjx), so you can use options of tinyjx.



## Usage

```javascript
import { APIz } from 'apiz-ng';
import apizClient from 'apiz-browser-client';

const apiMeta = {
    getBook: {
        url: 'http://www.a.com'
    }
};

const apis = new APIz(apiMeta, {
    client: apizClient({
        beforeSend(xhr) {
            return false;
        },
        afterResponse(resData, status, xhr, url, reqData) {
            console.log(resData);
        },
        complete(resData, xhr, url, reqData) {
            console.log(resData);
        },
        retry: 3
    })
});

apis.getBook().then(({data, next}) => {
    console.log(data);
    next();
})
```

`beforeRequest` and  `afterResponse` are hooks of [tinyjx](https://github.com/ta7sudan/tinyjx).