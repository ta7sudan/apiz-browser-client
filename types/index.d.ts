interface Options {
	beforeSend?(xhr: XMLHttpRequest): void | boolean,
	afterResponse?(resData: any, xhr: XMLHttpRequest, url: string, reqData: any): void,
	onError?(err: Error, xhr: XMLHttpRequest, url: string, reqData: any): void,
	retry?: number
};

export default function (options?: Options): object;