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
        afterResponse(data, xhr) {
            console.log(data);
        }
    })
})
```

